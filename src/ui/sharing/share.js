import './share.css';

const MAX_COMPRESSED_BYTES = 512 * 1024;
const MAX_SESSION_BYTES = 2 * 1024 * 1024;
const PREFIX = 'v1.';
const messages = {
  'zh-CN': {
    button: '分享', copied: '分享链接已复制，包含当前答案、草稿和笔记。',
    copiedLevel: '关卡链接已复制。打开后会从这道题的初始状态开始。',
    fallbackLevel: '请复制下面的关卡链接。打开后会从这道题的初始状态开始。',
    restored: '已从分享链接恢复局面。', fallback: '链接已生成，请复制下面的链接。',
    title: '分享当前局面', link: '分享链接', close: '关闭',
    invalid: '分享链接损坏或内容格式不正确，当前画布已保留。',
    unknownVersion: '这个分享链接使用了尚不支持的版本，当前画布已保留。',
    tooLarge: '当前局面超过分享大小限制，请减少积木或笔记后重试。',
    unsupported: '当前浏览器不支持压缩分享，请使用较新的 Chrome 或 Edge。',
    restoreFailed: '分享局面恢复失败，已保留原来的画布。',
    shareFailed: '无法生成分享链接，请稍后重试。'
  },
  en: {
    button: 'Share', copied: 'Share link copied, including current answers, scratch blocks, and notes.',
    copiedLevel: 'Level link copied. It opens the initial problem without your answer.',
    fallbackLevel: 'Copy the level link below. It opens the initial problem without your answer.',
    restored: 'Session restored from the share link.', fallback: 'Your link is ready. Copy it below.',
    title: 'Share session', link: 'Share link', close: 'Close',
    invalid: 'This share link is damaged or malformed. Your canvas has been kept.',
    unknownVersion: 'This share link uses an unsupported version. Your canvas has been kept.',
    tooLarge: 'This session exceeds the sharing size limit. Remove some blocks or notes and try again.',
    unsupported: 'This browser does not support compressed sharing. Use a recent Chrome or Edge.',
    restoreFailed: 'The shared session could not be restored. Your original canvas has been kept.',
    shareFailed: 'The share link could not be created. Please try again.'
  }
};

