'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18748, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:18748'); await page.waitForFunction(() => window.__mltt?.custom);
    await page.selectOption('#languageSelect', 'zh-CN');
    const count = await page.locator('#levelSelect option').count(); assert.equal(count, 19);
    for (let i = 0; i < count; i++) {
      await page.selectOption('#levelSelect', String(i));
      const structure = await page.evaluate(() => {
        const roots = __mltt.workspace.getBlocksByType('tt_problem'), root = roots[0];
        const entry = root.getInputTargetBlock('TERM'), infer = !!__mltt.state.level.inferTerm;
        const fixed = entry.type === 'tt_judgment' ? entry.getInputTargetBlock(infer ? 'TERM' : 'TYPE')
          : entry.getInputTargetBlock('RESULT').getInputTargetBlock('TYPE');
        return { count: roots.length, legacy: __mltt.workspace.getBlocksByType('tt_answer').length,
          id: __mltt.state.level.id, inputs: root.inputList.filter(i => i.connection).map(i => i.name),
          known: root.inputList.some(i => i.name === 'KNOWN_TITLE'), entry: entry.type,
          nameLocked: !root.isEditable(), rootLocked: !root.isDeletable(),
          hiddenBindings: !!root.ttBinds || !!root.getField('BNAME0'),
          conditions: entry.getInputTargetBlock('CONTEXT')?.type || null,
          contextCount: entry.getInputTargetBlock('CONTEXT')?.ttItemCount || 0,
          expectedContextCount: __mltt.state.level.givens.length + (__mltt.state.level.answerBinders || []).length,
          fixedLocked: fixed.getDescendants(false).every(b => !b.isEditable() && !b.isMovable() && !b.isDeletable()),
          ruleEmpty: entry.type !== 'tt_rule_app' || !entry.getInputTargetBlock('RULE') };
      });
      assert.equal(structure.count, 1); assert.equal(structure.legacy, 0); assert.deepEqual(structure.inputs, ['TERM']);
      assert(!structure.known && !structure.hiddenBindings && (!structure.expectedContextCount || structure.conditions === 'tt_context') && structure.nameLocked && structure.rootLocked && structure.fixedLocked && structure.ruleEmpty, JSON.stringify(structure));
      assert.equal(structure.entry, structure.id.startsWith('R') ? 'tt_rule_app' : 'tt_judgment');
      assert.equal(structure.contextCount, structure.expectedContextCount, JSON.stringify(structure));
    }
    async function submit(index, names, application = false) {
      await page.selectOption('#levelSelect', String(index));
      return page.evaluate(({ names, application }) => {
        const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0], entry = root.getInputTargetBlock('TERM');
        const templates = w.getFlyout().getWorkspace().getBlocksByType('tt_var');
        const references = names.map(name => {
          const template = templates.find(b => LBM.decodeRef(b.getFieldValue('REF')).name === name);
          if (!template) throw new Error('Missing reference ' + name);
          return Blockly.serialization.blocks.append(Blockly.serialization.blocks.save(template), w);
        });
        let term = references[0];
        if (application) {
          term = w.newBlock('tt_app'); term.initSvg(); term.render();
          term.getInput('F').connection.connect(references[0].outputConnection);
          term.getInput('A').connection.connect(references[1].outputConnection);
        }
        entry.getInput(__mltt.state.level.inferTerm ? 'TYPE' : 'TERM').connection.connect(term.outputConnection);
        __mltt.check(); return { root: root.id, entry: entry.id, term: term.id };
      }, { names, application });
    }
    const original = await submit(0, ['x']); assert.match(await page.textContent('#status'), /正确/);
    const before = await page.evaluate(() => __mltt.workspace.getAllBlocks().map(b => b.id).sort());
    await page.selectOption('#languageSelect', 'en');
    assert.deepEqual(await page.evaluate(() => __mltt.workspace.getAllBlocks().map(b => b.id).sort()), before);
    await page.selectOption('#languageSelect', 'zh-CN');
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').id), original.entry);
    await page.evaluate(() => {
      const payload = __mltt.exportSession(), root = payload.workspace.blocks.blocks.find(b => b.type === 'tt_problem');
      const judgment = root.inputs.TERM.block;
      root.type = 'tt_answer'; root.inputs.TYPE = judgment.inputs.TYPE; root.inputs.TERM = judgment.inputs.TERM;
      root.extraState = { preset: 'L0', binders: [{ name: 'x', tyText: 'A' }], context: [] };
      root.inputs.TYPE.block.type = 'tt_given'; root.inputs.TYPE.block.fields = { IDX: '0' };
      root.inputs.TERM.block.fields.REF = LBM.encodeRef('b' + root.id + ':v0', 'x');
      __mltt.importSession(payload); __mltt.check();
    });
    assert.match(await page.textContent('#status'), /正确/);
    assert.deepEqual(await page.evaluate(() => {
      const root = __mltt.workspace.getBlocksByType('tt_problem')[0];
      return { root: root.id, term: root.getInputTargetBlock('TERM').getInputTargetBlock('TERM').id, extraInput: !!root.getInput('TYPE') };
    }), { root: original.root, term: original.term, extraInput: false });
    await submit(6, ['B']); assert.match(await page.textContent('#status'), /正确/);
    await submit(7, ['B', 'a'], true); assert.match(await page.textContent('#status'), /正确/);
    await page.selectOption('#modeSelect', 'custom');
    const editable = await page.evaluate(() => {
      const w = __mltt.workspace, make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const root = make('tt_problem'), entry = make('tt_judgment');
      entry.getInput('TYPE').connection.connect(make('tt_unit').outputConnection);
      entry.getInput('TERM').connection.connect(make('tt_star').outputConnection);
      root.getInput('TERM').connection.connect(entry.outputConnection);
      return { inputs: root.inputList.filter(i => i.connection).map(i => i.name), editable: root.getField('NAME').isEnabled() && root.isDeletable() && entry.isEditable(), ok: __mltt.custom.check().ok };
    });
    assert.deepEqual(editable, { inputs: ['TERM'], editable: true, ok: true });
    const lockState = await page.evaluate(() => {
      const w = __mltt.workspace, entry = w.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM');
      const block = entry.getInputTargetBlock('TYPE'), id = block.id;
      const menu = Blockly.ContextMenuRegistry.registry.getItem('mltt_lock_part');
      menu.callback({ block });
      const locked = !block.isEditable() && !block.isMovable() && !block.isDeletable();
      __mltt.importSession(__mltt.exportSession());
      const restored = w.getBlockById(id);
      const preserved = !restored.isEditable() && !restored.isMovable() && !restored.isDeletable();
      menu.callback({ block: restored });
      return { locked, preserved, unlocked: restored.isEditable() && restored.isMovable() && restored.isDeletable() };
    });
    assert.deepEqual(lockState, { locked: true, preserved: true, unlocked: true });
    const rawResult = await page.evaluate(() => {
      const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0]; root.getInputTargetBlock('TERM').dispose(false);
      const term = w.newBlock('tt_zero'); term.initSvg(); term.render(); root.getInput('TERM').connection.connect(term.outputConnection);
      Blockly.common.setSelected(root); const result = __mltt.custom.check();
      return { active: __mltt.custom.active, type: root.getInputTargetBlock('TERM')?.type, ok: result?.ok, error: result?.error?.message };
    });
    assert(rawResult.ok, JSON.stringify(rawResult));
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-unified-container.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: shared single-entry shell across 19 presets/custom; locked preset parts; editable custom judgments; inference; raw expressions; stable locale IDs');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
