const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18818, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const description = '把输入原样返回。';
    const explanation = '这张定理接收一个自然数，再把它原样交出来。\n\n先用 λ 引入输入，再在函数体里引用这个输入。\n示例：keep 3 = 3。\n<b>这行也只是文字。</b>';
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18818/');
    await page.waitForFunction(() => window.__mltt?.cardEditor);
    const preset = await page.evaluate(() => __mltt.cards.get('preset_add_v1'));
    assert.equal(preset.name, 'add');
    await page.evaluate(record => __mltt.cardEditor.inspect(record), preset);
    assert(await page.locator('.card-editor-name').isDisabled());
    assert(await page.locator('.card-editor-description').evaluate(node => node.readOnly && !node.disabled));
    assert(await page.locator('.card-editor-explanation').evaluate(node => node.readOnly && !node.disabled));
    assert.equal(await page.locator('.card-editor-description').inputValue(), preset.description);
    assert.equal(await page.locator('.card-editor-explanation').inputValue(), preset.explanation);
    assert(preset.explanation.length > 200, 'System cards have a detailed construction explanation as well as a summary');
    assert.equal(await page.locator('.card-editor-chip').count(), 0);
    assert(await page.evaluate(() => __mltt.cardEditor.workspace.getBlocksByType('tt_eliminator_ind_nat').length === 1));
    assert(await page.locator('.card-editor-readonly').isVisible());
    assert(await page.locator('.card-editor-edit').isHidden());
    assert(await page.locator('.card-editor-delete').isHidden());
    assert(await page.evaluate(() => {
      try { __mltt.cards.remove('preset_add_v1'); return false; } catch (_) { return true; }
    }), 'System cards cannot be deleted');
    await page.locator('.card-editor-close').click();
    await page.evaluate(() => __mltt.workspace.getButtonCallback('MAKE_THEOREM')());
    assert.equal(await page.inputValue('.card-editor-kind'), 'theorem');
    await page.locator('.card-editor-close').click();
    const original = await page.evaluate(() => __mltt.workspace.getAllBlocks(false).map(block => block.id).sort());
    await page.evaluate(() => __mltt.workspace.getButtonCallback('MAKE_AXIOM')());
    assert.deepEqual(await page.locator('.card-editor-kind option').evaluateAll(items => items.map(item => item.value)), ['axiom', 'theorem']);
    assert.equal(await page.inputValue('.card-editor-kind'), 'axiom');
    await page.selectOption('.card-editor-kind', 'theorem');
    await page.locator('.card-editor-name').fill('keep');
    await page.locator('.card-editor-description').fill(description);
    await page.locator('.card-editor-explanation').fill(explanation);
    await page.evaluate(() => {
      const ws = __mltt.cardEditor.workspace;
      const root = ws.getTopBlocks(false).find(block => block.type === 'tt_declare');
      function block(type) { const value = ws.newBlock(type); value.initSvg(); value.render(); return value; }
      const pi = block('tt_pi');
      pi.getInput('DOM').connection.connect(block('tt_nat').outputConnection);
      pi.getInput('BODY').connection.connect(block('tt_nat').outputConnection);
      root.getInput('TYPE').connection.connect(pi.outputConnection);
      const lam = block('tt_lam'), variable = block('tt_var');
      variable.setFieldValue(LBM.encodeRef(lam.ttBinds.BODY[0], lam.getFieldValue('XNAME')), 'REF');
      lam.getInput('BODY').connection.connect(variable.outputConnection);
      root.getInput('VALUE').connection.connect(lam.outputConnection);
    });
    await page.locator('.card-editor-check').click();
    await page.waitForFunction(() => !document.querySelector('.card-editor-save').disabled);
    await page.locator('.card-editor-save').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 0);
    assert.deepEqual(await page.evaluate(() => __mltt.workspace.getAllBlocks(false).map(block => block.id).sort()), original, 'Editor preserves main canvas');
    const keep = await page.evaluate(() => __mltt.cards.list().find(card => card.name === 'keep'));
    assert.equal(keep.kind, 'theorem');
    assert.equal(keep.description, description, 'The brief summary stays separate');
    assert.equal(keep.explanation, explanation, 'Multiline plain-text explanation is preserved when saving');
    assert.equal(keep.name, 'keep');
    assert.match(keep.typeText, /ℕ/);
    assert(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_card').some(block => block.getField('CARD').getText() === 'keep')));
    const checks = await page.evaluate(async keep => {
      const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
      const M = MLTT;
      const card = __mltt.workspace.newBlock('tt_card'); card.setFieldValue(keep.id, 'CARD'); card.initSvg(); card.render();
      const ref = toJson(card);
      const application = { type: 'tt_app', inputs: { F: ref, A: { type: 'tt_zero' } } };
      const root = { type: 'tt_answer', inputs: { TERM: application } };
      const checked = M.checkWorkshop({ givens: [], entry: true }, root, __mltt.cards.declarations(root));
      const changed = structuredClone(keep); changed.id = changed.declaration.id = 'card_wrong'; changed.declaration.fields.NAME = changed.name = 'wrong';
      changed.declaration.inputs.VALUE = { type: 'tt_true' };
      const invalid = __mltt.cards.validate(changed);
      const free = structuredClone(changed); free.declaration.inputs.VALUE = { type: 'tt_var', fields: { REF: 'missing␟outside' } };
      const escaped = __mltt.cards.validate(free);
      const axiom = { id: 'card_axiom', name: 'postulate', kind: 'axiom', declaration: { type: 'tt_declare', id: 'card_axiom', fields: { NAME: 'postulate', KIND: 'axiom' }, inputs: { TYPE: { type: 'tt_nat' } } } };
      __mltt.cards.save(axiom);
      const dependent = { id: 'card_dependent', name: 'assumedNat', kind: 'theorem', declaration: { type: 'tt_declare', id: 'card_dependent', fields: { NAME: 'assumedNat', KIND: 'definition' }, inputs: { TYPE: { type: 'tt_nat' }, VALUE: { type: 'tt_symbol', fields: { REF: axiom.id } } } } };
      const dep = __mltt.cards.validate(dependent);
      const cycle = structuredClone(dependent); cycle.declaration.inputs.VALUE.fields.REF = cycle.id;
      const circular = __mltt.cards.validate(cycle);
      return { ok: checked.ok, invalid: invalid.ok, escaped: escaped.ok, dep: dep.ok, assumptions: dep.assumptions.map(item => item.name), circular: circular.ok, exported: __mltt.exportSession() };
    }, keep);
    assert(checks.ok); assert(!checks.invalid); assert(!checks.escaped); assert(checks.dep); assert(!checks.circular);
    assert.deepEqual(checks.assumptions, ['postulate']);
    assert(await page.evaluate(async keep => {
      const { cardColour } = await import('/src/ui/cards/card-colours.js');
      const w = __mltt.workspace;
      function sample(id) {
        const b = w.newBlock('tt_card'); b.setFieldValue(id, 'CARD'); b.initSvg(); b.render();
        const sample = { colour: b.getColour(), text: b.getField('CARD').getText() };
        b.dispose(false); return sample;
      }
      const builtin = sample('preset_add_v1'), own = sample(keep.id), axiom = sample('card_axiom');
      return builtin.colour === cardColour({ preset: true, kind: 'theorem' }) && own.colour === cardColour(keep) &&
        axiom.colour === cardColour({ kind: 'axiom' }) && axiom.text === 'postulate' &&
        new Set([builtin.colour, own.colour, axiom.colour, cardColour({ preset: true, kind: 'axiom' })]).size === 4;
    }, keep), 'Colours distinguish category and source, while axiom labels contain only names');
    assert(await page.evaluate(() => {
      const labels = [...document.querySelectorAll('#blocklyDiv .blocklyFlyoutLabelText')].map(node => node.textContent);
      const axiom = labels.findIndex(text => text === '公理' || text === 'Axioms');
      const theorem = labels.findIndex(text => text === '定理' || text === 'Theorems');
      return axiom >= 0 && theorem > axiom && !labels.includes('我的卡片') && !labels.includes('引理');
    }), 'The main palette has axioms followed by theorems, including user cards');
    assert.deepEqual(checks.exported.cards.map(item => item.name), ['keep'], 'Share includes used cards only');
    await page.evaluate(keep => __mltt.cardEditor.inspect(keep), keep);
    assert(await page.locator('.card-editor-name').isDisabled());
    await page.locator('.card-editor-edit').click();
    await page.locator('.card-editor-description').fill('identity, revised');
    await page.locator('.card-editor-check').click();
    await page.waitForFunction(() => !document.querySelector('.card-editor-save').disabled);
    await page.locator('.card-editor-save').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 0);
    assert(await page.evaluate(id => __mltt.cards.get(id).description !== 'identity, revised' && __mltt.cards.list().some(item => item.previousId === id), keep.id));
    await page.reload(); await page.waitForFunction(() => window.__mltt?.cardEditor);
    assert(await page.evaluate(() => __mltt.cards.list().some(item => item.name === 'keep')));
    // Deleting a card also removes old revisions from existing canvases.
    await page.evaluate(() => __mltt.cardEditor.inspect(__mltt.cards.list().find(card => card.name === 'keep')));
    assert(await page.locator('.card-editor-edit').isVisible());
    assert(await page.locator('.card-editor-delete').isVisible());
    await page.locator('.card-editor-delete').click();
    await page.waitForFunction(() => __mltt.cardEditor.windows.length === 0);
    assert(await page.evaluate(() => !__mltt.cards.list().some(card => card.name === 'keep')));
    assert(await page.evaluate(() => !__mltt.exportSession().cards.some(card => card.name === 'keep')));
    assert(await page.evaluate(() => !__mltt.workspace.getBlocksByType('tt_card').some(card => __mltt.cards.get(card.getFieldValue('CARD'))?.name === 'keep')));
    await page.reload(); await page.waitForFunction(() => window.__mltt?.cardEditor);
    assert(await page.evaluate(() => !__mltt.cards.list().some(card => card.name === 'keep')));
    // A fresh recipient receives definitions before restoring the referenced blocks.
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await page.waitForFunction(() => window.__mltt?.cardEditor);
    await page.evaluate(session => __mltt.importSession(session), checks.exported);
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_card')[0].getField('CARD').getText()), 'keep');
    assert.equal(await page.evaluate(() => __mltt.cards.list().filter(card => !card.preset).length), 1);
    await page.evaluate(card => __mltt.cardEditor.inspect(card), keep);
    assert.equal(await page.locator('.card-editor-description').inputValue(), description, 'Sharing preserves the brief summary');
    assert.equal(await page.locator('.card-editor-explanation').inputValue(), explanation, 'Sharing preserves the separate detailed explanation and its line breaks');
    assert.equal(await page.locator('.card-editor-explanation-panel b').count(), 0, 'Explanations are plain text, not rendered markup');
    await page.locator('.card-editor-close').click();
    const parentId = await page.evaluate(keep => {
      const copy = structuredClone(keep);
      copy.id = copy.declaration.id = 'card_wrapper'; copy.name = copy.declaration.fields.NAME = 'wrappedKeep';
      copy.declaration.inputs.VALUE = { type: 'tt_symbol', fields: { REF: keep.id } };
      __mltt.cards.save(copy);
      const w = __mltt.workspace;
      const parent = w.newBlock('tt_app'), card = w.newBlock('tt_card'), sibling = w.newBlock('tt_zero');
      card.setFieldValue(copy.id, 'CARD');
      for (const block of [parent, card, sibling]) { block.initSvg(); block.render(); }
      parent.getInput('F').connection.connect(card.outputConnection);
      parent.getInput('A').connection.connect(sibling.outputConnection);
      BlockFreeze.setFrozen(card, true);
      __mltt.custom.setMode('custom');
      const other = w.newBlock('tt_card'); other.setFieldValue(keep.id, 'CARD'); other.initSvg(); other.render();
      __mltt.custom.setMode('level');
      __mltt.answerPreview.show();
      return parent.id;
    }, keep);
    assert(await page.evaluate(id => {
      const block = __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_card').find(block => block.getFieldValue('CARD') === id);
      const options = []; block.customContextMenu(options);
      const remove = options.find(option => /删除卡片及所有引用|Delete card and all references/.test(option.text));
      if (!remove) return false;
      remove.callback(); return true;
    }, keep.id), 'Player cards have a direct library-delete action in their context menu');
    assert(await page.evaluate(parentId => {
      __mltt.answerPreview.restore();
      const parent = __mltt.workspace.getBlockById(parentId);
      return parent && !parent.getInputTargetBlock('F') && parent.getInputTargetBlock('A')?.type === 'tt_zero' &&
        !__mltt.cards.list().some(card => ['keep', 'wrappedKeep'].includes(card.name));
    }, parentId), 'Deletion cleans the answer backup and dependent cards but retains parents and siblings');
    await page.evaluate(() => __mltt.custom.setMode('custom'));
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_card').length), 0, 'Stored custom canvas is cleaned too');
    await page.reload(); await page.waitForFunction(() => window.__mltt?.cardEditor);
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_card').length), 0, 'Deleted references stay gone after reload');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => __mltt.cardEditor.open());
    assert(await page.locator('.card-editor-check').isVisible());
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-card-editor-phone.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: axioms/theorems ordering, user edit/delete, system read-only protection, checking, revision isolation, persistence, sharing, scope, cycles and phone layout');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
