const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18819, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18819/');
    await page.waitForFunction(() => window.__mltt?.cardEditor);
    const active = () => page.locator('.card-editor.is-active');
    const name = () => active().locator('.card-editor-name');
    async function blockLocator(type, value) {
      const id = await page.evaluate(({ type, value }) => {
        const block = __mltt.cardEditor.workspace.getBlocksByType(type).find(block =>
          !value || (type === 'tt_var' ? LBM.decodeRef(block.getFieldValue('REF')).name : block.getFieldValue('CARD')) === value);
        if (!block) throw new Error('Missing block: ' + type + '/' + value);
        return block.id;
      }, { type, value });
      return active().locator('.card-editor-workspace [data-id=' + JSON.stringify(id) + ']');
    }
    async function context(type, value, action) {
      await (await blockLocator(type, value)).click({ button: 'right' });
      await page.getByRole('menuitem').filter({ hasText: action }).click();
    }
    await page.evaluate(() => __mltt.cardEditor.inspect(__mltt.cards.get('preset_add_v1')));
    const primitive = await blockLocator('tt_nat'), rect = await primitive.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    assert.match(await active().locator('.card-editor-selection').textContent(), /Type/);
    assert(await page.evaluate(() => Blockly.getSelected()?.type === 'tt_nat'), 'Selection updates while the button is still held');
    assert(await primitive.evaluate(node => node.classList.contains('blocklySelected')), 'Glow also appears before release');
    await page.mouse.up();
    assert.match(await active().locator('.card-editor-selection').textContent(), /Type/);
    await (await blockLocator('tt_var', 'm')).click();
    await page.waitForFunction(() => document.querySelector('.card-editor.is-active .card-editor-selection').textContent === 'ℕ');
    assert(await page.evaluate(() => __mltt.cardEditor.workspace.options.readOnly));
    await (await blockLocator('tt_nat')).click({ button: 'right' });
    assert(await page.getByRole('menuitem').count() > 0, 'Ordinary blocks in a view also have a right-click menu');
    await page.keyboard.press('Escape');
    await active().locator('.card-editor-close').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 0);

    await page.evaluate(() => __mltt.cardEditor.open(null, 'theorem'));
    await name().fill('unfinished');
    await active().locator('.card-editor-description').fill('preserve this draft');
    await active().locator('.card-editor-explanation').fill('Detailed draft notes.\nKeep these separate from the summary.');
    const draft = await page.evaluate(() => {
      const w = __mltt.cardEditor.workspace, root = w.getBlocksByType('tt_declare')[0];
      const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const pi = make('tt_pi'); pi.getInput('DOM').connection.connect(make('tt_nat').outputConnection);
      pi.getInput('BODY').connection.connect(make('tt_nat').outputConnection); root.getInput('TYPE').connection.connect(pi.outputConnection);
      const lam = make('tt_lam'); root.getInput('VALUE').connection.connect(lam.outputConnection);
      Blockly.common.setSelected(lam); __mltt.cardEditor.refreshSelection();
      return { workspace: w.id, root: root.id, lam: lam.id };
    });
    assert.match(await active().locator('.card-editor-selection').textContent(), /ℕ.*→.*ℕ/);
    await page.evaluate(() => __mltt.cardEditor.inspect(__mltt.cards.get('preset_add_zero_v1')));
    assert.equal(await page.locator('.card-editor').count(), 2);
    assert.equal(await page.locator('.card-editor-back').count(), 0, 'No page-navigation buttons remain');
    assert(await page.evaluate(id => Blockly.common.getAllWorkspaces().some(w => w.id === id), draft.workspace), 'Parent workspace stays alive');
    const windowRect = await active().boundingBox(), header = active().locator('.card-editor-heading');
    const head = await header.boundingBox();
    await page.mouse.move(head.x + 80, head.y + 18); await page.mouse.down();
    await page.mouse.move(head.x + 160, head.y + 70, { steps: 10 }); await page.mouse.up();
    const moved = await active().boundingBox();
    assert(Math.abs(moved.x - windowRect.x) > 20 || Math.abs(moved.y - windowRect.y) > 20, 'Windows drag by their heading');
    await context('tt_card', 'preset_add_v1', /查看类型与构造|View type and construction/);
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 3);
    assert.equal(await name().inputValue(), 'add');
    await active().locator('.card-editor-close').click();
    assert.equal(await name().inputValue(), 'add_zero');
    await active().locator('.card-editor-close').click();
    assert.equal(await name().inputValue(), 'unfinished');
    assert.equal(await active().locator('.card-editor-description').inputValue(), 'preserve this draft');
    assert.equal(await active().locator('.card-editor-explanation').inputValue(), 'Detailed draft notes.\nKeep these separate from the summary.');
    assert(await page.evaluate(draft => __mltt.cardEditor.workspace.id === draft.workspace && !!__mltt.cardEditor.workspace.getBlockById(draft.root), draft));
    await page.evaluate(() => {
      const w = __mltt.cardEditor.workspace, lam = w.getBlocksByType('tt_lam')[0];
      const variable = w.newBlock('tt_var'); variable.initSvg(); variable.render();
      variable.setFieldValue(LBM.encodeRef(lam.ttBinds.BODY[0], lam.getFieldValue('XNAME')), 'REF');
      lam.getInput('BODY').connection.connect(variable.outputConnection);
      Blockly.common.setSelected(variable); __mltt.cardEditor.refreshSelection();
    });
    assert.equal(await active().locator('.card-editor-selection').textContent(), 'ℕ');
    await page.evaluate(() => {
      __mltt.cards.save({ id: 'card_editing_seed', name: 'editingSeed', kind: 'axiom', declaration: {
        type: 'tt_declare', id: 'card_editing_seed', fields: { NAME: 'editingSeed', KIND: 'axiom' }, inputs: { TYPE: { type: 'tt_nat' } } } });
      const w = __mltt.cardEditor.workspace, lam = w.getBlocksByType('tt_lam')[0]; lam.getInputTargetBlock('BODY').dispose(false);
      const ref = w.newBlock('tt_card'); ref.setFieldValue('card_editing_seed', 'CARD'); ref.initSvg(); ref.render(); lam.getInput('BODY').connection.connect(ref.outputConnection);
    });
    await context('tt_card', 'card_editing_seed', /编辑卡片|Edit card/);
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 2);
    assert.equal(await name().inputValue(), 'editingSeed');
    await active().locator('.card-editor-description').fill('edited through a reference');
    await active().locator('.card-editor-check').click();
    await page.waitForFunction(() => !document.querySelector('.card-editor.is-active .card-editor-save').disabled);
    await active().locator('.card-editor-save').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 1);
    assert.equal(await name().inputValue(), 'unfinished');
    await context('tt_card', 'card_editing_seed', /查看类型与构造|View type and construction/);
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 2);
    await active().locator('.card-editor-delete').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 1);
    assert(await page.evaluate(draft => !!__mltt.cardEditor.workspace.getBlockById(draft.root) &&
      !__mltt.cardEditor.workspace.getBlockById(draft.lam).getInputTargetBlock('BODY'), draft));
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await active().locator('.card-editor-feedback').isVisible());
    await page.waitForFunction(() => {
      const r = __mltt.cardEditor.activeWindow.element.getBoundingClientRect();
      return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
    });
    const phone = await active().boundingBox();
    assert(phone.x >= 0 && phone.y >= 0 && phone.x + phone.width <= 391 && phone.y + phone.height <= 845, 'The entire window stays reachable on a small screen');
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-card-windows-phone.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: immediate pointer-down feedback, view context menus, draggable nested windows, close-to-parent, live drafts, reference editing/deletion and phone layout');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
