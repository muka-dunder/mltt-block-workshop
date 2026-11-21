/* Every preset is a frozen instance of cards that remain usable in the free canvas. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18750, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18750/?level=L0');
    await page.waitForFunction(() => window.__mltt?.custom);
    await page.selectOption('#languageSelect', 'en');
    const count = await page.locator('#levelSelect option').count();
    const offered = await page.evaluate(() => {
      __mltt.custom.setMode('custom');
      const types = __mltt.workspace.getFlyout().getWorkspace().getAllBlocks(false).map(block => block.type);
      __mltt.custom.setMode('level'); return types;
    });
    for (let i = 0; i < count; i++) {
      await page.selectOption('#levelSelect', String(i));
      const before = await page.evaluate(() => __mltt.workspace.getAllBlocks(false).map(block => block.id).sort());
      await page.selectOption('#languageSelect', 'zh-CN');
      assert.deepEqual(await page.evaluate(() => __mltt.workspace.getAllBlocks(false).map(block => block.id).sort()), before);
      await page.selectOption('#languageSelect', 'en');
      const result = await page.evaluate(async () => {
        const { createTerm } = await import('/src/ui/problems/preset-problems.js');
        const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
        const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0], level = __mltt.state.level;
        const entry = root.getInputTargetBlock('TERM'), context = entry;
        const declarations = context?.contextChildren() || [];
        const scope = declarations.map(binding => ({ uid: 'b' + binding.id + ':decl', name: binding.getFieldValue('NAME') }));
        const connect = (parent, input, block) => parent.getInput(input).connection.connect(block.outputConnection);
        if (level.starterBlock) {
          for (const [input, term] of [['F', level.solution.f], ['A', level.solution.a]]) {
            const target = entry.getInputTargetBlock(input);
            connect(target?.type === 'tt_judgment' ? target : entry, target?.type === 'tt_judgment' ? 'TERM' : input, createTerm(w, term, scope));
          }
          const rule = w.newBlock('tt_rule_pi_elim'); rule.initSvg(); rule.render(); connect(entry, 'RULE', rule);
          connect(entry.getInputTargetBlock('RESULT'), 'TERM', createTerm(w, level.solution, scope));
        } else {
          const input = level.inferTerm ? 'TYPE' : 'TERM', built = createTerm(w, level.solution, scope);
          const existing = entry.getInputTargetBlock(input);
          if (existing && BlockFreeze.isFrozen(existing) && existing.type === built.type) {
            function fill(target, source) {
              for (const row of source.inputList) {
                const child = row.connection?.targetBlock();
                if (!child) continue;
                const fixed = target.getInputTargetBlock(row.name);
                if (fixed && BlockFreeze.isFrozen(fixed)) fill(fixed, child);
                else { child.unplug(); connect(target, row.name, child); }
              }
              source.dispose(false);
            }
            fill(existing, built);
          } else connect(entry, input, built);
        }
        const used = [...new Set(root.getDescendants(false).map(block => block.type))];
        const canonical = root.ttEntryVersion === 2 && !root.ttBinds && !root.getField('BNAME0') && w.getBlocksByType('tt_given').length === 0;
        const valid = MLTT.checkCustomProblem(toJson(root), []).ok;
        const ids = root.getDescendants(false).map(block => block.id).sort();
        const payload = __mltt.exportSession(); payload.mode = 'custom'; payload.levelId = 'custom';
        function thaw(value) {
          if (!value || typeof value !== 'object') return;
          if (value.type) { value.editable = true; value.movable = true; value.deletable = true; }
          for (const child of Object.values(value)) thaw(child);
        }
        thaw(payload.workspace); __mltt.importSession(payload);
        const restored = w.getBlockById(root.id);
        return { id: level.id, used, canonical, valid, custom: __mltt.custom.check().ok,
          sameIds: JSON.stringify(restored.getDescendants(false).map(block => block.id).sort()) === JSON.stringify(ids),
          editable: restored.getDescendants(false).every(block => block.isEditable() && block.isMovable() && block.isDeletable()) };
      });
      assert(result.canonical && result.valid && result.custom && result.sameIds && result.editable, JSON.stringify(result));
      for (const type of result.used) assert(type === 'tt_problem' || offered.includes(type), result.id + ': missing custom card ' + type);
      await page.selectOption('#modeSelect', 'level');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: every exposed preset uses public cards, preserves locale IDs, and remains valid after copying/thawing into custom mode');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
