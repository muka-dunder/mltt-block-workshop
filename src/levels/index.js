/* Level data.
 * Written as named open terms (v('A'), pi('x', A, B));
 * close(tm, env) turns them into de Bruijn indices once at load time, so indices are not hand-computed.
 */
(function (global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  global.LEVELS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const M = typeof window === 'undefined' ? require('../core/mltt.js') : globalThis.MLTT;
  const { Pi, Lam, App, Pair, Fst, Snd, Id, J, NatRec, U, Var, SUC, ZERO, NAT, REFL, EMPTY, define } = M;

  // ---------- Open terms ----------
  const v = (n) => ({ nt: 'var', n });
  const Uo = (l) => ({ nt: 'U', l: l || 0 });
  const pi = (name, dom, cod) => ({ nt: 'pi', name, dom, cod });
  const sigma = (name, dom, cod) => ({ nt: 'sigma', name, dom, cod });
  const lam = (name, body, ty) => ({ nt: 'lam', name, body, ty: ty || null });
  const app = (f, a) => ({ nt: 'app', f, a });
  const pair = (a, b) => ({ nt: 'pair', a, b });
  const fst = (p) => ({ nt: 'fst', p });
  const snd = (p) => ({ nt: 'snd', p });
  const id = (ty, l, r) => ({ nt: 'id', ty, l, r });
  const natrec = (n, mName, mot, z, kName, ihName, step) =>
    ({ nt: 'natrec', n, mName, mot, z, kName, ihName, step });
  const Jop = (a, yName, qName, mot, d, b, p) =>
    ({ nt: 'J', a, yName, qName, mot, d, b, p });
  const unitrec = (u, mot, base) => ({ nt: 'unitrec', u, mot, base });
  const sigind = (p, pName, mot, aName, bName, step) =>
    ({ nt: 'sigind', p, pName, mot, aName, bName, step });
  const absurd = (e) => ({ nt: 'absurd', e });
  const ref = (name) => ({ nt: 'ref', name });
  const NATo = { nt: 'nat' }, REFLo = { nt: 'refl' }, ZEROo = { nt: 'zero' };
  const EMPTYo = { nt: 'empty' }, UNITo = { nt: 'unit' }, STARo = { nt: 'star' };
  const nat = (n) => { let t = ZEROo; for (let i = 0; i < n; i++) t = { nt: 'suc', n: t }; return t; };
  // Negation: not A := A -> Empty
  const not = (A) => pi('_', A, EMPTYo);

  // ---------- close: name -> de Bruijn ----------
  function close(tm, env) {
    env = env || [];
    switch (tm.nt) {
      case 'var': {
        const pos = env.lastIndexOf(tm.n);
        if (pos < 0) throw new Error('Level error: unbound name ' + tm.n);
        return Var(env.length - 1 - pos);
      }
      case 'ref': return M.Ref(tm.name);
      case 'U': return U(tm.l);
      case 'nat': return NAT;
      case 'zero': return M.ZERO;
      case 'empty': return EMPTY;
      case 'unit': return M.UNIT;
      case 'star': return M.STAR;
      case 'suc': return SUC(close(tm.n, env));
      case 'refl': return REFL;
      case 'pi': return Pi(tm.name, close(tm.dom, env), close(tm.cod, env.concat([tm.name])));
      case 'sigma': return M.Sigma(tm.name, close(tm.dom, env), close(tm.cod, env.concat([tm.name])));
      case 'lam': return Lam(tm.name, close(tm.body, env.concat([tm.name])), tm.ty ? close(tm.ty, env) : null);
      case 'app': return App(close(tm.f, env), close(tm.a, env));
      case 'pair': return Pair(close(tm.a, env), close(tm.b, env));
      case 'fst': return Fst(close(tm.p, env));
      case 'snd': return Snd(close(tm.p, env));
      case 'id': return Id(close(tm.ty, env), close(tm.l, env), close(tm.r, env));
      case 'natrec': {
        const mot = Lam(tm.mName, close(tm.mot, env.concat([tm.mName])), null);
        const step = Lam(tm.kName, Lam(tm.ihName,
          close(tm.step, env.concat([tm.kName, tm.ihName])), null), null);
        return NatRec(close(tm.n, env), mot, close(tm.z, env), step);
      }
      case 'J': {
        const mot = Lam(tm.yName, Lam(tm.qName,
          close(tm.mot, env.concat([tm.yName, tm.qName])), null), null);
        return J(close(tm.a, env), mot, close(tm.d, env), close(tm.b, env), close(tm.p, env));
      }
      case 'unitrec': return M.UnitRec(close(tm.u, env), close(tm.mot, env), close(tm.base, env));
      case 'sigind': {
        const mot = Lam(tm.pName, close(tm.mot, env.concat([tm.pName])), null);
        const step = Lam(tm.aName, Lam(tm.bName,
          close(tm.step, env.concat([tm.aName, tm.bName])), null), null);
        return M.SigmaInd(close(tm.p, env), mot, step);
      }
      case 'absurd': return M.Absurd(close(tm.e, env));
      default: throw new Error('Level error: unknown open term ' + tm.nt);
    }
  }

  // Lemma add (transparent definition): lambda m n. natrec m (lambda _.Nat) n (lambda k ih. suc ih)
  const ADD_TY = Pi('_', NAT, Pi('_', NAT, NAT));
  const ADD_BODY = Lam('m', Lam('n',
    NatRec(Var(1), Lam('_', NAT), Var(0), Lam('k', Lam('ih', SUC(Var(0)))))));
  define('add', ADD_TY, ADD_BODY);

  const raw = [
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
    },
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
      story: 'Define fst for a dependent pair using sigma_ind, not a primitive fst.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: pi('_', v('A'), Uo(0)) }
      ],
      goalRaw: pi('p', sigma('x', v('A'), app(v('B'), v('x'))), v('A')),
      goalText: '(Sigma x : A. B x) -> A',
      palette: ['tt_lam', 'tt_var', 'tt_sigma_ind'],
      newBlocks: ['tt_sigma_ind'],
      par: 5,
      hints: [
        'Open a λ for p. The goal becomes A.',
        'Eliminate p with sigma_ind; the motive is constantly A.',
        'In the step case, bind a : A and b : B a, then return a.'
      ],
      solutionRaw: lam('p', sigind(v('p'), '_', v('A'), 'a', 'b', v('a'))),
      solutionText: 'λp. sigma_ind p (λ_. A) (λa b. a)'
    },
    {
      id: 'L14', title: 'Sigma: snd via ind', tag: 'Sigma elimination',
      story: 'Define snd using sigma_ind on a product Sigma type.',
      answerBindersRaw: [
        { name: 'A', ty: Uo(0) },
        { name: 'B', ty: Uo(0) }
      ],
      goalRaw: pi('p', sigma('_', v('A'), v('B')), v('B')),
      goalText: '(A x B) -> B',
      palette: ['tt_lam', 'tt_var', 'tt_sigma_ind'],
      newBlocks: [],
      par: 5,
      hints: [
        'Open a λ for p. The goal becomes B.',
        'Eliminate p with sigma_ind; the motive is constantly B.',
        'In the step case, bind a : A and b : B, then return b.'
      ],
      solutionRaw: lam('p', sigind(v('p'), '_', v('B'), 'a', 'b', v('b'))),
      solutionText: 'λp. sigma_ind p (λ_. B) (λa b. b)'
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
      palette: ['tt_J', 'tt_var', 'tt_lam'],
      newBlocks: ['tt_J'],
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
      palette: ['tt_J', 'tt_refl', 'tt_var', 'tt_lam'],
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

  // Expand: close each given ty in the context of all preceding names.
  // ---------- Reference solution block counts (used for stars) ----------
  function countOpen(t) {
    if (!t) return 0;
    switch (t.nt) {
      case 'var': case 'ref': case 'U': case 'nat': case 'zero': case 'refl':
      case 'bool': case 'true': case 'false': case 'empty': case 'unit': case 'star':
        return 1;
      case 'suc': return 1 + countOpen(t.n);
      case 'pi': case 'sigma': return 1 + countOpen(t.dom) + countOpen(t.cod);
      case 'lam': return 1 + (t.ty ? countOpen(t.ty) : 0) + countOpen(t.body);
      case 'app': return 1 + countOpen(t.f) + countOpen(t.a);
      case 'pair': return 1 + countOpen(t.a) + countOpen(t.b);
      case 'fst': case 'snd': return 1 + countOpen(t.p);
      case 'id': return 1 + countOpen(t.ty) + countOpen(t.l) + countOpen(t.r);
      case 'natrec': return 1 + countOpen(t.n) + countOpen(t.mot) + countOpen(t.z) + countOpen(t.step);
      case 'unitrec': return 1 + countOpen(t.u) + countOpen(t.mot) + countOpen(t.base);
      case 'sigind': return 1 + countOpen(t.p) + countOpen(t.mot) + countOpen(t.step);
      case 'absurd': return 1 + countOpen(t.e);
      case 'J': return 1 + countOpen(t.a) + countOpen(t.mot) + countOpen(t.d) + countOpen(t.b) + countOpen(t.p);
      default: return 1;
    }
  }

  const levels = raw.map((lv) => {
    const env = [];
    const givens = (lv.givensRaw || []).map((g) => {
      let ty;
      if (g.ty.nt === 'refTy') {
        ty = ADD_TY; // fixed type of the lemma (closed term)
      } else {
        ty = close(g.ty, env);
      }
      env.push(g.name);
      return { name: g.name, ty };
    });
    const bindersRaw = lv.answerBindersRaw || (lv.answerBinderRaw ? [lv.answerBinderRaw] : []);
    const answerBinders = bindersRaw.map((b) => {
      const entry = { name: b.name, ty: close(b.ty, env) };
      env.push(b.name);
      return entry;
    });
    return Object.assign({}, lv, {
      givens,
      answerBinders,
      answerBinder: answerBinders[0] || null,
      inferTerm: lv.inferTermRaw ? close(lv.inferTermRaw, env) : null,
      goal: close(lv.goalRaw, env),
      solution: close(lv.solutionRaw, env),
      par: countOpen(lv.solutionRaw)
    });
  });

  return { levels, ADD_TY, ADD_BODY, nat, close };
});
