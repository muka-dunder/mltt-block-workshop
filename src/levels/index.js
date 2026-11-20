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

  const syntax = { v, Uo, pi, sigma, lam, app, pair, fst, snd, id, natrec, Jop, unitrec, sigind, absurd, ref, NATo, REFLo, ZEROo, EMPTYo, UNITo, STARo, nat, not };
  const foundations = typeof window === 'undefined' && typeof module === 'object' && module.exports
    ? require('./foundations.js') : globalThis.MLTTLevelFoundations;
  const advanced = typeof window === 'undefined' && typeof module === 'object' && module.exports
    ? require('./advanced.js') : globalThis.MLTTLevelAdvanced;
  const proofs = typeof window === 'undefined' && typeof module === 'object' && module.exports
    ? require('./proofs.js') : globalThis.MLTTLevelProofs;
  const raw = [...foundations(syntax), ...advanced(syntax), ...proofs(syntax)];

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
      par: countOpen(lv.solutionRaw) + (lv.parExtra || 0)
    });
  });

  return { levels, ADD_TY, ADD_BODY, nat, close };
});
