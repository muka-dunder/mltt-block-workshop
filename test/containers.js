'use strict';
const assert = require('node:assert/strict');
const M = require('../src/core/mltt.js');
const { levels } = require('../src/levels/index.js');
const b = (type, inputs = {}, fields = {}, id = type) => ({ type, inputs, fields, id });
const problem = (requirement, submission) => b('tt_problem', { TYPE: requirement, TERM: submission });
const nat = b('tt_nat'), zero = b('tt_zero'), unit = b('tt_unit'), star = b('tt_star');
const typeRequirement = type => b('tt_requirement_type', { TYPE: type });
const inferRequirement = term => b('tt_requirement_infer', { EXPR: term });
const check = (requirement, submission, declarations = []) => M.checkCustomProblem(problem(requirement, submission), declarations);
assert(check(typeRequirement(unit), star).ok);
assert(!check(typeRequirement(unit), zero).ok);
assert(!check(typeRequirement(zero), zero).ok, 'A type requirement must contain a type');
assert(!check(b('tt_requirement_type'), star).ok);
assert(check(inferRequirement(zero), nat).ok);
assert(!check(inferRequirement(zero), unit).ok);
assert(!check(b('tt_requirement_infer'), nat).ok);
const arrow = b('tt_pi', { DOM: nat, BODY: nat });
arrow.binds = { BODY: ['pi-x'] }; arrow.names = { 'pi-x': 'x' };
const h = b('tt_declare', { TYPE: arrow }, { KIND: 'axiom', NAME: 'h' }, 'h');
const refH = b('tt_symbol', {}, { REF: 'h' });
const ordinaryApplication = b('tt_app', { F: refH, A: zero });
const inference = b('tt_rule_app', { F: refH, A: zero, RULE: b('tt_rule_pi_elim') });
const derivationRequirement = kind => b('tt_requirement_derivation', { TYPE: nat }, { RULE_KIND: kind });
assert(check(derivationRequirement('application'), inference, [h]).ok);
assert(check(derivationRequirement('any'), inference, [h]).ok);
assert(!check(derivationRequirement('application'), ordinaryApplication, [h]).ok,
  'A well-typed plain term is not a completed derivation');
assert(!check(derivationRequirement('invented'), inference, [h]).ok);
assert(check(unit, star).ok, 'Legacy raw-type custom requirements stay readable');
const local = b('tt_var', {}, { REF: 'answer-x␟x' });
const preset = problem(typeRequirement(nat), local);
preset.binds = { TYPE: ['answer-x'], TERM: ['answer-x'] }; preset.names = { 'answer-x': 'x' };
assert(M.checkBlocks(levels[0], preset).ok);
assert(!M.checkBlocks(levels[0], { ...preset, inputs: { TYPE: typeRequirement(nat), TERM: zero } }).ok,
  'Preset checking uses the trusted level requirement, not a forged target');
assert(M.checkBlocks(levels[0], { ...preset, type: 'tt_answer' }).ok,
  'Legacy container JSON retains its lexical references');
console.log('PASS: shared checking containers, type/inference/derivation requirements, preset authority and legacy compatibility');
