'use strict';
const assert = require('node:assert/strict');
const M = require('../src/core/mltt.js');
const { levels } = require('../src/levels/index.js');
let next = 0;
const b = (type, inputs = {}, fields = {}, id = 'c' + next++) => ({ type, inputs, fields, id });
const ref = declaration => b('tt_var', {}, { REF: 'b' + declaration.id + ':decl␟' + declaration.fields.NAME });
const universe = () => b('tt_U', {}, { LEVEL: '0' });
const binding = (name, type) => b('tt_binding', { TYPE: type }, { NAME: name });
const withContext = (card, declarations) => {
  if (!declarations) return card;
  card.contextCount = declarations.length;
  declarations.forEach((binding, i) => { card.inputs['CONTEXT' + i] = binding; }); return card;
};
const judgment = (term, type, declarations) => withContext(b('tt_judgment', { TERM: term, TYPE: type }), declarations);
const problem = term => ({ ...b('tt_problem', { TERM: term }), entryVersion: 2 });
const custom = (term, declarations = []) => M.checkCustomProblem(problem(term), declarations);
const pi = (dom, cod) => {
  const j = b('tt_pi', { DOM: dom, BODY: cod }); j.binds = { BODY: ['pi-' + j.id] }; j.names = { ['pi-' + j.id]: 'z' }; return j;
};
const app = (f, a) => b('tt_app', { F: f, A: a });
const rule = (premises, result, chosen = b('tt_rule_pi_elim'), declarations) => withContext({
  ...b('tt_rule_app', { ...Object.fromEntries(premises.map((p, i) => [i === 0 ? 'F' : i === 1 ? 'A' : 'P' + i, p])),
    RULE: chosen, RESULT: result }), premiseCount: premises.length,
}, declarations);
const A = binding('A', universe()), x = binding('x', ref(A));
assert(custom(judgment(ref(x), ref(A), [A, x])).ok, 'A context can introduce a type and its element');
const family = binding('B', pi(ref(A), universe()));
const a = binding('a', ref(A)), ba = () => app(ref(family), ref(a));
const value = binding('b', ba());
assert(custom(judgment(ref(value), ba(), [A, family, a, value])).ok, 'Later context entries can depend on earlier entries');
assert(!custom(judgment(ref(x), ref(A), [x, A])).ok, 'Forward dependencies are rejected');
assert(!custom(judgment(ref(x), ref(A), [A, A, x])).ok, 'Repeated names in one list are rejected');
const hole = judgment(ref(x), ref(A), [A]); hole.contextCount = 2;
assert(!custom(hole).ok, 'An unfilled list item is a hole');
assert(!custom(judgment(b('tt_var', {}, { REF: 'wrong-uid␟x' }), ref(A), [A, x])).ok, 'A foreign UID cannot borrow a same-named variable');
const B = binding('C', universe()), f = binding('f', pi(ref(A), ref(B)));
const shared = [A, B, f, x];
const application = () => rule([judgment(ref(f), pi(ref(A), ref(B))), judgment(ref(x), ref(A))], judgment(app(ref(f), ref(x)), ref(B)), undefined, shared);
const valid = application();
assert(custom(valid).ok, 'A rule supplies the shared context to all premises and its conclusion');
for (const count of [0, 1, 3]) {
  const invalid = application(); invalid.premiseCount = count;
  assert.equal(custom(invalid).error.messageKey, 'premiseCount');
}
const theorem = (type, id) => b('tt_declare', { TYPE: type }, { KIND: 'axiom', NAME: id }, id);
const h = theorem(pi(b('tt_nat'), pi(b('tt_nat'), pi(b('tt_nat'), b('tt_nat')))), 'h');
const hRef = () => b('tt_symbol', {}, { REF: 'h' });
const theoremRule = b('tt_rule_theorem', { THEOREM: hRef() });
const zero = () => b('tt_zero');
const triple = app(app(app(hRef(), zero()), zero()), zero());
assert(custom(rule([zero(), zero(), zero()], triple, theoremRule), [h]).ok, 'Theorem rules accept three premises');
assert(custom(rule([], hRef(), theoremRule), [h]).ok, 'A theorem can be used with no arguments');
assert(custom(rule([zero()], app(hRef(), zero()), theoremRule), [h]).ok, 'Partial application leaves a function conclusion');
const localTheorem = binding('k', pi(b('tt_nat'), pi(b('tt_nat'), pi(b('tt_nat'), b('tt_nat')))));
const localTheoremRule = b('tt_rule_theorem', { THEOREM: ref(localTheorem) });
const localTriple = app(app(app(ref(localTheorem), zero()), zero()), zero());
assert(custom(rule([zero(), zero(), zero()], localTriple, localTheoremRule, [localTheorem])).ok,
  'A theorem declared entirely inside the card needs no preset or global declaration');
assert(!custom(rule([zero(), zero(), zero(), zero()], zero(), theoremRule), [h]).ok, 'Excess theorem arguments are rejected');
const repeated = JSON.parse(JSON.stringify(shared));
const replacements = new Map(repeated.map(d => [d.id, 'repeat-' + d.id]));
function remap(j) {
  if (!j) return;
  if (replacements.has(j.id)) j.id = replacements.get(j.id);
  if (j.fields?.REF) for (const [oldId, newId] of replacements) j.fields.REF = j.fields.REF.replace('b' + oldId + ':decl', 'b' + newId + ':decl');
  Object.values(j.inputs || {}).forEach(remap);
}
repeated.forEach(remap);
const repeatedRule = application();
withContext(repeatedRule.inputs.F, repeated);
assert(custom(repeatedRule).ok, 'A repeated equivalent context is checked without introducing duplicate variables');
repeated[0].inputs.TYPE = b('tt_nat');
assert(!custom(repeatedRule).ok, 'An incompatible repeated context is rejected');
const escaping = app(judgment(ref(f), pi(ref(A), ref(B)), shared), ref(x));
assert(!custom(escaping).ok, 'A local judgment context cannot leak into a surrounding expression');
const portable = problem(application());
assert(M.checkWorkshop(levels[0], portable, []).ok, 'Preset checking reads the explicit card context');
assert(M.checkCustomProblem(portable, []).ok, 'The same card tree can be checked in custom mode');
const legacy = b('tt_answer', { TERM: b('tt_var', {}, { REF: 'legacy␟x' }) });
legacy.binds = { TERM: ['legacy'] }; legacy.names = { legacy: 'x' };
assert(M.checkWorkshop(levels[0], legacy, []).ok, 'Legacy answer binders remain readable');
console.log('PASS: explicit dependent contexts, portable preset/custom cards, variable premises, rule arity, scope and legacy compatibility');
