'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18747, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      const replace = history.replaceState;
      history.replaceState = function (...args) {
        const result = replace.apply(this, args); window.dispatchEvent(new Event('test:urlchanged')); return result;
      };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:18747'); await page.waitForFunction(() => window.__mltt?.custom);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.selectOption('#levelSelect', '1');
    const levelRoot = await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].id);
    await page.selectOption('#modeSelect', 'custom');
    assert.equal(await page.evaluate(() => __mltt.workspace.getAllBlocks(false).length), 0);
    assert.equal(await page.locator('#addProblem').count(), 0);
    assert.equal(await page.getByText('添加题目', { exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_problem').length), 1);
    const placed = [];
    for (let i = 0; i < 3; i++) {
      const position = await page.evaluate(index => {
        const w = __mltt.workspace;
        const template = w.getFlyout().getWorkspace().getBlocksByType('tt_problem')[0].getSvgRoot().getBoundingClientRect();
        const host = document.querySelector('#blocklyDiv').getBoundingClientRect();
        return { from: { x: template.left + 10, y: template.top + 10 },
          to: { x: host.left + w.getFlyout().getWidth() + 100 + index * 180, y: host.top + 130 + index * 160 } };
      }, i);
      await page.mouse.move(position.from.x, position.from.y); await page.mouse.down();
      await page.mouse.move(position.to.x, position.to.y, { steps: 12 }); await page.mouse.up();
      await page.waitForFunction(count => __mltt.workspace.getBlocksByType('tt_problem').length === count, i + 1);
      const blocks = await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem').map(block => {
        const rect = block.getSvgRoot().getBoundingClientRect();
        return { id: block.id, x: rect.left, y: rect.top, right: rect.right, bottom: rect.bottom };
      }));
      for (const previous of placed) {
        const current = blocks.find(block => block.id === previous.id);
        assert(Math.abs(current.x - previous.x) < 2 && Math.abs(current.y - previous.y) < 2, 'Dragging another problem must not pan existing cards');
      }
      const created = blocks.find(block => !placed.some(previous => previous.id === block.id));
      assert(created.x <= position.to.x && created.right >= position.to.x &&
        created.y <= position.to.y && created.bottom >= position.to.y, JSON.stringify({ created, position }));
      placed.push(created);
    }
    await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem').forEach(block => block.dispose(false)));
    const data = await page.evaluate(() => {
      const w = __mltt.workspace;
      const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const problem = make('tt_problem'); problem.setFieldValue('我的第一题', 'NAME');
      const entry = make('tt_judgment');
      entry.getInput('TYPE').connection.connect(make('tt_unit').outputConnection);
      entry.getInput('TERM').connection.connect(make('tt_star').outputConnection);
      problem.getInput('TERM').connection.connect(entry.outputConnection);
      const judgment = make('tt_judgment'); judgment.setFieldValue('一条很长的说明 '.repeat(12), 'CTX');
      judgment.setJudgmentLayout('inline'); judgment.moveBy(140, 300);
      __mltt.notes.add();
      return { problem: problem.id, judgment: judgment.id };
    });
    await page.locator('.note-card[data-kind="user"] textarea').fill('分享笔记：λx. x');
    await page.evaluate(id => { Blockly.common.setSelected(__mltt.workspace.getBlockById(id)); __mltt.check(); }, data.problem);
    assert.match(await page.textContent('#status'), /正确/);
    await page.selectOption('#modeSelect', 'level');
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].id), levelRoot);
    await page.selectOption('#modeSelect', 'custom');
    assert(await page.evaluate(id => !!__mltt.workspace.getBlockById(id), data.problem));
    await page.evaluate(async ids => {
      const { decodeSession } = await import('/src/ui/sharing/share.js');
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('Latest canvas was not written to the URL')); }, 10000);
        function cleanup() { clearTimeout(timer); window.removeEventListener('test:urlchanged', check); }
        async function check() {
          const hash = location.hash, encoded = new URLSearchParams(hash.slice(1)).get('workshop');
          if (!encoded) return;
          const session = await decodeSession(encoded);
          const blocks = session.workspace.blocks?.blocks || [];
          if (hash === location.hash && blocks.some(block => block.id === ids.problem) && blocks.some(block => block.id === ids.judgment)) {
            cleanup(); resolve();
          }
        }
        window.addEventListener('test:urlchanged', check); void check();
      });
    }, data);
    await page.reload(); await page.waitForFunction(id => window.__mltt?.custom?.active &&
      !!__mltt.workspace.getBlockById(id), data.judgment);
    assert(await page.evaluate(id => !!__mltt.workspace.getBlockById(id), data.problem));
    assert.equal(await page.evaluate(id => __mltt.workspace.getBlockById(id).ttLayout, data.judgment), 'inline');
    await page.selectOption('#languageSelect', 'en');
    assert.equal(await page.evaluate(id => __mltt.workspace.getBlockById(id).ttLayout, data.judgment), 'inline');
    const chosen = await page.evaluate(() => {
      const w = __mltt.workspace, make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const declaration = make('tt_declare'); declaration.setFieldValue('assumption', 'KIND'); declaration.setFieldValue('A', 'NAME');
      declaration.getInput('TYPE').connection.connect(make('tt_U').outputConnection);
      const symbol = () => { const b = make('tt_symbol'); b.setFieldValue(declaration.id, 'REF'); return b; };
      const p = make('tt_problem'); p.setFieldValue('Identity', 'NAME');
      const arrow = make('tt_pi'); arrow.getInput('DOM').connection.connect(symbol().outputConnection); arrow.getInput('BODY').connection.connect(symbol().outputConnection);
      const entry = make('tt_judgment');
      entry.getInput('TYPE').connection.connect(arrow.outputConnection);
      p.getInput('TERM').connection.connect(entry.outputConnection);
      const lambda = make('tt_lam'), ref = make('tt_var');
      const uid = lambda.ttBinds.BODY[0], name = lambda.getFieldValue(lambda.ttNameFields[uid]);
      ref.setFieldValue(LBM.encodeRef(uid, name), 'REF'); lambda.getInput('BODY').connection.connect(ref.outputConnection);
      entry.getInput('TERM').connection.connect(lambda.outputConnection);
      Blockly.common.setSelected(null); return p.id;
    });
    await page.click('#checkBtn'); assert.match(await page.textContent('#status'), /Select the problem/);
    await page.click('#shareBtn');
    await page.waitForFunction(() => !document.querySelector('#shareBtn').disabled);
    assert(await page.evaluate(async id => {
      const encoded = new URLSearchParams(location.hash.slice(1)).get('workshop');
      if (!encoded) return false;
      const { decodeSession } = await import('/src/ui/sharing/share.js');
      const session = await decodeSession(encoded);
      return session.mode === 'custom' && session.workspace.blocks?.blocks.some(block => block.id === id);
    }, chosen));
    const url = await page.evaluate(() => location.href);
    assert(!url.includes('?level='));
    const visitor = await context.newPage(); visitor.on('pageerror', e => errors.push(e.message));
    await visitor.goto(url); await visitor.waitForFunction(id => window.__mltt?.custom?.active && !!__mltt.workspace.getBlockById(id), data.problem);
    assert.equal(await visitor.evaluate(id => __mltt.workspace.getBlockById(id).ttLayout, data.judgment), 'inline');
    assert.match(await visitor.locator('.note-card[data-kind="user"] textarea').inputValue(), /λx/);
    assert(await visitor.evaluate(id => { Blockly.common.setSelected(__mltt.workspace.getBlockById(id)); return __mltt.custom.check().ok; }, chosen));
    const before = await visitor.evaluate(() => JSON.stringify(__mltt.exportSession().workspace));
    await visitor.evaluate(() => { location.hash = 'workshop=v99.broken'; });
    await visitor.waitForFunction(() => document.querySelector('#status').classList.contains('err'));
    assert.equal(await visitor.evaluate(() => JSON.stringify(__mltt.exportSession().workspace)), before);
    await visitor.selectOption('#modeSelect', 'level'); await visitor.selectOption('#levelSelect', '3');
    await visitor.waitForFunction(() => location.search === '?level=L3' && !location.hash);
    await visitor.click('#shareBtn');
    assert(visitor.url().length < 80);
    const short = await context.newPage(); await short.goto(visitor.url());
    await short.waitForFunction(() => window.__mltt?.state?.level?.id === 'L3');
    assert.equal(await short.evaluate(() => __mltt.custom.active), false);
    assert.equal(await short.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInputTargetBlock('TERM')), null);
    await page.setViewportSize({ width: 988, height: 900 });
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-custom-mode.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: blank custom canvas, editable goals, mode/reload persistence, live URL/layout/notes roundtrip, multi-problem selection, bad-link preservation and short initial preset links');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
