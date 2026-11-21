'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18745, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:18745');
    await page.waitForFunction(() => window.__mltt?.workspace);
    await page.selectOption('#languageSelect', 'zh-CN');
    assert.equal(await page.locator('#stars, #hintBtn, #hintBox, #winStars, #restoreTutorial, #clearNotes, #symbolSearch, #symbolList, #addAssumption, #addDefinition, #addAxiom, #declarationList').count(), 0);
    await page.selectOption('#levelSelect', '5');
    assert.match(await page.textContent('#levelStory'), /柯里化/);
    const refs = await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_var').map(b => LBM.decodeRef(b.getFieldValue('REF')).name));
    assert(refs.includes('f') && refs.includes('x'), 'Both f and x must be directly available');
    await page.selectOption('#librarySelect', 'all');
    assert(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_J').length > 0));
    await page.selectOption('#librarySelect', 'common');
    await page.selectOption('#levelSelect', '1');
    const lambdaId = await page.evaluate(() => {
      const w = __mltt.workspace;
      const lam = w.newBlock('tt_lam'); lam.initSvg(); lam.render();
      w.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInput('TERM').connection.connect(lam.outputConnection);
      return lam.id;
    });
    await page.waitForFunction(id => {
      const w = __mltt.workspace, lam = w.getBlockById(id);
      return w.getFlyout().getWorkspace().getBlocksByType('tt_var').some(b => LBM.decodeRef(b.getFieldValue('REF')).uid === lam.ttBinds.BODY[0]);
    }, lambdaId);
    await page.evaluate(id => {
      const w = __mltt.workspace, lam = w.getBlockById(id);
      lam.setFieldValue('z', lam.ttNameFields[lam.ttBinds.BODY[0]]);
    }, lambdaId);
    await page.waitForFunction(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_var').some(b => LBM.decodeRef(b.getFieldValue('REF')).name === 'z'));
    await page.evaluate(id => {
      const w = __mltt.workspace, lam = w.getBlockById(id);
      const template = w.getFlyout().getWorkspace().getBlocksByType('tt_var').find(b => LBM.decodeRef(b.getFieldValue('REF')).uid === lam.ttBinds.BODY[0]);
      const ref = Blockly.serialization.blocks.append(Blockly.serialization.blocks.save(template), w);
      lam.getInput('BODY').connection.connect(ref.outputConnection);
      __mltt.check();
    }, lambdaId);
    assert.match(await page.textContent('#status'), /正确/);
    await page.evaluate(id => __mltt.workspace.getBlockById(id).dispose(false), lambdaId);
    await page.waitForFunction(id => !__mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_var')
      .some(b => LBM.decodeRef(b.getFieldValue('REF')).uid === 'b' + id + ':x'), lambdaId);
    await page.selectOption('#levelSelect', '8');
    const ids = await page.evaluate(() => {
      const w = __mltt.workspace;
      const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      // Older shared workspaces may still contain declarations.
      const d = make('tt_declare'); d.setFieldValue('definition', 'KIND');
      d.setFieldValue('myUnit', 'NAME');
      d.getInput('TYPE').connection.connect(make('tt_unit').outputConnection);
      d.getInput('VALUE').connection.connect(make('tt_star').outputConnection);
      __mltt.refreshWorkshop();
      const r = make('tt_symbol'); r.setFieldValue(d.id, 'REF');
      w.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInput('TERM').connection.connect(r.outputConnection);
      __mltt.check();
      return { d: d.id, r: r.id };
    });
    assert.match(await page.textContent('#status'), /正确/);
    await page.evaluate(id => { __mltt.workspace.getBlockById(id).setFieldValue('renamedUnit', 'NAME'); __mltt.refreshWorkshop(); }, ids.d);
    await page.selectOption('#languageSelect', 'en');
    assert.equal(await page.evaluate(id => __mltt.workspace.getBlockById(id).getFieldValue('REF'), ids.r), ids.d);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.selectOption('#levelSelect', '8');
    await page.evaluate(() => {
      const w = __mltt.workspace;
      const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const d = make('tt_declare'); d.setFieldValue('axiom', 'KIND');
      d.setFieldValue('oracle', 'NAME');
      d.getInput('TYPE').connection.connect(make('tt_unit').outputConnection);
      __mltt.refreshWorkshop();
      const r = make('tt_symbol'); r.setFieldValue(d.id, 'REF');
      w.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInput('TERM').connection.connect(r.outputConnection);
      __mltt.check();
    });
    assert.match(await page.textContent('#status'), /oracle/);
    await page.selectOption('#levelSelect', '5');
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-workshop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.deepEqual(errors, []);
    console.log('PASS: direct variables, lambda variable shelf/create/rename/delete, complete library, legacy declarations, stable references, locale switch, axiom dependencies, simplified controls, responsive layout');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
