'use strict';
const assert = require('node:assert/strict');
const M = require('../src/core/mltt.js');
const { levels } = require('../src/levels/index.js');
const level = levels.find(lv => lv.id === 'R0');
const ref = name => ({ type: 'tt_var', fields: { REF: 'answer-' + name + '␟' + name } });
const answer = term => ({ type: 'tt_answer', binds: { TERM: ['answer-f', 'answer-x'] },
  names: { 'answer-f': 'f', 'answer-x': 'x' }, inputs: { TERM: term } });
const selectedRule = () => ({ type: 'tt_rule_pi_elim' });
const rule = (f, a) => ({ type: 'tt_rule_app', id: 'rule', inputs: { F: f, A: a, RULE: selectedRule() } });
assert(M.checkBlocks(level, answer(rule(ref('f'), ref('x')))).ok);
assert(!M.checkBlocks(level, answer(rule(ref('x'), ref('f')))).ok);
assert(!M.checkBlocks(level, answer(rule(ref('f'), null))).ok);
const forged = rule(ref('x'), ref('f'));
forged.fields = { CONCLUSION: 'Γ ⊢ f x : B', FTYPE: 'A → B', ATYPE: 'A' };
assert(!M.checkBlocks(level, answer(forged)).ok, 'Labels cannot forge a valid derivation');
assert.equal(M.checkBlocks(level, answer({ type: 'tt_app', inputs: { F: ref('f'), A: ref('x') } })).error.code, 'E_REQUIRE');
// Rule cards elaborate to ordinary applications and can form nested derivations.
const nestedLevel = { ...level, answerBinders: [
  { name: 'f', ty: M.Pi('_', M.Var(1), M.Pi('_', M.Var(2), M.Var(2))) },
  { name: 'x', ty: M.Var(2) },
] };
assert(M.checkBlocks(nestedLevel, answer(rule(rule(ref('f'), ref('x')), ref('x')))).ok);
const judgmentsLevel = levels.find(lv => lv.id === 'R1');
const judgment = term => ({ type: 'tt_judgment', fields: { GOAL: '?' }, inputs: { TERM: term } });
const judgmentsRule = (f, a) => ({ type: 'tt_rule_judgments', inputs: { F: f, A: a, RULE: selectedRule() } });
assert(M.checkBlocks(judgmentsLevel, answer(judgmentsRule(judgment(ref('f')), judgment(ref('x'))))).ok);
assert(!M.checkBlocks(judgmentsLevel, answer(judgmentsRule(judgment(ref('x')), judgment(ref('f'))))).ok);
assert(M.checkBlocks(judgmentsLevel, answer(judgmentsRule(ref('f'), ref('x')))).ok);
assert(M.checkBlocks(judgmentsLevel, answer(rule(judgment(ref('f')), ref('x')))).ok);
assert(M.checkBlocks(judgmentsLevel, answer(rule(ref('f'), judgment(ref('x'))))).ok);
const missingRule = rule(ref('f'), ref('x')); delete missingRule.inputs.RULE;
assert.equal(M.checkBlocks(level, answer(missingRule)).error.messageKey, 'ruleMissing');
assert.equal(M.checkBlocks(level, answer({ ...missingRule, inputs: { ...missingRule.inputs, RULE: { type: 'tt_nat' } } })).error.messageKey, 'ruleInvalid');
const theoremLevel = { givens: [{ name: 'h', ty: M.Pi('a', M.NAT, M.Pi('b', M.NAT, M.NAT)) }], goal: M.NAT };
const theoremRule = { type: 'tt_rule_app', inputs: { F: { type: 'tt_zero' }, A: { type: 'tt_zero' },
  RULE: { type: 'tt_rule_theorem', inputs: { THEOREM: { type: 'tt_given', fields: { IDX: '0' } } } } } };
assert(M.checkBlocks(theoremLevel, theoremRule).ok);
console.log('PASS: application derivation, wrong premises, incomplete premises, forged labels, required rule, nested rules');
