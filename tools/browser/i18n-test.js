/* Browser regression: locale changes preserve unfinished and completed work. */
'use strict';
const assert = require('assert');
const { chromium } = require('playwright');
const path = require('path');
const { levels } = require('../../src/levels/index.js');
const zhLevels = require('../../src/i18n/locales/levels.zh-CN.js');
const errorMessages = require('../../src/i18n/locales/errors.js');
assert.equal(Object.keys(zhLevels).length, levels.length);
for (const lv of levels) assert.equal(zhLevels[lv.id].hints.length, lv.hints.length);
assert.deepEqual(Object.keys(errorMessages.en).sort(), Object.keys(errorMessages['zh-CN']).sort());
for (const key of Object.keys(errorMessages.en)) {
  assert.deepEqual((errorMessages.en[key].match(/\{\w+\}/g) || []).sort(),
    (errorMessages['zh-CN'][key].match(/\{\w+\}/g) || []).sort());
}
(async () => {
  const root = path.resolve(__dirname, '../..');
  const basePath = process.env.MLTT_TEST_BASE || '/';
  let server, browser;
  try {
    const { createServer, preview } = await import('vite');
    if (process.env.MLTT_TEST_BUILD === '1') {
      server = await preview({ root, base: basePath, preview: { host: '127.0.0.1', port: 18744, strictPort: true } });
    } else {
      server = await createServer({ root, server: { host: '127.0.0.1', port: 18743, strictPort: true } });
      await server.listen();
    }
    const address = server.httpServer.address();
    assert(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}${basePath}`;
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const isFavicon = url => new URL(url).pathname.endsWith('/favicon.ico');
    page.on('response', response => {
      if (response.status() >= 400 && !isFavicon(response.url())) {
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      if (!isFavicon(request.url())) errors.push(`Request failed: ${request.url()} (${request.failure()?.errorText})`);
    });
    await page.goto(base);
    const media = await page.evaluate(async () => {
      const response = await fetch(new URL('media/sprites.png', document.baseURI));
      return { ok: response.ok, type: response.headers.get('content-type') };
    });
    assert(media.ok && media.type && media.type.startsWith('image/'), 'Blockly sprites must load as an image');
    await page.waitForFunction(() => window.__mltt && __mltt.workspace);
    await page.selectOption('#languageSelect', 'en');
    await page.selectOption('#levelSelect', '0');
    const binder = await page.evaluateHandle(() => {
      const context = __mltt.workspace.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInputTargetBlock('CONTEXT');
      return context.getChildren(false).find(block => block.type === 'tt_binding' && block.getFieldValue('NAME') === 'x').getField('NAME').getSvgRoot();
    });
    await binder.asElement().hover();
    await page.waitForFunction(() => {
      const flydown = __mltt.workspace.getFlydown();
      return flydown && flydown.isVisible() && flydown.workspace_.getBlocksByType('tt_var').length > 0;
    });
    const flydownRef = await page.evaluate(() => {
      const declaration = __mltt.workspace.getBlocksByType('tt_binding').find(block => block.getFieldValue('NAME') === 'x');
      const variable = __mltt.workspace.getFlydown().workspace_.getBlocksByType('tt_var')[0];
      return { actual: LBM.decodeRef(variable.getFieldValue('REF')), uid: 'b' + declaration.id + ':decl' };
    });
    assert.deepEqual(flydownRef.actual, { uid: flydownRef.uid, name: 'x' });
    await page.selectOption('#levelSelect', '1');
    const before = await page.evaluate(() => {
      const ws = __mltt.workspace;
      const answer = ws.getBlocksByType('tt_problem')[0];
      const lam = ws.newBlock('tt_lam'); lam.initSvg(); lam.render();
      lam.setFieldValue('z', 'XNAME');
      answer.getInputTargetBlock('TERM').getInput('TERM').connection.connect(lam.outputConnection);
      const scratch = ws.newBlock('tt_hole'); scratch.initSvg(); scratch.render(); scratch.moveBy(410, 230);
      ws.setScale(0.8);
      return { ids: ws.getAllBlocks().map(b => b.id).sort(), uid: lam.ttBinds.BODY[0], scratch: scratch.id };
    });
    await page.click('#checkBtn');
    assert.match(await page.textContent('#status'), /empty/);
    await page.selectOption('#languageSelect', 'zh-CN');
    assert.equal(await page.textContent('#checkBtn'), '检查');
    assert.match(await page.textContent('#status'), /空/);
    assert.deepEqual(await page.evaluate(() => __mltt.workspace.getAllBlocks().map(b => b.id).sort()), before.ids);
    const after = await page.evaluate(() => {
      const ws = __mltt.workspace;
      const lam = ws.getBlocksByType('tt_lam')[0];
      return { uid: lam.ttBinds.BODY[0], name: lam.getFieldValue('XNAME'), scale: ws.scale, index: __mltt.state.index };
    });
    assert.deepEqual(after, { uid: before.uid, name: 'z', scale: 0.8, index: 1 });
    await page.evaluate(() => {
      const ws = __mltt.workspace, lam = ws.getBlocksByType('tt_lam')[0];
      const v = ws.newBlock('tt_var'); v.initSvg(); v.render();
      v.setFieldValue(LBM.encodeRef(lam.ttBinds.BODY[0], 'z'), 'REF');
      lam.getInput('BODY').connection.connect(v.outputConnection);
    });
    await page.click('#checkBtn');
    assert.match(await page.textContent('#status'), /类型正确/);
    const progress = await page.evaluate(() => localStorage.getItem('mltt.progress.v1'));
    await page.selectOption('#languageSelect', 'en');
    assert.match(await page.textContent('#status'), /Correct type/);
    assert.match(await page.textContent('#winText'), /Correct type/);
    assert.equal(await page.evaluate(() => localStorage.getItem('mltt.progress.v1')), progress);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.evaluate(() => __mltt.check());
    assert.match(await page.textContent('#status'), /类型正确/);
    await page.waitForFunction(() => location.search === '?level=L1' && location.hash.startsWith('#workshop=v1.'));
    await page.reload();
    await page.waitForFunction(uid => window.__mltt?.state.level?.id === 'L1' &&
      __mltt.workspace.getBlocksByType('tt_lam').some(block => block.ttBinds.BODY[0] === uid), before.uid);
    assert.equal(await page.getAttribute('html', 'lang'), 'zh-CN');
    assert.equal(await page.inputValue('#levelSelect'), '1');
    assert.equal(await page.evaluate(() => localStorage.getItem('mltt.progress.v1')), progress);
    const exposedLevels = await page.locator('#levelSelect option').count();
    for (let i = 0; i < exposedLevels; i++) {
      await page.selectOption('#levelSelect', String(i));
      const staleReferences = await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_var', false)
        .filter(block => block.getField('REF').getSvgRoot().textContent.includes('⚠'))
        .map(block => ({ id: block.id, text: block.getField('REF').getSvgRoot().textContent })));
      assert.deepEqual(staleReferences, [], 'Switching levels must refresh references before any canvas edit');
      await page.selectOption('#languageSelect', 'en');
      await page.selectOption('#languageSelect', 'zh-CN');
      const levelId = await page.evaluate(() => __mltt.state.level.id);
      assert.match(await page.textContent('#levelTitle'), new RegExp(zhLevels[levelId].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await page.evaluate(() => __mltt.check());
      assert.match(await page.textContent('#status'), /E_EMPTY/);
    }
    await page.screenshot({ path: path.join(require('os').tmpdir(), 'mltt-i18n-zh.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: translated errors, block IDs/bindings/names, scratch blocks, zoom, locale persistence, hover flydown, media and HTTP');
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      if (server) {
        if (typeof server.close === 'function') await server.close();
        else await new Promise((resolve, reject) => server.httpServer.close(err => err ? reject(err) : resolve()));
      }
    }
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
