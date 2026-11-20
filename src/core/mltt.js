/* Public MLTT API shared by Node and the browser. */
(function (global, factory) {
  const isNode = typeof window === 'undefined' && typeof module === 'object' && module.exports;
  const runtime = (isNode ? require('./runtime.js') : global.MLTTCreateRuntime)();
  const printing = (isNode ? require('./printing.js') : global.MLTTCreatePrinting)(runtime);
  const checking = (isNode ? require('./checking.js') : global.MLTTCreateChecking)(runtime, printing);
  const blocks = (isNode ? require('./block-checking.js') : global.MLTTCreateBlockChecking)(runtime, printing, checking);
  const api = factory(runtime, printing, checking, blocks);
  if (isNode) module.exports = api;
  global.MLTT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime, printing, checking, blocks) {
  'use strict';
  const { Var, U, Pi, Sigma, Lam, App, Pair, Fst, Snd, Id, NatRec, If, Absurd, J, Annot, Hole, Ref, Const, UnitRec, SigmaInd,
    NAT, ZERO, SUC, BOOL, TRUE, FALSE, EMPTY, UNIT, STAR, REFL, evalTm, quote, conv, envOf, define, clearDefs, DEFS, CheckError } = runtime;
  return {
    Var, U, Pi, Sigma, Lam, App, Pair, Fst, Snd, Id, NatRec, If, Absurd, J, Annot, Hole, Ref, Const, UnitRec, SigmaInd,
    NAT, ZERO, SUC, BOOL, TRUE, FALSE, EMPTY, UNIT, STAR, REFL,
    evalTm, quote, conv, envOf, define, clearDefs, DEFS, CheckError,
    ...printing, ...checking, ...blocks,
  };
});
