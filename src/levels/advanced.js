/* Named level expressions; initialized with the shared open-term constructors. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTLevelAdvanced = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (syntax) {
  'use strict';
  const { v, Uo, pi, sigma, lam, app, pair, fst, snd, id, natrec, Jop, unitrec, sigind, absurd, ref, NATo, REFLo, ZEROo, EMPTYo, UNITo, STARo, nat, not } = syntax;
  return [
    {
      id: 'L11', title: 'Empty: elimination', tag: '0-elim',
      story: 'The empty type 0 has no elements. From e : 0, anything follows.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'e', ty: EMPTYo }
      ],
      goalRaw: v('A'),
      goalText: 'A',
      palette: ['tt_empty', 'tt_absurd', 'tt_var'],
      newBlocks: ['tt_empty', 'tt_absurd'],
      par: 2,
      hints: [
        '0 is the empty type: it has no introduction rule.',
        'Elimination: from e : 0, absurd e inhabits any type A.',
        'Drag absurd and put e in it.'
      ],
      solutionRaw: absurd(v('e')),
      solutionText: 'absurd e'
    },
    {
      id: 'L12', title: 'Product: introduction', tag: 'x (product)',
      story: 'A product A x B pairs an A with a B.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: Uo(0) },
        { name: 'a', ty: v('A') },
        { name: 'b', ty: v('B') }
      ],
      goalRaw: sigma('_', v('A'), v('B')),
      goalText: 'A x B',
      palette: ['tt_sigma', 'tt_pair', 'tt_var'],
      newBlocks: ['tt_sigma', 'tt_pair'],
      par: 3,
      hints: [
        'The goal is the product A x B (a non-dependent Sigma).',
        'Introduction: pair an A with a B.',
        'Drag the pair block, then put a and b into its two slots.'
      ],
      solutionRaw: pair(v('a'), v('b')),
      solutionText: '⟨a, b⟩'
    },
    {
      id: 'L13', title: 'Sigma: fst via ind', tag: 'Sigma elimination',
      story: 'Define fst for a dependent pair using ind_sigma, not a primitive fst.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: pi('_', v('A'), Uo(0)) }
      ],
      goalRaw: pi('p', sigma('x', v('A'), app(v('B'), v('x'))), v('A')),
      goalText: '(Sigma x : A. B x) -> A',
      palette: ['tt_lam', 'tt_var', 'tt_eliminator_ind_sigma', 'tt_app'],
      newBlocks: ['tt_eliminator_ind_sigma'],
      par: 5,
      hints: [
        'Open a λ for p. The goal becomes A.',
        'Eliminate p with ind_sigma; the motive is constantly A.',
        'In the step case, bind a : A and b : B a, then return a.'
      ],
      solutionRaw: lam('p', sigind(v('p'), '_', v('A'), 'a', 'b', v('a'))),
      solutionText: 'λp. ind_sigma A B p (λ_. A) (λa b. a)'
    },
    {
      id: 'L14', title: 'Sigma: snd via ind', tag: 'Sigma elimination',
      story: 'Define snd using ind_sigma on a product Sigma type.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: Uo(0) }
      ],
      goalRaw: pi('p', sigma('_', v('A'), v('B')), v('B')),
      goalText: '(A x B) -> B',
      palette: ['tt_lam', 'tt_var', 'tt_eliminator_ind_sigma', 'tt_app'],
      newBlocks: [],
      par: 5,
      hints: [
        'Open a λ for p. The goal becomes B.',
        'Eliminate p with ind_sigma; the motive is constantly B.',
        'In the step case, bind a : A and b : B, then return b.'
      ],
      solutionRaw: lam('p', sigind(v('p'), '_', v('B'), 'a', 'b', v('b'))),
      solutionText: 'λp. ind_sigma A (λ_. B) p (λ_. B) (λa b. b)'
    },
    {
      id: 'L15', title: 'Identity: introduction', tag: 'Id',
      story: 'refl proves definitional equality, so it inhabits Id A a a.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'a', ty: v('A') }
      ],
      goalRaw: id(v('A'), v('a'), v('a')),
      goalText: 'Id A a a',
      palette: ['tt_id', 'tt_refl'],
      newBlocks: ['tt_id', 'tt_refl'],
      par: 1,
      hints: [
        'Id A a a is the type of proofs that a equals a.',
        'Its introduction rule is refl.',
        'Drag refl into the answer slot.'
      ],
      solutionRaw: REFLo,
      solutionText: 'refl'
    },
    {
      id: 'L16', title: 'Universe', tag: 'Type 0 : Type 1',
      story: 'Types are terms too: Type 0 lives in Type 1.',
      goalRaw: Uo(1),
      goalText: 'Type 1',
      palette: ['tt_U'],
      newBlocks: ['tt_U'],
      par: 1,
      hints: [
        'The goal is Type 1, a universe.',
        'The universe block defaults to level 0.',
        'Check that Type 0 : Type 1.'
      ],
      solutionRaw: Uo(0),
      solutionText: 'Type 0'
    },
    {
      id: 'L17', title: 'Polymorphic identity', tag: 'Pi types & scope',
      story: 'A Pi type can bind a type and mention it in the codomain. Here you build the polymorphic identity function.',
      goalRaw: pi('A', Uo(0), pi('_', v('A'), v('A'))),
      goalText: 'Π A : Type. A → A',
      palette: ['tt_lam', 'tt_var'],
      newBlocks: [],
      par: 3,
      hints: [
        'The goal is a Pi type: Π (A : Type) → A → A. Its codomain A → A depends on the bound type A.',
        'Open a λ for A. The remaining goal is A → A; open another λ for x : A.',
        'Return x. The outer Pi is dependent—the codomain mentions A—while the inner arrow is a non-dependent Pi.'
      ],
      solutionRaw: lam('A', lam('x', v('x'))),
      solutionText: 'λA. λx. x'
    },
    {
      id: 'L18', title: 'Compute it', tag: 'Definitional equality',
      story: 'add is a transparent definition. The checker really computes it—so 2 + 2 and 4 are definitionally equal.',
      givensRaw: [{ name: 'add', ty: { nt: 'refTy', name: 'add' } }],
      goalRaw: id(NATo, app(app(ref('add'), nat(2)), nat(2)), nat(4)),
      goalText: 'Id ℕ (add 2 2) 4',
      palette: ['tt_refl', 'tt_id', 'tt_nat'],
      newBlocks: [],
      par: 1,
      hints: [
        'Both sides of the goal are already written; your job is to convince the checker that they are equal.',
        'add is transparent, so the checker computes it: add 2 2 reduces to 4.',
        'So refl is enough—it proves definitional equality, not an equality that needs induction.'
      ],
      solutionRaw: REFLo,
      solutionText: 'refl'
    },
    {
      id: 'L19', title: 'Transport', tag: 'Transport',
      story: 'If x and y are equal, then anything in B x can be transported to B y. This is J at its most useful.',
      givensRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: pi('_', v('A'), Uo(0)) },
        { name: 'x', ty: v('A') },
        { name: 'y', ty: v('A') },
        { name: 'p', ty: id(v('A'), v('x'), v('y')) },
        { name: 'b', ty: app(v('B'), v('x')) }
      ],
      goalRaw: app(v('B'), v('y')),
      goalText: 'B y',
      palette: ['tt_eliminator_J', 'tt_app', 'tt_var', 'tt_lam'],
      newBlocks: ['tt_eliminator_J'],
      par: 5,
      hints: [
        'Eliminate on p with base point x.',
        'The motive is λw q. B w.',
        'd is just b: it already lives in B x.'
      ],
      solutionRaw: Jop(v('x'), 'w', 'q', app(v('B'), v('w')), v('b'), v('y'), v('p')),
      solutionText: 'J(a:=x; C:=λw q. B w; d:=b; b:=y; p:=p)'
    },
    {
      id: 'L20', title: 'Types are terms', tag: 'Universe',
      story: 'In MLTT, types are themselves terms and can be equal. Type 0 lives in Type 1.',
      givensRaw: [],
      goalRaw: pi('A', Uo(0), id(Uo(0), v('A'), v('A'))),
      goalText: 'Π A : Type. Id Type A A',
      palette: ['tt_lam', 'tt_refl', 'tt_var'],
      newBlocks: [],
      par: 1,
      hints: [
        'For any type A, A is of course equal to A.',
        'Just use refl.',
        'Note that the first argument of Id is Type 0 itself.'
      ],
      solutionRaw: lam('A', REFLo),
      solutionText: 'λA. refl'
    },
    {
      id: 'L21', title: 'BOSS: transitivity', tag: 'Two eliminations',
      story: 'The final challenge: given x = y and y = z, prove x = z. Both the base point and the motive must be chosen correctly.',
      givensRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'x', ty: v('A') },
        { name: 'y', ty: v('A') },
        { name: 'z', ty: v('A') },
        { name: 'p', ty: id(v('A'), v('x'), v('y')) },
        { name: 'q', ty: id(v('A'), v('y'), v('z')) }
      ],
      goalRaw: id(v('A'), v('x'), v('z')),
      goalText: 'Id A x z',
      palette: ['tt_eliminator_J', 'tt_app', 'tt_refl', 'tt_var', 'tt_lam'],
      newBlocks: [],
      par: 5,
      hints: [
        'This time eliminate on q: q connects y and z.',
        'Choose y as the base point, so the motive is λw r. Id A x w.',
        'd is just p—it is exactly Id A x y.'
      ],
      solutionRaw: Jop(v('y'), 'w', 'r', id(v('A'), v('x'), v('w')), v('p'), v('z'), v('q')),
      solutionText: 'J(a:=y; C:=λw r. Id A x w; d:=p; b:=z; p:=q)'
    },
    {
      id: 'L22', title: 'Triple negation', tag: 'Intuitionistic vs classical',
      story: '¬P is P → 0. Triple-negation elimination holds intuitionistically; what is really unprovable is double-negation elimination, not not P → P.',
      givensRaw: [{ name: 'P', ty: Uo(0) }],
      goalRaw: pi('h', not(not(not(v('P')))), pi('p', v('P'), EMPTYo)),
      goalText: '¬¬¬P → ¬P',
      palette: ['tt_lam', 'tt_app', 'tt_var'],
      newBlocks: [],
      par: 9,
      hints: [
        'First expand not P as P → 0; the goal becomes ((P→0)→0)→0 implies P→0.',
        'Open two λs: λh. λp.; now you need to construct 0.',
        'h needs a (P→0)→0, i.e. "give me a P→0 and I give you 0": write λk. k p.'
      ],
      solutionRaw: lam('h', lam('p', app(v('h'), lam('k', app(v('k'), v('p')))))),
      solutionText: 'λh p. h (λk. k p)'
    }
  ];
});
