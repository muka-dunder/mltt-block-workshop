import './notes.css';
import { versionedStorageKey } from '../version.js';
import { TUTORIALS as LEGACY_TUTORIALS } from './tutorials.js';
import { ANSWER_TUTORIALS as LEGACY_ANSWERS } from './answer-tutorials.js';
import { JOURNEY_GUIDES } from './journey-guides.js';
import { JOURNEY_ANSWERS } from './journey-answers.js';
const TUTORIALS = { ...LEGACY_TUTORIALS, ...JOURNEY_GUIDES };
const ANSWER_TUTORIALS = { ...LEGACY_ANSWERS, ...JOURNEY_ANSWERS };

const WORDS = {
  'zh-CN': { note: '注释', tutorial: '题目解说', answerTutorial: '解题思路', placeholder: '写下解释、想法或公式，例如 λx. x', collapse: '折叠', expand: '展开', remove: '删除注释', attach: '附着到选中的积木', detach: '解除附着', restore: '恢复原位', attached: '跟随积木', free: '自由摆放', noSelection: '先选中一个积木，再点击附着。' },
  en: { note: 'Note', tutorial: 'Problem guide', answerTutorial: 'Solution walkthrough', placeholder: 'Write an explanation, idea or formula, e.g. λx. x', collapse: 'Collapse', expand: 'Expand', remove: 'Delete note', attach: 'Attach to selected block', detach: 'Detach', restore: 'Restore position', attached: 'Following block', free: 'Free position', noSelection: 'Select a block before attaching this note.' }
};

