/* Named level expressions; initialized with the shared open-term constructors. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTLevelFoundations = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (syntax) {
  'use strict';
  const { v, Uo, pi, sigma, lam, app, pair, fst, snd, id, natrec, Jop, unitrec, sigind, absurd, ref, NATo, REFLo, ZEROo, EMPTYo, UNITo, STARo, nat, not } = syntax;
  return [
    {
      id: 'L0', title: 'Who are you', tag: 'Variables',
      story: 'The answer slot already carries a local variable x : A—just drag it in.',
      givensRaw: [{ name: 'A', ty: Uo(0) }],
      goalRaw: v('A'),
      answerBinderRaw: { name: 'x', ty: v('A') },
      goalText: 'A',
      palette: ['tt_var'],
      newBlocks: ['tt_var'],
      par: 1,
      hints: [
        'The left side of the answer slot says x : A; that is its local variable.',
        'Hover over x and a variable block pops out; drag it into the answer slot.',
        'The variable block binds automatically to the answer slot\'s x—that is LBM scoping.'
      ],
      solutionRaw: v('x'),
      solutionText: 'x'
    },
    {
      id: 'L1', title: 'Make a variable', tag: 'λ and scope',
      story: 'λ is where a local variable is born: its name is visible only in the body.',
      givensRaw: [{ name: 'A', ty: Uo(0) }],
      goalRaw: pi('x', v('A'), v('A')),
      goalText: 'A → A',
      palette: ['tt_lam', 'tt_var'],
      newBlocks: ['tt_lam'],
      par: 2,
      hints: [
        'The goal is A → A: you need a function that takes an A and gives back an A.',
        'Drag a λ into the answer slot and name its binder x.',
        'Put a variable block in the body of the λ: the dropdown only contains its own x.'
      ],
      solutionRaw: lam('x', v('x')),
      solutionText: 'λx. x'
    },
    {
      id: 'L2', title: 'The outer x', tag: 'λ and outer variables',
      story: 'λ binds a new variable; but the x in the answer slot lives outside and is still available.',
      givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }],
      answerBinderRaw: { name: 'x', ty: v('A') },
      goalRaw: pi('y', v('B'), v('A')),
      goalText: 'B → A',
      palette: ['tt_lam', 'tt_var'],
      newBlocks: [],
      par: 2,
      hints: [
        'The context already has x : A; the goal is B → A.',
        'First use λ to introduce y : B.',
        'The body must return an A: use the outer x, not y.'
      ],
      solutionRaw: lam('y', v('x')),
      solutionText: 'λy. x'
    },
    {
      id: 'L3', title: 'Use a function', tag: 'Application',
      story: 'Functions are waiting to be applied: f takes an A, and x is exactly an A.',
      givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }],
      answerBindersRaw: [
        { name: 'f', ty: pi('_', v('A'), v('B')) },
        { name: 'x', ty: v('A') }
      ],
      goalRaw: v('B'),
      goalText: 'B',
      palette: ['tt_app', 'tt_var'],
      newBlocks: ['tt_app'],
      par: 3,
      hints: [
        'The answer slot has local variables f : A → B and x : A.',
        'Drag the application block into the answer slot: the function goes on the left, the argument on the right.',
        'Hover over f / x to get variable blocks, then build f x.'
      ],
      solutionRaw: app(v('f'), v('x')),
      solutionText: 'f x'
    },
    {
      id: 'L4', title: 'Two layers', tag: 'Double application',
      story: 'f takes an A and then a B; x and y are exactly the two arguments.',
      givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }, { name: 'C', ty: Uo(0) }],
      answerBindersRaw: [
        { name: 'f', ty: pi('_', v('A'), pi('_', v('B'), v('C'))) },
        { name: 'x', ty: v('A') },
        { name: 'y', ty: v('B') }
      ],
      goalRaw: v('C'),
      goalText: 'C',
      palette: ['tt_app', 'tt_var'],
      newBlocks: [],
      par: 5,
      hints: [
        'The answer slot has local variables f : A → B → C, x : A, and y : B.',
        'First compute f x: it gives a function of type B → C.',
        'Then feed in y: f x y (application is left-associative).'
      ],
      solutionRaw: app(app(v('f'), v('x')), v('y')),
      solutionText: 'f x y'
    },
    {
      id: 'L5', title: 'Curry it', tag: 'Partial application',
      story: 'After f takes an A, the remaining B → C is itself the answer; this is currying.',
      givensRaw: [{ name: 'A', ty: Uo(0) }, { name: 'B', ty: Uo(0) }, { name: 'C', ty: Uo(0) }],
      answerBindersRaw: [
        { name: 'f', ty: pi('_', v('A'), pi('_', v('B'), v('C'))) },
        { name: 'x', ty: v('A') }
      ],
      goalRaw: pi('y', v('B'), v('C')),
      goalText: 'B → C',
      palette: ['tt_app', 'tt_var'],
      newBlocks: [],
      par: 3,
      hints: [
        'The goal is B → C; note that f x already has this type.',
        'f : A → B → C takes an A, and what remains is B → C.',
        'No λ needed: just build f x with the application block.'
      ],
      solutionRaw: app(v('f'), v('x')),
      solutionText: 'f x'
    },
    {
      id: 'L6', title: 'Infer the application type', tag: 'Type inference',
      story: 'The term f x is given. Infer its type and submit the type itself—not the term.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: Uo(0) },
        { name: 'f', ty: pi('_', v('A'), v('B')) },
        { name: 'x', ty: v('A') }
      ],
      inferTermRaw: app(v('f'), v('x')),
      defaultVarName: 'B',
      goalRaw: Uo(0),
      goalText: 'Type 0',
      palette: ['tt_var'],
      newBlocks: [],
      par: 1,
      hints: [
        'The term is f x. Since f : A → B and x : A, the application returns a B.',
        'You are filling in a type, not a term: submit B, the result type of f x.',
        'B is a local variable in the answer slot. Hover over B and drag its variable block into the type hole.'
      ],
      solutionRaw: v('B'),
      solutionText: 'B'
    },
    {
      id: 'L7', title: 'Infer the Pi application type', tag: 'Dependent application',
      story: 'Now f is a dependent function. Apply it to a and infer the result type—the codomain changes with the argument.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: pi('_', v('A'), Uo(0)) },
        { name: 'f', ty: pi('x', v('A'), app(v('B'), v('x'))) },
        { name: 'a', ty: v('A') }
      ],
      inferTermRaw: app(v('f'), v('a')),
      defaultVarName: 'B',
      goalRaw: Uo(0),
      goalText: 'Type 0',
      palette: ['tt_app', 'tt_var'],
      newBlocks: [],
      par: 3,
      hints: [
        'f : (x : A) → B x. Applying f to a gives the type B a—not a fixed type.',
        'You are filling in a type: build B a with the application block.',
        'Drag B and a from the local variables; B is the type family and a is the argument.'
      ],
      solutionRaw: app(v('B'), v('a')),
      solutionText: 'B a'
    },
    {
      id: 'L8', title: 'Unit: introduction', tag: '1 (unit)',
      story: 'The unit type 1 has exactly one canonical element: ★.',
      goalRaw: UNITo,
      goalText: '1',
      palette: ['tt_unit', 'tt_star'],
      newBlocks: ['tt_unit', 'tt_star'],
      par: 1,
      hints: [
        'The goal is 1, the unit type.',
        'Its introduction rule says ★ : 1.',
        'Drag ★ into the answer slot.'
      ],
      solutionRaw: STARo,
      solutionText: '★'
    },
    {
      id: 'L9', title: 'Unit: elimination', tag: '1-elim',
      story: 'Eliminate a unit value with a type family C. From c : C ★, the term unitrec u C c has type C u.',
      answerBindersRaw: [
        { name: 'C', ty: pi('_', UNITo, Uo(0)) },
        { name: 'u', ty: UNITo },
        { name: 'c', ty: app(v('C'), STARo) }
      ],
      goalRaw: app(v('C'), v('u')),
      goalText: 'C u',
      palette: ['tt_unitrec', 'tt_var'],
      newBlocks: ['tt_unitrec'],
      par: 4,
      hints: [
        'C : 1 → Type is a type family, u : 1, and c : C ★.',
        'Use the elimination rule: unitrec u C c.',
        'It returns C u—the family applied to the unit value.'
      ],
      solutionRaw: unitrec(v('u'), v('C'), v('c')),
      solutionText: 'unitrec u C c'
    },
    {
      id: 'L10', title: 'Unit: computation', tag: '1-computation',
      story: 'At ★, unitrec computes to its base case: unitrec ★ C c ≡ c.',
      answerBindersRaw: [
        { name: 'C', ty: pi('_', UNITo, Uo(0)) },
        { name: 'c', ty: app(v('C'), STARo) }
      ],
      goalRaw: app(v('C'), STARo),
      goalText: 'C ★',
      palette: ['tt_unitrec', 'tt_star', 'tt_var'],
      newBlocks: [],
      par: 4,
      requireBlock: 'tt_unitrec',
      requireBlockName: 'unitrec',
      hints: [
        'The goal is C ★. c already has this type, but this level asks for the computation rule.',
        'Build unitrec ★ C c: with u = ★ the eliminator reduces to its base case c.',
        'Use ★ in the u slot, C as the family, and c as the base case.'
      ],
      solutionRaw: unitrec(STARo, v('C'), v('c')),
      solutionText: 'unitrec ★ C c'
    }
  ];
});
