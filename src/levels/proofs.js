/* Small examples that expose the inference rules behind term construction. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTLevelProofs = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function ({ v, Uo, pi, app }) {
  return [{
    id: 'R0', title: 'Your first inference', tag: 'Application rule · Π-elim',
    story: 'Complete both premises, insert Π-elim beside the bar, and construct f x : B in the conclusion below.',
    givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }],
    answerBindersRaw: [
      { name: 'f', ty: pi('_', v('A'), v('B')) },
      { name: 'x', ty: v('A') },
    ],
    goalRaw: v('B'), goalText: 'B',
    palette: ['tt_var', 'tt_rule_app'], newBlocks: ['tt_rule_app'],
    starterBlock: 'tt_rule_app', parExtra: 1, requireBlock: 'tt_rule_app', requireBlockName: 'Π-elim',
    hints: [
      'The first premise needs a function. Drag f into the first slot above the line.',
      'The second premise needs its argument. Drag x into the second slot.',
      'Insert Π-elim in the rule slot. Build f x with an application block and place it in the conclusion.',
    ],
    solutionRaw: app(v('f'), v('x')), solutionText: 'f x  (Π-elim)',
  }, {
    id: 'R1', title: 'Judgments inside a rule', tag: 'Premises · judgments',
    story: 'The submission contains a function-application card. Complete its two judgment premises: first produce the function f, then its argument x. The conclusion follows below the line.',
    givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }],
    answerBindersRaw: [
      { name: 'f', ty: pi('_', v('A'), v('B')) },
      { name: 'x', ty: v('A') },
    ],
    goalRaw: v('B'), goalText: 'B',
    palette: ['tt_var', 'tt_rule_app', 'tt_judgment'], newBlocks: ['tt_judgment'],
    rootRule: true, starterBlock: 'tt_rule_app', starterPremises: true, parExtra: 3,
    requireBlock: 'tt_rule_app', requireBlockName: 'Π-elim (⊢)',
    hints: [
      'Each purple card is a judgment: its context is above ⊢, and its term goes in the slot below.',
      'Put f in the first judgment and x in the second. Both use the same context.',
      'Insert Π-elim, then fill f x in the conclusion. Checking verifies that the conclusion matches the rule.',
    ],
    solutionRaw: app(v('f'), v('x')), solutionText: 'f x  (⊢ / Π-elim)',
  }];
});
