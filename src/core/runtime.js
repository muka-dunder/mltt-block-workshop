/* Core terms, semantic values, normalization by evaluation, and checker errors. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateRuntime = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------- Terms ----------------
  const Var = (i, src) => ({ t: 'var', i, src });
  const U = (l, src) => ({ t: 'U', l, src });
  const Pi = (name, dom, cod, src) => ({ t: 'pi', name, dom, cod, src });
  const Sigma = (name, dom, cod, src) => ({ t: 'sigma', name, dom, cod, src });
  const Lam = (name, body, ty, src) => ({ t: 'lam', name, body, ty: ty || null, src });
  const App = (f, a, src) => ({ t: 'app', f, a, src });
  const Pair = (a, b, src) => ({ t: 'pair', a, b, src });
  const Fst = (p, src) => ({ t: 'fst', p, src });
  const Snd = (p, src) => ({ t: 'snd', p, src });
  const Id = (ty, l, r, src) => ({ t: 'id', ty, l, r, src });
  const NatRec = (n, mot, z, s, src) => ({ t: 'natrec', n, mot, z, s, src });
  const UnitRec = (u, mot, base, src) => ({ t: 'unitrec', u, mot, base, src });
  const SigmaInd = (p, mot, step, src) => ({ t: 'sigind', p, mot, step, src });
  const If = (b, x, y, src) => ({ t: 'if', b, x, y, src });
  const Absurd = (e, src) => ({ t: 'absurd', e, src });
  const J = (a, mot, d, b, p, src) => ({ t: 'J', a, mot, d, b, p, src });
  const Annot = (term, ty, src) => ({ t: 'annot', term, ty, src });
  const Hole = (id, src) => ({ t: 'hole', id, src });
  const Ref = (name, src) => ({ t: 'ref', name, src });
  const Const = (name) => ({ t: 'const', name });

  const NAT = { t: 'nat' }, ZERO = { t: 'zero' }, SUC = (n) => ({ t: 'suc', n });
  const BOOL = { t: 'bool' }, TRUE = { t: 'true' }, FALSE = { t: 'false' };
  const EMPTY = { t: 'empty' }, UNIT = { t: 'unit' }, STAR = { t: 'star' };
  const REFL = { t: 'refl' };

  // ---------------- Definitions (transparent lemmas) ----------------
  let DEFS = new Map();
  const clearDefs = () => { DEFS = new Map(); };
  const define = (name, ty, body, declarationId) => { DEFS.set(name, { ty, body, declarationId }); };

  // ---------------- Values ----------------
  const vU = (l) => ({ t: 'U', l });
  const vPi = (name, dom, cod) => ({ t: 'Pi', name, dom, cod });
  const vSigma = (name, dom, cod) => ({ t: 'Sigma', name, dom, cod });
  const vLam = (name, ty, body) => ({ t: 'Lam', name, ty, body });
  const vPair = (a, b) => ({ t: 'Pair', a, b });
  const vNat = { t: 'Nat' }, vZero = { t: 'Zero' };
  const vSuc = (n) => ({ t: 'Suc', n });
  const vBool = { t: 'Bool' }, vTrue = { t: 'True' }, vFalse = { t: 'False' };
  const vEmpty = { t: 'Empty' }, vUnit = { t: 'Unit' }, vStar = { t: 'Star' };
  const vId = (ty, l, r) => ({ t: 'Id', ty, l, r });
  const vRefl = { t: 'Refl' };
  const vNe = (head, spine) => ({ t: 'Ne', head, spine: spine || [] });

  function applyV(f, a) {
    if (f.t === 'Lam') return f.body(a);
    if (f.t === 'Ne') return vNe(f.head, f.spine.concat([{ k: 'app', v: a }]));
    throw new CheckError('E_INTERNAL', 'Attempted to apply a non-function', null, null, 'internalApply');
  }
  function fstV(p) {
    if (p.t === 'Pair') return p.a;
    if (p.t === 'Ne') return vNe(p.head, p.spine.concat([{ k: 'fst' }]));
    throw new CheckError('E_INTERNAL', 'fst applied to a non-pair', null, null, 'internalFst');
  }
  function sndV(p) {
    if (p.t === 'Pair') return p.b;
    if (p.t === 'Ne') return vNe(p.head, p.spine.concat([{ k: 'snd' }]));
    throw new CheckError('E_INTERNAL', 'snd applied to a non-pair', null, null, 'internalSnd');
  }

  // ---------------- Evaluation ----------------
  function envOf(ctx) {
    return ctx.map((_, i) => vNe({ h: 'var', lvl: i }, []));
  }

  function evalTm(env, tm) {
    switch (tm.t) {
      case 'symbol': return tm.value;
      case 'var': return env[env.length - 1 - tm.i];
      case 'const': return vNe({ h: 'const', name: tm.name }, []);
      case 'ref': {
        const d = DEFS.get(tm.name);
        if (!d) throw new CheckError('E_INTERNAL', 'Undefined lemma ' + tm.name, null, null, 'undefinedLemma', { name: tm.name });
        return evalTm([], d.body);
      }
      case 'U': return vU(tm.l);
      case 'pi': return vPi(tm.name, evalTm(env, tm.dom), (v) => evalTm(env.concat([v]), tm.cod));
      case 'sigma': return vSigma(tm.name, evalTm(env, tm.dom), (v) => evalTm(env.concat([v]), tm.cod));
      case 'lam': return vLam(tm.name, tm.ty ? evalTm(env, tm.ty) : null, (v) => evalTm(env.concat([v]), tm.body));
      case 'app': return applyV(evalTm(env, tm.f), evalTm(env, tm.a));
      case 'pair': return vPair(evalTm(env, tm.a), evalTm(env, tm.b));
      case 'fst': return fstV(evalTm(env, tm.p));
      case 'snd': return sndV(evalTm(env, tm.p));
      case 'nat': return vNat;
      case 'zero': return vZero;
      case 'suc': return vSuc(evalTm(env, tm.n));
      case 'bool': return vBool;
      case 'true': return vTrue;
      case 'false': return vFalse;
      case 'empty': return vEmpty;
      case 'unit': return vUnit;
      case 'star': return vStar;
      case 'id': return vId(evalTm(env, tm.ty), evalTm(env, tm.l), evalTm(env, tm.r));
      case 'refl': return vRefl;
      case 'if': {
        const b = evalTm(env, tm.b);
        if (b.t === 'True') return evalTm(env, tm.x);
        if (b.t === 'False') return evalTm(env, tm.y);
        return vNe(b.head, b.spine.concat([{ k: 'if', x: evalTm(env, tm.x), y: evalTm(env, tm.y) }]));
      }
      case 'absurd': {
        const e = evalTm(env, tm.e);
        return vNe(e.head, e.spine.concat([{ k: 'absurd' }]));
      }
      case 'natrec': {
        const mot = evalTm(env, tm.mot);
        const z = evalTm(env, tm.z);
        const s = evalTm(env, tm.s);
        const rec = (n) => {
          if (n.t === 'Zero') return z;
          if (n.t === 'Suc') return applyV(applyV(s, n.n), rec(n.n));
          return vNe(n.head, n.spine.concat([{ k: 'natrec', mot, z, s }]));
        };
        return rec(evalTm(env, tm.n));
      }
      case 'J': {
        const a = evalTm(env, tm.a), mot = evalTm(env, tm.mot), d = evalTm(env, tm.d);
        const b = evalTm(env, tm.b), p = evalTm(env, tm.p);
        if (p.t === 'Refl') return d;
        return vNe(p.head, p.spine.concat([{ k: 'J', a, mot, d, b }]));
      }
      case 'unitrec': {
        const u = evalTm(env, tm.u);
        const mot = evalTm(env, tm.mot);
        const base = evalTm(env, tm.base);
        if (u.t === 'Star') return base;
        return vNe(u.head, u.spine.concat([{ k: 'unitrec', mot, base }]));
      }
      case 'sigind': {
        const p = evalTm(env, tm.p);
        const mot = evalTm(env, tm.mot);
        const step = evalTm(env, tm.step);
        if (p.t === 'Pair') return applyV(applyV(step, p.a), p.b);
        return vNe(p.head, p.spine.concat([{ k: 'sigind', mot, step }]));
      }
      case 'annot': return evalTm(env, tm.term);
      case 'hole': throw new CheckError('E_HOLE', 'Hole has no content yet', tm, null, 'holeEmpty');
      default: throw new CheckError('E_INTERNAL', 'Unknown term ' + tm.t, null, null, 'unknownTerm', { term: tm.t });
    }
  }

  // ---------------- Quote (read back) ----------------
  function quote(lvl, v) {
    switch (v.t) {
      case 'U': return U(v.l);
      case 'Pi': {
        const x = vNe({ h: 'var', lvl }, []);
        return Pi(v.name, quote(lvl, v.dom), quote(lvl + 1, v.cod(x)));
      }
      case 'Sigma': {
        const x = vNe({ h: 'var', lvl }, []);
        return Sigma(v.name, quote(lvl, v.dom), quote(lvl + 1, v.cod(x)));
      }
      case 'Lam': {
        const x = vNe({ h: 'var', lvl }, []);
        return Lam(v.name, quote(lvl + 1, v.body(x)), v.ty ? quote(lvl, v.ty) : null);
      }
      case 'Pair': return Pair(quote(lvl, v.a), quote(lvl, v.b));
      case 'Nat': return NAT;
      case 'Zero': return ZERO;
      case 'Suc': return SUC(quote(lvl, v.n));
      case 'Bool': return BOOL;
      case 'True': return TRUE;
      case 'False': return FALSE;
      case 'Empty': return EMPTY;
      case 'Unit': return UNIT;
      case 'Star': return STAR;
      case 'Id': return Id(quote(lvl, v.ty), quote(lvl, v.l), quote(lvl, v.r));
      case 'Refl': return REFL;
      case 'Ne': {
        let tm = v.head.h === 'var'
          ? Var(lvl - 1 - v.head.lvl)
          : Ref(v.head.name);
        for (const sp of v.spine) tm = quoteSpine(lvl, tm, sp);
        return tm;
      }
      default: throw new CheckError('E_INTERNAL', 'Unknown value ' + v.t, null, null, 'unknownValue', { value: v.t });
    }
  }
  function quoteSpine(lvl, tm, sp) {
    switch (sp.k) {
      case 'app': return App(tm, quote(lvl, sp.v));
      case 'fst': return Fst(tm);
      case 'snd': return Snd(tm);
      case 'if': return If(tm, quote(lvl, sp.x), quote(lvl, sp.y));
      case 'absurd': return Absurd(tm);
      case 'natrec': return NatRec(tm, quote(lvl, sp.mot), quote(lvl, sp.z), quote(lvl, sp.s));
      case 'unitrec': return UnitRec(tm, quote(lvl, sp.mot), quote(lvl, sp.base));
      case 'sigind': return SigmaInd(tm, quote(lvl, sp.mot), quote(lvl, sp.step));
      case 'J': return J(quote(lvl, sp.a), quote(lvl, sp.mot), quote(lvl, sp.d), quote(lvl, sp.b), tm);
      default: throw new CheckError('E_INTERNAL', 'Unknown spine ' + sp.k, null, null, 'unknownSpine', { spine: sp.k });
    }
  }

  // ---------------- Conversion checking ----------------
  let freshCounter = 100000;
  const fresh = () => vNe({ h: 'var', lvl: freshCounter++ }, []);

  function conv(a, b) {
    if (a === b) return true;
    if (a.t !== b.t) {
      // eta: functions / pairs
      if (a.t === 'Lam' && b.t === 'Ne') { const x = fresh(); return conv(a.body(x), applyV(b, x)); }
      if (a.t === 'Ne' && b.t === 'Lam') { const x = fresh(); return conv(applyV(a, x), b.body(x)); }
      if (a.t === 'Pair' && b.t === 'Ne') return conv(a.a, fstV(b)) && conv(a.b, sndV(b));
      if (a.t === 'Ne' && b.t === 'Pair') return conv(fstV(a), b.a) && conv(sndV(a), b.b);
      return false;
    }
    switch (a.t) {
      case 'U': return a.l === b.l;
      case 'Pi':
      case 'Sigma': {
        const x = fresh();
        return conv(a.dom, b.dom) && conv(a.cod(x), b.cod(x));
      }
      case 'Lam': {
        const x = fresh();
        return conv(a.body(x), b.body(x));
      }
      case 'Pair': return conv(a.a, b.a) && conv(a.b, b.b);
      case 'Nat': case 'Zero': case 'Bool': case 'True': case 'False':
      case 'Empty': case 'Unit': case 'Star': case 'Refl': return true;
      case 'Suc': return conv(a.n, b.n);
      case 'Id': return conv(a.ty, b.ty) && conv(a.l, b.l) && conv(a.r, b.r);
      case 'Ne': {
        if (a.head.h !== b.head.h) return false;
        if (a.head.h === 'var' ? a.head.lvl !== b.head.lvl : a.head.name !== b.head.name) return false;
        if (a.spine.length !== b.spine.length) return false;
        for (let i = 0; i < a.spine.length; i++) if (!convSpine(a.spine[i], b.spine[i])) return false;
        return true;
      }
      default: return false;
    }
  }
  function convSpine(x, y) {
    if (x.k !== y.k) return false;
    switch (x.k) {
      case 'app': return conv(x.v, y.v);
      case 'fst': case 'snd': case 'absurd': return true;
      case 'if': return conv(x.x, y.x) && conv(x.y, y.y);
      case 'natrec': return conv(x.mot, y.mot) && conv(x.z, y.z) && conv(x.s, y.s);
      case 'unitrec': return conv(x.mot, y.mot) && conv(x.base, y.base);
      case 'sigind': return conv(x.mot, y.mot) && conv(x.step, y.step);
      case 'J': return conv(x.a, y.a) && conv(x.mot, y.mot) && conv(x.d, y.d) && conv(x.b, y.b);
      default: return false;
    }
  }

  // ---------------- Errors ----------------
  class CheckError extends Error {
    constructor(code, message, tm, extra, messageKey, messageParams) {
      super(message);
      this.name = 'CheckError';
      this.code = code;
      this.src = (tm && tm.src) || (extra && extra.src) || null;
      this.extra = extra || {};
      this.messageKey = messageKey || null;
      this.messageParams = messageParams || {};
    }
  }

  function fail(code, message, tm, extra, messageKey, messageParams) {
    throw new CheckError(code, message, tm, extra, messageKey, messageParams);
  }


  return {
    Var, U, Pi, Sigma, Lam, App, Pair, Fst, Snd, Id, NatRec, If, Absurd, J, Annot, Hole, Ref, Const, UnitRec, SigmaInd,
    NAT, ZERO, SUC, BOOL, TRUE, FALSE, EMPTY, UNIT, STAR, REFL,
    vU, vPi, vSigma, vLam, vPair, vNat, vZero, vSuc, vBool, vTrue, vFalse, vEmpty, vUnit, vStar, vId, vRefl, vNe,
    applyV, fstV, sndV, evalTm, envOf, quote, conv, CheckError, fail,
    define, clearDefs,
    get DEFS() { return DEFS; },
  };
});