export function createNotes({ workspace, host, locale, getLevel, getAnswer, onChange, getAnswerMode = () => false }) {
  const Blockly = window.Blockly;
  const shelfWidth = () => {
    const flyout = workspace.getFlyout();
    return flyout && !flyout.autoClose && flyout.isVisible() ? flyout.getWidth() : 0;
  };
  const layer = document.createElement('div');
  layer.className = 'notes-layer';
  host.parentElement.append(layer);
  const cards = new Map();
  let items = [], levelId = null, paused = false, destroyed = false;
  const text = key => (WORDS[locale()] || WORDS.en)[key];
  const storageKey = id => versionedStorageKey('notes.' + id);
  const uid = () => globalThis.crypto?.randomUUID?.() || 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const blockFor = note => {
    if (note.anchor !== 'answer') return workspace.getBlockById(note.blockId);
    const answer = getAnswer();
    return answer && workspace.getBlockById(answer.id) === answer ? answer
      : workspace.getBlocksByType('tt_problem', false)[0] || workspace.getBlocksByType('tt_answer', false)[0];
  };
  function worldPosition(note) {
    const block = note.blockId || note.anchor ? blockFor(note) : null;
    if (block) {
      const p = block.getRelativeToSurfaceXY();
      if (note.tutorial && note.placement === 'right') {
        const rect = block.getSvgRoot().getBoundingClientRect(), hostRect = host.getBoundingClientRect();
        const origin = workspace.getOriginOffsetInPixels();
        const available = host.clientWidth - shelfWidth() - 32;
        const below = rect.width + 24 + note.width > available;
        note.dx = ((below ? rect.left : rect.right + 24) - hostRect.left - origin.x) / workspace.scale - p.x;
        note.dy = ((below ? rect.bottom + 24 : rect.top) - hostRect.top - origin.y) / workspace.scale - p.y;
      }
      return { x: p.x + note.dx, y: p.y + note.dy };
    }
    return { x: note.x, y: note.y };
  }
  function save(notify = false) {
    if (!levelId || paused || destroyed) return;
    for (const note of items) Object.assign(note, worldPosition(note));
    try { localStorage.setItem(storageKey(levelId), JSON.stringify(items)); } catch (_) { /* Notes remain usable when storage is unavailable. */ }
    if (notify) onChange?.();
  }
  function fitTutorial(note) {
    if (!note.tutorial || note.manualSize) return;
    const available = host.clientWidth - shelfWidth() - 32;
    note.width = Math.round(Math.min(520, Math.max(220, available * 0.55)));
    note.height = Math.min(720, Math.max(320, host.clientHeight - 64));
  }
  function layout() {
    if (destroyed) return;
    const rect = host.getBoundingClientRect(), parent = host.parentElement.getBoundingClientRect();
    Object.assign(layer.style, { left: rect.left - parent.left + 'px', top: rect.top - parent.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
    const origin = workspace.getOriginOffsetInPixels();
    for (const note of items) {
      const card = cards.get(note.id);
      if (!card) continue;
      fitTutorial(note);
      card.style.width = note.width + 'px';
      card.style.height = (note.collapsed ? 38 : note.height) + 'px';
      const p = worldPosition(note);
      Object.assign(card.style, { left: origin.x + p.x * workspace.scale + 'px', top: origin.y + p.y * workspace.scale + 'px' });
    }
  }
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const note = items.find(n => n.id === entry.target.dataset.noteId);
      if (!note || note.collapsed) continue;
      const width = entry.target.offsetWidth, height = entry.target.offsetHeight;
      if (note.width !== width || note.height !== height) { note.width = width; note.height = height; save(); }
    }
  });
  const hostObserver = new ResizeObserver(layout);
  hostObserver.observe(host);
  const answerObserver = new ResizeObserver(layout);

  function button(label, content, action, actionName) {
    const b = document.createElement('button');
    b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.textContent = content;
    if (actionName) b.dataset.action = actionName;
    b.addEventListener('click', e => { e.stopPropagation(); action(); });
    return b;
  }
  function updateCard(note) {
    const card = cards.get(note.id);
    const answerMode = note.tutorial && getAnswerMode();
    const titleKey = note.tutorial ? (answerMode ? 'answerTutorial' : 'tutorial') : 'note';
    card.dataset.explanationMode = note.tutorial ? (answerMode ? 'answer' : 'problem') : 'note';
    card.classList.toggle('is-collapsed', !!note.collapsed);
    card.classList.toggle('is-tutorial', !!note.tutorial);
    card.style.width = note.width + 'px';
    card.style.height = (note.collapsed ? 38 : note.height) + 'px';
    const header = card.querySelector('.note-header');
    header.replaceChildren();
    const title = document.createElement('span'); title.className = 'note-title'; title.textContent = text(titleKey);
    title.title = text(note.blockId || note.anchor ? 'attached' : 'free');
    header.append(title);
    if (note.tutorial) header.append(button(text('restore'), '↺', restoreTutorial, 'restore'));
    else {
      const attached = !!(note.blockId || note.anchor);
      header.append(button(text(attached ? 'detach' : 'attach'), attached ? '↗' : '⌖', () => {
        if (attached) {
          Object.assign(note, worldPosition(note)); delete note.blockId; delete note.anchor;
        } else {
          const selected = Blockly.getSelected();
          if (!selected || selected.workspace !== workspace) { card.querySelector('textarea').placeholder = text('noSelection'); return; }
          const p = selected.getRelativeToSurfaceXY();
          note.blockId = selected.id; note.anchor = !getLevel()?.custom && ['tt_answer', 'tt_problem'].includes(selected.type) ? 'answer' : null;
          note.dx = note.x - p.x; note.dy = note.y - p.y;
        }
        updateCard(note); layout(); save(true);
      }, attached ? 'detach' : 'attach'));
    }
    header.append(button(text(note.collapsed ? 'expand' : 'collapse'), note.collapsed ? '＋' : '−', () => { note.collapsed = !note.collapsed; updateCard(note); save(true); }, 'collapse'));
    if (!note.tutorial) header.append(button(text('remove'), '×', () => {
      resizeObserver.unobserve(card); card.remove(); cards.delete(note.id); items = items.filter(n => n !== note); save(true);
    }, 'delete'));
    const body = card.querySelector('textarea');
    body.readOnly = !!note.tutorial;
    body.placeholder = text('placeholder');
    body.setAttribute('aria-label', text(titleKey));
    const tutorials = answerMode ? ANSWER_TUTORIALS : TUTORIALS;
    body.value = note.tutorial ? (tutorials[levelId]?.[locale()] || tutorials[levelId]?.en || '') : note.content;
  }
  function mount(note) {
    const card = document.createElement('article'); card.className = 'note-card'; card.dataset.noteId = note.id; card.dataset.kind = note.tutorial ? 'tutorial' : 'user';
    const header = document.createElement('div'); header.className = 'note-header';
    const body = document.createElement('textarea'); body.spellcheck = false;
    const resizeHandle = document.createElement('div'); resizeHandle.className = 'note-resize-handle'; resizeHandle.setAttribute('aria-hidden', 'true');
    card.append(header, body, resizeHandle); layer.append(card); cards.set(note.id, card);
    resizeHandle.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const startX = e.clientX, startY = e.clientY, startWidth = note.width, startHeight = note.height;
      resizeHandle.setPointerCapture(e.pointerId);
      const move = event => {
        note.manualSize = true;
        note.width = Math.max(180, startWidth + event.clientX - startX);
        note.height = Math.max(100, startHeight + event.clientY - startY);
        card.style.width = note.width + 'px'; card.style.height = note.height + 'px';
      };
      const end = () => { resizeHandle.removeEventListener('pointermove', move); resizeHandle.removeEventListener('pointerup', end); resizeHandle.removeEventListener('pointercancel', end); save(true); };
      resizeHandle.addEventListener('pointermove', move); resizeHandle.addEventListener('pointerup', end); resizeHandle.addEventListener('pointercancel', end);
    });
    card.addEventListener('keydown', e => e.stopPropagation());
    card.addEventListener('keyup', e => e.stopPropagation());
    body.addEventListener('input', () => { note.content = body.value; save(true); });
    header.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault(); e.stopPropagation();
      const initial = worldPosition(note), startX = e.clientX, startY = e.clientY;
      const oldDx = note.dx, oldDy = note.dy;
      header.setPointerCapture(e.pointerId);
      const move = event => {
        const dx = (event.clientX - startX) / workspace.scale, dy = (event.clientY - startY) / workspace.scale;
        if (note.tutorial) delete note.placement;
        note.x = initial.x + dx; note.y = initial.y + dy;
        if (note.blockId || note.anchor) { note.dx = oldDx + dx; note.dy = oldDy + dy; }
        layout();
      };
      const end = () => { header.removeEventListener('pointermove', move); header.removeEventListener('pointerup', end); header.removeEventListener('pointercancel', end); save(true); };
      header.addEventListener('pointermove', move); header.addEventListener('pointerup', end); header.addEventListener('pointercancel', end);
    });
    updateCard(note); resizeObserver.observe(card);
  }
  function resetTutorial(note) {
    note.anchor = 'answer'; note.blockId = getAnswer()?.id;
    note.dx = (getAnswer()?.getHeightWidth().width || 0) + 24 / workspace.scale; note.dy = 0;
    note.manualSize = false; fitTutorial(note); note.collapsed = false;
    note.tutorialVersion = 6; note.placement = 'right';
    Object.assign(note, worldPosition(note));
  }
  function focusTutorial() {
    const note = items.find(n => n.tutorial), answer = getAnswer();
    if (!note || !answer) return;
    let shelf = shelfWidth();
    let available = host.clientWidth - shelf - 32;
    if (note.placement === 'right') {
      fitTutorial(note);
      updateCard(note);
    }
    shelf = shelfWidth();
    available = host.clientWidth - shelf - 32;
    const actual = answer.getSvgRoot().getBoundingClientRect(), hostRect = host.getBoundingClientRect();
    const below = actual.width + 24 + note.width > available;
    const totalWidth = below ? Math.max(actual.width, note.width) : actual.width + 24 + note.width;
    const totalHeight = below ? actual.height + 24 + (note.collapsed ? 38 : note.height)
      : Math.max(actual.height, note.collapsed ? 38 : note.height);
    const targetX = shelf + 16 + Math.max(0, (available - totalWidth) / 2);
    const targetY = Math.max(24, (host.clientHeight - totalHeight) / 2);
    workspace.scroll(workspace.scrollX + targetX - (actual.left - hostRect.left),
      workspace.scrollY + targetY - (actual.top - hostRect.top));
    layout(); save();
  }
  function restoreTutorial() {
    if (!TUTORIALS[levelId]) return;
    let note = items.find(n => n.tutorial);
    if (!note) { note = { id: 'tutorial-' + levelId, tutorial: true, content: '' }; items.push(note); resetTutorial(note); mount(note); }
    else { resetTutorial(note); updateCard(note); }
    focusTutorial(); layout(); save(true);
  }
  function add(blockId) {
    const block = blockId ? workspace.getBlockById(blockId) : null;
    const note = { id: uid(), content: '', width: 220, height: 150, collapsed: false, x: 0, y: 0 };
    if (block) {
      note.blockId = block.id; note.anchor = !getLevel()?.custom && ['tt_answer', 'tt_problem'].includes(block.type) ? 'answer' : null;
      note.dx = block.getHeightWidth().width + 24 / workspace.scale; note.dy = 0;
      const origin = workspace.getOriginOffsetInPixels(), p = block.getRelativeToSurfaceXY();
      if (origin.x + (p.x + note.dx) * workspace.scale + note.width > host.clientWidth - 10) {
        note.dx = Math.min(0, (host.clientWidth - note.width - 10 - origin.x) / workspace.scale - p.x);
        note.dy = origin.y + p.y * workspace.scale >= note.height + 25
          ? -(note.height + 25) / workspace.scale : block.getHeightWidth().height + 25 / workspace.scale;
      }
      Object.assign(note, worldPosition(note));
    } else {
      const origin = workspace.getOriginOffsetInPixels();
      const flyoutWidth = shelfWidth();
      note.x = (Math.max(flyoutWidth + 18, host.clientWidth / 2 - note.width / 2) - origin.x) / workspace.scale;
      note.y = (Math.max(20, host.clientHeight / 2 - note.height / 2) - origin.y) / workspace.scale;
    }
    items.push(note); mount(note); layout(); save(true); cards.get(note.id).querySelector('textarea').focus();
    return note.id;
  }
  function beforeLevelChange() { save(); paused = true; }
  function loadLevel(level = getLevel()) {
    answerObserver.disconnect();
    for (const card of cards.values()) { resizeObserver.unobserve(card); card.remove(); }
    cards.clear(); items = []; levelId = level.id; paused = false;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey(levelId)) || '[]');
      if (Array.isArray(stored)) items = stored.filter(n => n && typeof n.id === 'string' && Number.isFinite(n.x) && Number.isFinite(n.y)).map(n => ({ ...n, content: typeof n.content === 'string' ? n.content : '', width: Math.max(180, Math.min(800, Number(n.width) || 220)), height: Math.max(100, Math.min(800, Number(n.height) || 150)) }));
    } catch (_) { /* A damaged stored note must not prevent the game from loading. */ }
    for (const note of items) {
      if (note.tutorial && note.tutorialVersion !== 6) resetTutorial(note);
      if ((note.blockId || note.anchor) && !blockFor(note)) { delete note.blockId; delete note.anchor; }
      mount(note);
    }
    if (TUTORIALS[levelId] && !items.some(n => n.tutorial)) restoreTutorial();
    if (getAnswer()?.getSvgRoot()) answerObserver.observe(getAnswer().getSvgRoot());
    layout();
    const tutorial = items.find(n => n.tutorial && n.placement === 'right');
    if (tutorial && cards.get(tutorial.id).getBoundingClientRect().right > host.getBoundingClientRect().right) focusTutorial();
  }
  function clearUserNotes() {
    for (const note of items.filter(n => !n.tutorial)) { const card = cards.get(note.id); resizeObserver.unobserve(card); card.remove(); cards.delete(note.id); }
    items = items.filter(n => n.tutorial); save();
  }
  function exportState() {
    save();
    return items.map(note => ({ ...note }));
  }
  function importState(saved) {
    if (!Array.isArray(saved) || saved.length > 500) throw new Error('Invalid notes');
    const ids = new Set();
    const restored = saved.map(n => {
      if (!n || typeof n.id !== 'string' || ids.has(n.id) || !Number.isFinite(n.x) || !Number.isFinite(n.y)) throw new Error('Invalid note');
      ids.add(n.id);
      return { ...n, content: String(n.content || ''), tutorial: !!n.tutorial && !!TUTORIALS[levelId],
        width: Math.max(180, Math.min(800, Number(n.width) || 220)), height: Math.max(100, Math.min(800, Number(n.height) || 150)) };
    });
    for (const card of cards.values()) { resizeObserver.unobserve(card); card.remove(); }
    cards.clear(); items = restored;
    for (const note of items) {
      if ((note.blockId || note.anchor) && !blockFor(note)) { delete note.blockId; delete note.anchor; }
      mount(note);
    }
    layout(); save();
  }
  const listener = event => {
    if (paused) return;
    if (event.type === Blockly.Events.BLOCK_DELETE) {
      for (const note of items) {
        if ((note.blockId || note.anchor) && !blockFor(note)) { delete note.blockId; delete note.anchor; updateCard(note); }
      }
    }
    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.BLOCK_DELETE) save();
    layout();
  };
  workspace.addChangeListener(listener);
  const registry = Blockly.ContextMenuRegistry.registry, menuId = 'mltt_add_note';
  if (registry.getItem(menuId)) registry.unregister(menuId);
  registry.register({ id: menuId, scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: 25,
    displayText: () => text('note') + ' ＋', preconditionFn: scope => scope.block?.workspace === workspace && !scope.block.isInFlyout ? 'enabled' : 'hidden', callback: scope => add(scope.block.id) });
  return { add, loadLevel, beforeLevelChange, clearUserNotes, restoreTutorial, focusTutorial, refresh: layout, exportState, importState,
    setLocale() { for (const note of items) updateCard(note); layout(); },
    destroy() { save(); destroyed = true; workspace.removeChangeListener(listener); resizeObserver.disconnect(); hostObserver.disconnect(); answerObserver.disconnect(); registry.unregister(menuId); layer.remove(); },
    get notes() { return items.map(note => ({ ...note })); }
  };
}
