'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 0 } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.httpServer.address().port);
    await page.waitForFunction(() => window.__mltt?.custom);
    await page.selectOption('#modeSelect', 'custom');
    const results = await page.evaluate(async () => {
      const { createTerm } = await import('/src/ui/problems/preset-problems.js');
      const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
      const M = MLTT, w = __mltt.workspace;
      const obsolete = ['tt_natrec', 'tt_unitrec', 'tt_sigma_ind', 'tt_J'];
      if (obsolete.some(type => Blockly.Blocks[type])) throw new Error('Dedicated eliminator cards still registered');
      if (Blockly.ContextMenuRegistry.registry.getItem('mltt_eliminator_function') ||
          Blockly.ContextMenuRegistry.registry.getItem('mltt_eliminator_card')) throw new Error('Conversion menus still registered');
      const cards = w.getFlyout().getWorkspace().getAllBlocks(false).filter(block => block.ttEliminator);
      const shelf = cards.map(block => block.ttEliminator);
      if (Blockly.Blocks.tt_eliminator || cards.some(block => block.inputList.some(input => input.fieldRow.some(field => field instanceof Blockly.FieldDropdown)))) throw new Error('Eliminators must have fixed names without dropdowns');
      if (!M.eliminatorNames.every(name => shelf.includes(name))) throw new Error('Missing function symbols in toolbox');
      const partial = createTerm(w, M.App(M.eliminatorTerm('ind_unit'), M.STAR), []);
      if (M.infer([], M.elabBlock(toJson(partial), [])).t !== 'Pi') throw new Error('Partial application lost its function type');
      const roundTrip = (term, type) => {
        w.clear();
        const source = M.Annot(term, type), fn = M.functionForm([], source);
        const root = w.newBlock('tt_problem'); root.initSvg(); root.render();
        root.getInput('TERM').connection.connect(createTerm(w, fn, []).outputConnection);
        const id = root.id;
        const check = () => M.checkCustomProblem(toJson(w.getBlockById(id)), []);
        const before = check(); if (!before.ok) throw before.error;
        if (!M.conv(M.evalTm([], source), M.evalTm([], before.term))) throw new Error('Function form changed computation');
        const state = Blockly.serialization.workspaces.save(w);
        w.clear(); Blockly.serialization.workspaces.load(state, w);
        const after = check(); if (!after.ok) throw after.error;
        if (!M.conv(M.evalTm([], source), M.evalTm([], after.term))) throw new Error('Persistence changed computation');
        return w.getAllBlocks(false).filter(block => block.ttEliminator).map(block => ({ name: block.ttEliminator,
          levels: [Number(block.getFieldValue('A_LEVEL')), Number(block.getFieldValue('B_LEVEL'))] }));
      };
      const nat = M.NatRec(M.SUC(M.ZERO), M.Lam('n', M.NAT), M.ZERO, M.Lam('k', M.Lam('ih', M.SUC(M.Var(0)))));
      const unit = M.UnitRec(M.STAR, M.Lam('u', M.NAT), M.ZERO);
      const sigma = M.Lam('p', M.SigmaInd(M.Var(0), M.Lam('_', M.NAT), M.Lam('a', M.Lam('b', M.Var(1)))));
      const sigmaType = M.Pi('p', M.Sigma('a', M.NAT, M.UNIT), M.NAT);
      const identity = M.Lam('x', M.J(M.Var(0), M.Lam('y', M.Lam('q', M.NAT)), M.ZERO, M.Var(0), M.REFL));
      const highSigma = M.SigmaInd(M.Annot(M.Pair(M.NAT, M.ZERO), M.Sigma('T', M.U(0), M.Var(0))),
        M.Lam('p', M.NAT), M.Lam('T', M.Lam('x', M.ZERO)));
      const highJ = M.J(M.NAT, M.Lam('T', M.Lam('q', M.NAT)), M.ZERO, M.NAT, M.REFL);
      const highFamily = M.SigmaInd(M.Annot(M.Pair(M.ZERO, M.NAT), M.Sigma('n', M.NAT, M.U(0))),
        M.Lam('p', M.NAT), M.Lam('n', M.Lam('T', M.ZERO)));
      const result = [roundTrip(nat, M.NAT), roundTrip(unit, M.NAT), roundTrip(sigma, sigmaType),
        roundTrip(identity, M.Pi('x', M.NAT, M.NAT)), roundTrip(highSigma, M.NAT), roundTrip(highJ, M.NAT)];
      const symbol = w.getBlocksByType('tt_eliminator_J')[0];
      if (!symbol.getField('A_LEVEL').isVisible() || !!symbol.getField('B_LEVEL')) throw new Error('Wrong universe fields for J');
      const sigmaSymbol = w.newBlock('tt_eliminator_ind_sigma'); sigmaSymbol.initSvg(); sigmaSymbol.render();
      if (!sigmaSymbol.getField('B_LEVEL').isVisible()) throw new Error('Missing family universe field');
      result.push(roundTrip(highFamily, M.NAT));
      return result;
    });
    assert(results.every(symbols => symbols.length > 0));
    assert.equal(results[4][0].levels[0], 1); assert.equal(results[5][0].levels[0], 1);
    assert.deepEqual(results[6][0].levels, [0, 1]);
    assert.deepEqual(errors, []);
    console.log('PASS: function-only eliminators, partial applications, higher universes, local scope, computation and persistence');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
