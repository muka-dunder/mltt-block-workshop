'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18751, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18751/?level=L0');
    await page.waitForFunction(() => window.__mltt?.custom);
    await page.selectOption('#modeSelect', 'custom');
    const result = await page.evaluate(async () => {
      const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
      const w = __mltt.workspace;
      const make = type => { const block = w.newBlock(type); block.initSvg(); block.render(); return block; };
      const connect = (parent, name, child) => parent.getInput(name).connection.connect(child.outputConnection);
      const root = make('tt_problem'), judgment = make('tt_judgment'), context = make('tt_context');
      connect(root, 'TERM', judgment); connect(judgment, 'CONTEXT', context); context.setItemCount(3);
      const bindings = ['A', 'x', 'y'].map((name, i) => {
        const binding = make('tt_binding'); binding.setFieldValue(name, 'NAME'); connect(context, 'ITEM' + i, binding); return binding;
      });
      const ref = binding => {
        const block = make('tt_var'); block.setFieldValue(LBM.encodeRef(binding.ttBindingUid, binding.getFieldValue('NAME')), 'REF'); return block;
      };
      connect(bindings[0], 'TYPE', make('tt_U'));
      connect(bindings[1], 'TYPE', ref(bindings[0])); connect(bindings[2], 'TYPE', ref(bindings[0]));
      connect(judgment, 'TERM', ref(bindings[1])); connect(judgment, 'TYPE', ref(bindings[0]));
      const check = () => MLTT.checkCustomProblem(toJson(root), []);
      const valid = check().ok;
      context.removeItem(2);
      const keptDraft = !!w.getBlockById(bindings[2].id) && !bindings[2].getParent();
      const removedValid = check().ok;
      context.moveItem(0, 1); const badOrder = !check().ok; context.moveItem(1, -1);
      BlockFreeze.setFrozen(bindings[1], true);
      const deleteBlocked = !context.removeItem(1) && !context.isDeletable() && !root.isDeletable();
      let detachBlocked = false;
      try { bindings[1].unplug(); } catch (_) { detachBlocked = true; }
      const replacement = make('tt_binding');
      try { connect(context, 'ITEM1', replacement); } catch (_) { /* Rejected connection is expected. */ }
      const replacementBlocked = context.getInputTargetBlock('ITEM1') === bindings[1];
      BlockFreeze.setFrozen(context, true);
      const frozenSequence = !context.addItem();
      BlockFreeze.setFrozen(context, false); BlockFreeze.setFrozen(bindings[1], false);
      const thawed = context.addItem(); context.removeItem(2);
      const rule = make('tt_rule_app'); rule.setPremiseCount(0);
      const ruleState = Blockly.serialization.blocks.save(rule);
      rule.dispose(false);
      const restoredRule = Blockly.serialization.blocks.append(ruleState, w);
      const zeroPremises = restoredRule.ttPremiseCount === 0 && !restoredRule.getInput('F');
      restoredRule.addPremise(); restoredRule.addPremise(); restoredRule.addPremise();
      const threePremises = restoredRule.ttPremiseCount === 3 && !!restoredRule.getInput('P2');
      const noLabels = !/前提|结论|推导|Premise|Conclusion|Inference/.test(restoredRule.toString());
      BlockFreeze.setFrozen(bindings[1], true);
      const payload = __mltt.exportSession(); __mltt.importSession(payload);
      const frozenRestored = BlockFreeze.isFrozen(w.getBlockById(bindings[1].id));
      const stillValid = MLTT.checkCustomProblem(toJson(w.getBlockById(root.id)), []).ok;
      return { valid, keptDraft, removedValid, badOrder, deleteBlocked, detachBlocked, replacementBlocked,
        frozenSequence, thawed, zeroPremises, threePremises, noLabels, frozenRestored, stillValid };
    });
    for (const [name, passed] of Object.entries(result)) assert.equal(passed, true, name + ': ' + JSON.stringify(result));
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-variable-contexts.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: editable ordered conditions, real scope, zero/three premises, draft preservation and frozen attachment/replacement/deletion/persistence');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
