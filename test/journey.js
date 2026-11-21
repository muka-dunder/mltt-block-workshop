'use strict';
const assert = require('node:assert/strict');
const M = require('../src/core/mltt.js');
const { levels, nat, close } = require('../src/levels/index.js');
const get = id => {
  const level = levels.find(item => item.id === id);
  assert(level, 'Missing level: ' + id);
  return level;
};
const addBlock = { type: 'tt_lemma_add', fields: { NAME: 'another_name' }, inputs: {} };
assert.equal(M.elabBlock(addBlock).name, 'add', 'Each lemma block has a fixed identity');
assert(M.conv(M.infer([], M.elabBlock(addBlock)), M.infer([], M.Ref('add'))));
assert(M.conv(M.evalTm([], M.App(M.App(M.elabBlock(addBlock), close(nat(2))), close(nat(3)))), M.evalTm([], close(nat(5)))));
const series = name => levels.filter(level => level.series === name).sort((a, b) => a.seriesOrder - b.seriesOrder);
assert.deepEqual(series('journey').map(level => level.id), [
  'L0', 'L1', 'L3', 'L7', 'L8', 'journey_pair', 'L13', 'journey_nat', 'journey_double', 'L15', 'L19', 'journey_induction',
]);
assert.deepEqual(series('functions').map(level => level.id), ['L2', 'L5', 'function_compose', 'function_curry']);
assert.deepEqual(series('dependent').map(level => level.id), ['dependent_constant', 'dependent_pi', 'L17']);
assert.equal(new Set(levels.map(level => level.id)).size, levels.length);
assert.deepEqual(levels.slice(0, 23).map(level => level.id), Array.from({ length: 23 }, (_, i) => 'L' + i), 'Existing indexed references remain stable');
assert.deepEqual(levels.slice(23, 25).map(level => level.id), ['R0', 'R1']);

for (const level of levels.filter(item => item.series)) {
  const result = M.checkLevel(level, level.solution);
  assert(result.ok, level.id + ': ' + (result.error?.message || 'incomplete reference solution'));
  assert(level.titleZh, 'Missing Chinese display title: ' + level.id);
  assert(Number.isInteger(level.seriesOrder));
}

const key = (term, input) => {
  if (input === 'BODY') return ['pi', 'sigma'].includes(term.t) ? 'cod' : 'body';
  return { F: 'f', A: 'a' }[input];
};
function holeAt(term, path) {
  if (!path.length) return M.Hole('journey-step');
  const property = key(term, path[0]);
  assert(property && term[property], 'Invalid scaffold slot ' + path.join('/'));
  return { ...term, [property]: holeAt(term[property], path.slice(1)) };
}
for (const level of levels.filter(item => item.scaffoldPaths)) {
  let incomplete = level.solution;
  for (const path of level.scaffoldPaths) incomplete = holeAt(incomplete, path);
  const result = M.checkLevel(level, incomplete);
  // Workspace checking separately collects visible sockets. This core check
  // verifies that retaining the surrounding binders causes no scope/type error.
  assert(!result.error || result.error.code === 'E_HOLE', 'A scaffold must retain well-scoped typed holes: ' + level.id);
}

const double = get('journey_double').solution;
for (let n = 0; n < 4; n++) {
  assert(M.conv(M.evalTm([], M.App(double, close(nat(n)))), M.evalTm([], close(nat(2 * n)))), 'Doubling reference at ' + n);
}
assert(!M.checkLevel(get('journey_induction'), M.Lam('n', M.REFL)).ok, 'The induction theorem needs its step for an unknown n');
assert(!M.checkLevel(get('dependent_constant'), M.Lam('x', M.Var(0))).ok, 'A family returns a type, not an input value');
assert(!M.checkLevel(get('dependent_pi'), M.Var(2)).ok, 'The whole dependent function type must be reconstructed');
assert(!M.checkLevel(get('function_compose'), M.Lam('x', M.Var(0))).ok, 'Composition must produce the target type C');
const natural = get('journey_nat');
assert.equal(natural.requireBlock, 'tt_suc');
assert.equal(M.checkBlocks(natural, { type: 'tt_zero', inputs: {} }).error.code, 'E_REQUIRE');
assert(M.checkBlocks(natural, { type: 'tt_suc', inputs: { N: { type: 'tt_zero', inputs: {} } } }).ok);
console.log('PASS: three short series, stable legacy IDs, scoped scaffolds, reference computation and wrong-answer rejection');
