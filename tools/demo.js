'use strict';
/* Command-line demo: print each level knowns, goal, and reference solution, then verify. */
const M = require('../src/core.js');
const { levels } = require('../src/levels.js');

const line = '-'.repeat(64);
console.log('\nMLTT Block Game - Level List\n' + line);
for (const lv of levels) {
  const ctx = M.buildCtx(lv.givens);
  console.log('\n' + lv.id + '  ' + lv.title + '   [' + lv.tag + ']');
  console.log('  ' + (lv.story || ''));
  for (let i = 0; i < lv.givens.length; i++) {
    const g = lv.givens[i];
    console.log('  given   ' + g.name + ' : ' + M.show(ctx.slice(0, i), g.ty));
  }
  for (const b of (lv.answerBinders || [])) {
    console.log('  local   ' + b.name + ' : ' + M.show(ctx, b.ty));
    ctx.push({ name: b.name, ty: M.evalTm(M.envOf(ctx), b.ty) });
  }
  console.log('  |- ' + (lv.inferTerm ? M.show(ctx, lv.inferTerm) + ' : ?' : M.show(ctx, lv.goal)));
  const r = M.checkLevel(lv, lv.solution);
  console.log('  solution ' + lv.solutionText + '   ' + (r.ok ? '[ok] passed' : '[FAIL] ' + r.error.message));
}
console.log('\n' + line + '\n' + levels.length + ' levels. Run npm test for regression tests.\n');
