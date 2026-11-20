'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18749, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
    const errors = [], page = await context.newPage();
    await page.addInitScript(() => {
      window.__urlWrites = [];
      const original = history.replaceState;
      history.replaceState = function (...args) {
        window.__urlWrites.push({ url: String(args[2]).slice(0, 100), hashLength: new URL(args[2], location.href).hash.length, at: performance.now() });
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('test:urlchanged'));
        return result;
      };
    });
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18749/?level=L0');
    await page.waitForFunction(() => window.__mltt?.custom && __mltt.state.level.id === 'L0');
    await page.waitForFunction(() => location.search === '?level=L0' && !location.hash);
    const historyLength = await page.evaluate(() => history.length);

    async function waitPayload(tab, expected) {
      await tab.evaluate(async expected => {
        const { decodeSession } = await import('/src/ui/sharing/share.js');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { cleanup(); reject(new Error('URL payload did not reach ' + JSON.stringify(expected))); }, 30000);
          function cleanup() { clearTimeout(timeout); window.removeEventListener('test:urlchanged', check); }
          async function check() {
            const hash = location.hash, encoded = new URLSearchParams(hash.slice(1)).get('workshop');
            if (!encoded?.startsWith('v1.')) return;
            try {
              const session = await decodeSession(encoded);
              if (hash !== location.hash || (expected.mode && session.mode !== expected.mode)) return;
              const all = [];
              function visit(block) {
                if (!block) return;
                all.push(block);
                for (const input of Object.values(block.inputs || {})) { visit(input.block); visit(input.shadow); }
              }
              (session.workspace.blocks?.blocks || []).forEach(visit);
              const block = all.find(block => block.id === expected.id);
              if (expected.id && !block) return;
              if (expected.name && block.fields?.NAME !== expected.name) return;
              if (expected.absent && all.some(block => block.id === expected.absent)) return;
              if (expected.note && !session.notes?.some(note => note.content === expected.note)) return;
              if (expected.layout && block.extraState?.layout !== expected.layout) return;
              if (expected.locked && (block.editable !== false || block.movable !== false || block.deletable !== false)) return;
              if (expected.x !== undefined && block.x !== expected.x) return;
              cleanup(); resolve();
            } catch (error) { cleanup(); reject(error); }
          }
          window.addEventListener('test:urlchanged', check); void check();
        });
      }, expected);
    }

    const ids = await page.evaluate(() => {
      const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0];
      const reference = w.newBlock('tt_var'); reference.initSvg(); reference.render();
      const entry = root.getInputTargetBlock('TERM'), conditions = entry.getInputTargetBlock('CONTEXT');
      const local = conditions.sequenceChildren().find(binding => binding.getFieldValue('NAME') === 'x');
      reference.setFieldValue(LBM.encodeRef(local.ttBindingUid, 'x'), 'REF');
      root.getInputTargetBlock('TERM').getInput('TERM').connection.connect(reference.outputConnection);
      const scratch = w.newBlock('tt_zero'); scratch.initSvg(); scratch.render(); scratch.moveBy(90, 450);
      return { root: root.id, reference: reference.id, scratch: scratch.id };
    });
    await waitPayload(page, { mode: 'level', id: ids.reference });
    assert.equal(new URL(page.url()).search, '?level=L0');
    assert.equal(await page.evaluate(() => history.length), historyLength, 'Edits replace the current address without adding history entries');
    await page.click('#addNote');
    await page.locator('.note-card[data-kind="user"] textarea').fill('Notes also update the address');
    await waitPayload(page, { mode: 'level', id: ids.scratch, note: 'Notes also update the address' });
    const levelUrl = await page.evaluate(() => location.href);
    if (!new URL(levelUrl).hash) console.log('SOURCE URL WRITES', await page.evaluate(() => ({ writes: window.__urlWrites, ids: __mltt.workspace.getAllBlocks(false).map(block => block.id), status: document.querySelector('#status').textContent })), ids);
    assert(new URL(levelUrl).hash.startsWith('#workshop=v1.'), 'Copied preset address includes the edited session');
    const visitor = await context.newPage(); await visitor.goto(levelUrl);
    await visitor.waitForFunction(id => !!window.__mltt?.workspace.getBlockById(id), ids.reference).catch(async error => {
      console.log('RESTORE DIAGNOSTICS', await visitor.evaluate(() => ({ url: location.href, status: document.querySelector('#status').textContent,
        level: window.__mltt?.state.level.id, mode: window.__mltt?.custom.active,
        ids: window.__mltt?.workspace.getAllBlocks(false).map(block => ({ id: block.id, type: block.type })) })), ids);
      throw error;
    });
    assert(await visitor.evaluate(id => !!__mltt.workspace.getBlockById(id), ids.reference), await visitor.textContent('#status'));
    assert.equal(await visitor.evaluate(() => __mltt.custom.active), false);
    assert(await visitor.evaluate(id => !!__mltt.workspace.getBlockById(id), ids.scratch));
    assert.equal(await visitor.locator('.note-card[data-kind="user"] textarea').inputValue(), 'Notes also update the address');
    await visitor.evaluate(() => __mltt.check());
    assert.match(await visitor.textContent('#status'), /Correct|正确/);

    await page.evaluate(id => __mltt.workspace.getBlockById(id).moveBy(45, 0), ids.scratch);
    await waitPayload(page, { id: ids.scratch, x: 135 });
    await page.evaluate(id => __mltt.workspace.getBlockById(id).dispose(false), ids.scratch);
    await waitPayload(page, { id: ids.reference, absent: ids.scratch });
    await page.selectOption('#levelSelect', '1');
    await page.waitForFunction(() => location.search === '?level=L1' && !location.hash);
    assert(page.url().length < 80, 'Untouched presets keep short addresses');
    await page.selectOption('#modeSelect', 'custom');
    const custom = await page.evaluate(() => {
      const w = __mltt.workspace, root = w.newBlock('tt_problem'); root.initSvg(); root.render();
      const term = w.newBlock('tt_zero'); term.initSvg(); term.render();
      root.getInput('TERM').connection.connect(term.outputConnection);
      for (let i = 0; i < 12; i++) root.setFieldValue('Draft ' + i, 'NAME');
      return { root: root.id, term: term.id };
    });
    await waitPayload(page, { mode: 'custom', id: custom.root, name: 'Draft 11' });
    assert.equal(new URL(page.url()).searchParams.has('level'), false);
    const judgment = await page.evaluate(() => {
      const w = __mltt.workspace, block = w.newBlock('tt_judgment'); block.initSvg(); block.render();
      block.setJudgmentLayout('stacked'); block.moveBy(120, 260); return block.id;
    });
    await waitPayload(page, { id: judgment, layout: 'stacked' });
    await page.selectOption('#languageSelect', 'zh-CN');
    await waitPayload(page, { id: judgment, layout: 'stacked' });
    await page.evaluate(id => Blockly.ContextMenuRegistry.registry.getItem('mltt_lock_part').callback({ block: __mltt.workspace.getBlockById(id) }), custom.term);
    await waitPayload(page, { id: custom.term, locked: true });
    const customUrl = await page.evaluate(() => location.href);
    const customVisitor = await context.newPage(); await customVisitor.goto(customUrl);
    await customVisitor.waitForFunction(id => !!window.__mltt?.custom.active && !!__mltt.workspace.getBlockById(id), custom.root);
    assert.equal(await customVisitor.evaluate(id => __mltt.workspace.getBlockById(id).getFieldValue('NAME'), custom.root), 'Draft 11');
    assert.equal(await customVisitor.evaluate(id => __mltt.workspace.getBlockById(id).ttLayout, judgment), 'stacked');
    assert.equal(await customVisitor.evaluate(id => __mltt.workspace.getBlockById(id).isEditable(), custom.term), false);
    await page.evaluate(id => __mltt.workspace.getBlockById(id).setFieldValue('Latest shared state', 'NAME'), custom.root);
    await page.click('#shareBtn');
    await waitPayload(page, { id: custom.root, name: 'Latest shared state' });
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.evaluate(() => location.href));
    const steady = page.url();
    await page.evaluate(async () => {
      const before = location.href;
      const replaceState = history.replaceState;
      let writes = 0;
      history.replaceState = function (...args) { writes++; return replaceState.apply(this, args); };
      __mltt.exportSession(); __mltt.exportSession();
      try {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (location.href !== before || writes) throw new Error('Exporting a session must not schedule another URL write');
      } finally { history.replaceState = replaceState; }
    });
    assert.equal(page.url(), steady);
    const latestCustomUrl = await page.evaluate(() => location.href);
    await page.evaluate(url => {
      history.pushState(null, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, levelUrl);
    await page.waitForFunction(id => !window.__mltt?.custom.active && !!__mltt.workspace.getBlockById(id), ids.reference);
    await page.goBack();
    await page.waitForFunction(id => window.__mltt?.custom.active && !!__mltt.workspace.getBlockById(id), custom.root);
    assert.equal(await page.evaluate(id => __mltt.workspace.getBlockById(id).getFieldValue('NAME'), custom.root), 'Latest shared state');
    assert.equal(await page.evaluate(() => location.href), latestCustomUrl);
    const workspaceBefore = await page.evaluate(() => JSON.stringify(__mltt.exportSession().workspace));
    await page.evaluate(() => { location.hash = 'workshop=v99.broken'; });
    await page.waitForFunction(() => document.querySelector('#status').classList.contains('err'));
    assert.equal(await page.evaluate(() => JSON.stringify(__mltt.exportSession().workspace)), workspaceBefore);
    assert(page.url().endsWith('#workshop=v99.broken'));
    assert.deepEqual(errors, []);
    console.log('PASS: automatic preset/custom URLs, direct-copy restoration, notes/moves/deletes/layout/locks, final rapid edit, pristine short links, clipboard freshness and malformed-link preservation');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