class ShareError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Validate the transport envelope before any workspace changes are made. */
export function validateSession(session) {
  if (!isObject(session)) throw new ShareError('invalid');
  if (session.version !== 1) throw new ShareError('unknownVersion');
  if (!['custom', 'level'].includes(session.mode) || !isObject(session.workspace)) throw new ShareError('invalid');
  if (session.mode === 'level' && (typeof session.levelId !== 'string' || !session.levelId || session.levelId.length > 80)) {
    throw new ShareError('invalid');
  }
  if (session.notes !== undefined && !Array.isArray(session.notes)) throw new ShareError('invalid');
  const blocks = session.workspace.blocks;
  if (blocks !== undefined && (!isObject(blocks) || !Array.isArray(blocks.blocks))) throw new ShareError('invalid');
  const pending = [{ value: session, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const { value, depth } = pending.pop();
    if (++count > 100000 || depth > 100) throw new ShareError('tooLarge');
    if (value !== null && typeof value === 'object') {
      for (const child of Object.values(value)) pending.push({ value: child, depth: depth + 1 });
    }
  }
  return session;
}

function requireCompression() {
  if (typeof CompressionStream !== 'function' || typeof DecompressionStream !== 'function') throw new ShareError('unsupported');
}

async function readLimited(stream, maximum) {
  const reader = stream.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel().catch(() => {});
        throw new ShareError('tooLarge');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new ShareError('invalid');
  if (value.length > Math.ceil(MAX_COMPRESSED_BYTES * 4 / 3)) throw new ShareError('tooLarge');
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  if (bytes.byteLength > MAX_COMPRESSED_BYTES) throw new ShareError('tooLarge');
  return bytes;
}

/** Return the versioned, compressed value used after #workshop=. */
export async function encodeSession(session) {
  requireCompression(); validateSession(session);
  let json;
  try { json = JSON.stringify(session); } catch (_) { throw new ShareError('invalid'); }
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > MAX_SESSION_BYTES) throw new ShareError('tooLarge');
  const compressed = await readLimited(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate')), MAX_COMPRESSED_BYTES);
  return PREFIX + toBase64Url(compressed);
}

export async function decodeSession(encoded) {
  requireCompression();
  if (typeof encoded !== 'string' || !encoded.startsWith(PREFIX)) throw new ShareError('unknownVersion');
  try {
    const compressed = fromBase64Url(encoded.slice(PREFIX.length));
    const bytes = await readLimited(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')), MAX_SESSION_BYTES);
    return validateSession(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch (error) {
    if (error instanceof ShareError) throw error;
    throw new ShareError('invalid');
  }
}

export function createSharing({ exportSession, importSession, button, locale, status }) {
  const word = key => (messages[locale()] || messages.en)[key];
  let busy = false, revision = 0, dialogMode = 'custom';
  const dialog = document.createElement('dialog'); dialog.className = 'share-dialog';
  const title = document.createElement('h2'), description = document.createElement('p');
  const input = document.createElement('input'); input.readOnly = true; input.type = 'text';
  const close = document.createElement('button'); close.type = 'button';
  close.addEventListener('click', () => dialog.close());
  dialog.append(title, description, input, close); document.body.append(dialog);

  function setLocale() {
    if (button) button.textContent = word('button');
    title.textContent = word('title'); description.textContent = word(dialogMode === 'level' ? 'fallbackLevel' : 'fallback');
    input.setAttribute('aria-label', word('link')); close.textContent = word('close');
  }
  setLocale();

  function showLink(url, mode) {
    dialogMode = mode; setLocale(); input.value = url;
    if (!dialog.open) dialog.showModal();
    input.focus(); input.select();
  }

  let timer = null, pristine = true, restoring = false, destroyed = false;
  let restorePromise = null, restoringUrl = null, lastError = null;

  function report(error, fallback) {
    const code = error instanceof ShareError ? error.code : fallback;
    if (lastError !== code) status(word(code), 'err');
    lastError = code;
  }

  async function flushSync() {
    clearTimeout(timer); timer = null;
    if (destroyed) return '';
    if (restoring) { await restorePromise; return flushSync(); }
    const thisRevision = revision;
    const short = pristine;
    try {
      const session = await exportSession(), url = new URL(location.href);
      if (session.mode === 'level') {
        if (session.version !== 1 || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(session.levelId || '')) throw new ShareError('invalid');
        url.searchParams.set('level', session.levelId);
      } else url.searchParams.delete('level');
      if (session.mode === 'level' && short) url.hash = '';
      else url.hash = 'workshop=' + await encodeSession(session);
      if (destroyed || restoring) return '';
      // A newer edit or navigation must win over this compression result.
      if (thisRevision !== revision) return flushSync();
      if (url.href !== location.href) history.replaceState(null, '', url.href);
      lastError = null;
      return url.href;
    } catch (error) {
      if (thisRevision === revision && !destroyed) report(error, 'shareFailed');
      return '';
    }
  }

  function scheduleSync(options = {}) {
    if (restoring || destroyed) return;
    pristine = options.pristine === true;
    revision++;
    clearTimeout(timer);
    timer = setTimeout(() => { void flushSync(); }, 150);
  }

  function resetToLevel() { scheduleSync({ pristine: true }); }

  async function share() {
    if (busy) return '';
    busy = true; if (button) button.disabled = true;
    try {
      const url = await flushSync();
      if (!url) return '';
      const short = !new URL(url).hash && new URL(url).searchParams.has('level');
      let copied = false;
      try { await navigator.clipboard.writeText(url); copied = true; } catch (_) { /* Provide a selectable link. */ }
      if (!copied) showLink(url, short ? 'level' : 'custom');
      const key = short ? (copied ? 'copiedLevel' : 'fallbackLevel') : (copied ? 'copied' : 'fallback');
      status(word(key), copied ? 'ok' : 'notice');
      return url;
    } catch (error) {
      report(error, 'shareFailed');
      return '';
    } finally { busy = false; if (button) button.disabled = false; }
  }

  function restoreFromUrl() {
    const href = location.href;
    if (restoring && restoringUrl === href) return restorePromise;
    clearTimeout(timer); timer = null;
    const encoded = new URLSearchParams(location.hash.slice(1)).get('workshop');
    const levelId = new URL(href).searchParams.get('level');
    const thisRevision = ++revision;
    restoring = true; restoringUrl = href;
    restorePromise = (async () => {
      try {
        if (encoded === null && levelId === null) {
          pristine = true;
          return false;
        }
        let session;
        if (encoded !== null) session = await decodeSession(encoded);
        else {
          if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(levelId)) throw new ShareError('invalid');
          session = { version: 1, mode: 'level', levelId };
        }
        if (thisRevision !== revision || destroyed) return false;
        const previous = await exportSession();
        if (thisRevision !== revision || destroyed) return false;
        try { await importSession(session); }
        catch (_) {
          try { await importSession(previous); } catch (_) { /* Importers also preserve their own backup. */ }
          throw new ShareError('restoreFailed');
        }
        if (thisRevision !== revision || destroyed) return false;
        pristine = encoded === null;
        lastError = null;
        status(word('restored'), 'ok');
        return true;
      } catch (error) {
        if (thisRevision === revision && !destroyed) report(error, 'restoreFailed');
        return false;
      } finally {
        if (thisRevision === revision) {
          restoring = false; restoringUrl = null;
          // Initialization without a link still makes the current canvas copyable.
          if (encoded === null && levelId === null && !destroyed) void flushSync();
        }
      }
    })();
    return restorePromise;
  }
  const onClick = () => { void share(); };
  const onNavigation = () => { void restoreFromUrl(); };
  button?.addEventListener('click', onClick);
  window.addEventListener('hashchange', onNavigation);
  window.addEventListener('popstate', onNavigation);
  return { share, restoreFromUrl, setLocale, scheduleSync, resetToLevel, flushSync,
    destroy() {
      destroyed = true; revision++; clearTimeout(timer);
      button?.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onNavigation);
      window.removeEventListener('popstate', onNavigation); dialog.remove();
    }
  };
}
