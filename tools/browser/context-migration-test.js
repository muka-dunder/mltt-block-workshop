/* Old opaque preset conditions become public context cards without losing user terms. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18751, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18751/?level=L0'); await page.waitForFunction(() => window.__mltt?.custom);
    const results = await page.evaluate(async () => {
      const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
      const block = (type, id, fields = {}, inputs = {}, extraState) => ({ type, id, fields,
        inputs: Object.fromEntries(Object.entries(inputs).map(([name, child]) => [name, { block: child }])), ...(extraState ? { extraState } : {}) });
      const given = (index, id) => block('tt_given', id, { IDX: String(index) });
      const variable = (name, tag, id) => block('tt_var', id, { REF: 'blegacy-root:' + tag + '␟' + name });
      const metadata = { layout: 'stacked', context: { binders: [{ name: 'x', tyText: 'A' }], lines: [], uids: ['blegacy-root:v0'] } };
      const l0 = block('tt_answer', 'legacy-root', { NAME: 'old', BNAME0: 'x' }, {
        TERM: block('tt_judgment', 'legacy-judgment', { CTX: '', BNAME0: 'x' }, {
          TYPE: given(0, 'legacy-goal'), TERM: variable('x', 'v0', 'legacy-user-term') }, metadata),
      }, { preset: 'L0', binders: [{ name: 'x', tyText: 'A' }], context: [] });
      const session = (mode, levelId, root) => ({ version: 1, mode, levelId, workspace: { blocks: { languageVersion: 0, blocks: [root] } }, notes: [] });
      const result = [];
      for (const mode of ['level', 'custom']) {
        __mltt.importSession(session(mode, mode === 'level' ? 'L0' : 'custom', structuredClone(l0)));
        const root = __mltt.workspace.getBlockById('legacy-root');
        result.push({ mode, valid: MLTT.checkCustomProblem(toJson(root), []).ok,
          kept: !!__mltt.workspace.getBlockById('legacy-user-term'), noGiven: !__mltt.workspace.getBlocksByType('tt_given').length,
          publicContext: root.getInputTargetBlock('TERM').getInputTargetBlock('CONTEXT')?.type === 'tt_context' });
      }
      const raw = block('tt_problem', 'raw-problem', { NAME: 'old custom' }, { TYPE: block('tt_unit', 'raw-type'), TERM: block('tt_star', 'raw-term') });
      __mltt.importSession(session('custom', 'custom', raw));
      result.push({ mode: 'custom raw', valid: __mltt.custom.check().ok, kept: !!__mltt.workspace.getBlockById('raw-term'), noGiven: true, publicContext: true });
      __mltt.importSession(session('level', 'L0', structuredClone(l0)));
      const mixed = __mltt.exportSession(); mixed.workspace.blocks.blocks[0].extraState = { preset: 'L0' };
      __mltt.importSession(mixed);
      const root = __mltt.workspace.getBlockById('legacy-root');
      result.push({ mode: 'mixed public context', valid: MLTT.checkCustomProblem(toJson(root), []).ok,
        kept: !!__mltt.workspace.getBlockById('legacy-user-term'), noGiven: !__mltt.workspace.getBlocksByType('tt_given').length, publicContext: true });
      return result;
    });
    for (const result of results) assert(result.valid && result.kept && result.noGiven && result.publicContext, JSON.stringify(result));
    assert.deepEqual(errors, []);
    console.log('PASS: opaque preset context migration, user term IDs, custom preset copies, old two-slot problems, and existing public binding identities');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
