/* MLTT core: de Bruijn terms, NbE, bidirectional checking.
 * Independent of Blockly; shared by Node and the browser.
 * Convention: terms (tm) use lowercase tags, values (v) use uppercase tags.
 */
(function (global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  global.MLTT = api;
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
  const define = (name, ty, body) => { DEFS.set(name, { ty, body }); };

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

  // ---------------- Type checking ----------------
  function infer(ctx, tm) {
    switch (tm.t) {
      case 'symbol': return tm.tyValue;
      case 'var': {
        const k = ctx.length - 1 - tm.i;
        if (k < 0 || k >= ctx.length) fail('E_FREE', 'Free variable out of bounds (scope resolution error)', tm, null, 'freeVariable');
        return ctx[k].ty;
      }
      case 'ref': {
        const d = DEFS.get(tm.name);
        if (!d) fail('E_INTERNAL', 'Undefined lemma ' + tm.name, tm, null, 'undefinedLemma', { name: tm.name });
        return evalTm([], d.ty);
      }
      case 'const': return evalTm([], tm.ty || vNe({ h: 'const', name: tm.name }));
      case 'U': return vU(tm.l + 1);
      case 'pi': {
        const l1 = sortOf(ctx, tm.dom);
        const domV = evalTm(envOf(ctx), tm.dom);
        const l2 = sortOf(ctx.concat([{ name: tm.name, ty: domV }]), tm.cod);
        return vU(Math.max(l1, l2));
      }
      case 'sigma': {
        const l1 = sortOf(ctx, tm.dom);
        const domV = evalTm(envOf(ctx), tm.dom);
        const l2 = sortOf(ctx.concat([{ name: tm.name, ty: domV }]), tm.cod);
        return vU(Math.max(l1, l2));
      }
      case 'id': {
        const l = sortOf(ctx, tm.ty);
        const tyV = evalTm(envOf(ctx), tm.ty);
        check(ctx, tm.l, tyV, []);
        check(ctx, tm.r, tyV, []);
        return vU(l);
      }
      case 'annot': {
        sortOf(ctx, tm.ty);
        const tyV = evalTm(envOf(ctx), tm.ty);
        check(ctx, tm.term, tyV, []);
        return tyV;
      }
      case 'app': {
        const tf = infer(ctx, tm.f);
        if (tf.t !== 'Pi') fail('E_NOT_FUN', 'Not a function, cannot apply: ' + showVal(ctx, tf), tm, null, 'notFunction', { type: showVal(ctx, tf) });
        check(ctx, tm.a, tf.dom, []);
        return tf.cod(evalTm(envOf(ctx), tm.a));
      }
      case 'fst': {
        const tp = infer(ctx, tm.p);
        if (tp.t !== 'Sigma') fail('E_NOT_PAIR', 'fst needs a pair, but got: ' + showVal(ctx, tp), tm, null, 'fstNotPair', { type: showVal(ctx, tp) });
        return tp.dom;
      }
      case 'snd': {
        const tp = infer(ctx, tm.p);
        if (tp.t !== 'Sigma') fail('E_NOT_PAIR', 'snd needs a pair, but got: ' + showVal(ctx, tp), tm, null, 'sndNotPair', { type: showVal(ctx, tp) });
        return tp.cod(fstV(evalTm(envOf(ctx), tm.p)));
      }
      case 'nat': return vU(0);
      case 'bool': return vU(0);
      case 'empty': return vU(0);
      case 'unit': return vU(0);
      case 'zero': return vNat;
      case 'suc': check(ctx, tm.n, vNat, []); return vNat;
      case 'true': return vBool;
      case 'false': return vBool;
      case 'star': return vUnit;
      case 'refl': fail('E_NEED_TYPE', 'refl needs to know which equality it proves (put it in a goal or add an annotation)', tm, null, 'reflNeedsType');
      case 'lam': fail('E_NEED_TYPE', 'λ needs an expected type to be checked (put it in a typed position)', tm, null, 'lambdaNeedsType');
      case 'pair': {
        const ta = infer(ctx, tm.a), tb = infer(ctx, tm.b);
        return vSigma('_', ta, () => tb);
      }
      case 'if': fail('E_NEED_TYPE', 'if needs an expected type to check both branches', tm, null, 'ifNeedsType');
      case 'absurd': fail('E_NEED_TYPE', 'absurd needs an expected type', tm, null, 'absurdNeedsType');
      case 'hole': fail('E_HOLE', 'Hole needs an expected type', tm, null, 'holeNeedsType');
      case 'natrec': {
        check(ctx, tm.n, vNat, []);
        check(ctx, tm.mot, vPi('_', vNat, () => vU(0)), []);
        const motV = evalTm(envOf(ctx), tm.mot);
        check(ctx, tm.z, applyV(motV, vZero), []);
        const stepTy = vPi('k', vNat, (k) => vPi('ih', applyV(motV, k), () => applyV(motV, vSuc(k))));
        check(ctx, tm.s, stepTy, []);
        return applyV(motV, evalTm(envOf(ctx), tm.n));
      }
      case 'J': {
        const A = infer(ctx, tm.a);
        const aV = evalTm(envOf(ctx), tm.a);
        check(ctx, tm.b, A, []);
        const bV = evalTm(envOf(ctx), tm.b);
        const motTy = vPi('y', A, (y) => vPi('q', vId(A, aV, y), () => vU(0)));
        check(ctx, tm.mot, motTy, []);
        const motV = evalTm(envOf(ctx), tm.mot);
        check(ctx, tm.d, applyV(applyV(motV, aV), vRefl), []);
        check(ctx, tm.p, vId(A, aV, bV), []);
        return applyV(applyV(motV, bV), evalTm(envOf(ctx), tm.p));
      }
      case 'unitrec': {
        check(ctx, tm.u, vUnit, []);
        const uV = evalTm(envOf(ctx), tm.u);
        check(ctx, tm.mot, vPi('_', vUnit, () => vU(0)), []);
        const motV = evalTm(envOf(ctx), tm.mot);
        check(ctx, tm.base, applyV(motV, vStar), []);
        return applyV(motV, uV);
      }
      case 'sigind': {
        const tp = infer(ctx, tm.p);
        if (tp.t !== 'Sigma') fail('E_NOT_PAIR', 'sigma_ind needs a Sigma value, but got: ' + showVal(ctx, tp), tm, null, 'sigmaIndNotPair', { type: showVal(ctx, tp) });
        const pV = evalTm(envOf(ctx), tm.p);
        check(ctx, tm.mot, vPi('p', tp, () => vU(0)), []);
        const motV = evalTm(envOf(ctx), tm.mot);
        const stepTy = vPi('a', tp.dom, (a) =>
          vPi('b', tp.cod(a), (b) => applyV(motV, vPair(a, b))));
        check(ctx, tm.step, stepTy, []);
        return applyV(motV, pV);
      }
      default: fail('E_INTERNAL', 'Unknown term ' + tm.t, tm, null, 'unknownTerm', { term: tm.t });
    }
  }

  function sortOf(ctx, tm) {
    const t = infer(ctx, tm);
    if (t.t !== 'U') fail('E_SORT', 'Cannot tell whether this is a type: ' + showVal(ctx, t), tm, null, 'notType', { type: showVal(ctx, t) });
    return t.l;
  }

  function check(ctx, tm, ty, goals) {
    goals = goals || [];
    switch (tm.t) {
      case 'lam': {
        if (ty.t !== 'Pi') {
          fail('E_MISMATCH', 'λ needs a function type, but the goal is: ' + showVal(ctx, ty), tm,
            { expected: showVal(ctx, ty), actual: 'λ' }, 'lambdaGoal', { type: showVal(ctx, ty) });
        }
        const x = vNe({ h: 'var', lvl: ctx.length }, []);
        if (tm.ty) {
          sortOf(ctx, tm.ty);
          const aV = evalTm(envOf(ctx), tm.ty);
          if (!conv(aV, ty.dom)) {
            fail('E_MISMATCH', 'λ parameter type is ' + showVal(ctx, aV) + ', but ' + showVal(ctx, ty.dom) + ' is required', tm, null, 'lambdaParameter', { actual: showVal(ctx, aV), expected: showVal(ctx, ty.dom) });
          }
        }
        check(ctx.concat([{ name: tm.name, ty: ty.dom }]), tm.body, ty.cod(x), goals);
        return;
      }
      case 'pair': {
        if (ty.t !== 'Sigma') {
          fail('E_MISMATCH', 'A pair needs a Σ type, but the goal is: ' + showVal(ctx, ty), tm, null, 'pairGoal', { type: showVal(ctx, ty) });
        }
        check(ctx, tm.a, ty.dom, goals);
        check(ctx, tm.b, ty.cod(evalTm(envOf(ctx), tm.a)), goals);
        return;
      }
      case 'refl': {
        if (ty.t !== 'Id') {
          fail('E_MISMATCH', 'refl can only prove an equality, but the goal is: ' + showVal(ctx, ty), tm, null, 'reflGoal', { type: showVal(ctx, ty) });
        }
        if (!conv(ty.l, ty.r)) {
          fail('E_REFL', 'refl can only prove definitional equality; the left side is ' + showVal(ctx, ty.l) +
            ' and the right side is ' + showVal(ctx, ty.r), tm, null, 'reflSides', { left: showVal(ctx, ty.l), right: showVal(ctx, ty.r) });
        }
        return;
      }
      case 'hole': {
        goals.push({ ty, ctx: ctx.map((c) => c.name), src: tm.src, id: tm.id });
        return;
      }
      case 'if': {
        check(ctx, tm.b, vBool, goals);
        check(ctx, tm.x, ty, goals);
        check(ctx, tm.y, ty, goals);
        return;
      }
      case 'absurd': {
        check(ctx, tm.e, vEmpty, goals);
        return;
      }
      case 'annot': {
        sortOf(ctx, tm.ty);
        const aV = evalTm(envOf(ctx), tm.ty);
        check(ctx, tm.term, aV, goals);
        if (!conv(aV, ty)) {
          fail('E_MISMATCH', 'Annotation type is ' + showVal(ctx, aV) + ', but ' + showVal(ctx, ty) + ' is required', tm, null, 'annotationType', { actual: showVal(ctx, aV), expected: showVal(ctx, ty) });
        }
        return;
      }
      default: {
        const s = infer(ctx, tm);
        if (!conv(s, ty)) {
          fail('E_MISMATCH', 'Expected ' + showVal(ctx, ty) + ' here, but got ' + showVal(ctx, s), tm,
            { expected: showVal(ctx, ty), actual: showVal(ctx, s) }, 'typeMismatch', { expected: showVal(ctx, ty), actual: showVal(ctx, s) });
        }
      }
    }
  }

  // ---------------- Pretty printing ----------------
  const PREC = { atom: 0, app: 1, arrow: 2, lam: 3 };

  function names(ctx) { return ctx.map((c) => c.name); }

  function precOf(tm) {
    switch (tm.t) {
      case 'app': case 'lam': return 1;
      case 'pi': case 'sigma': return 2;
      default: return 0;
    }
  }
  function show(ctx, tm, min) {
    const s = showRaw(ctx, tm);
    return (min && precOf(tm) > 0 && precOf(tm) < min) ? '(' + s + ')' : s;
  }

  function showRaw(ctx, tm) {
    switch (tm.t) {
      case 'var': {
        const k = ctx.length - 1 - tm.i;
        return (k >= 0 && ctx[k] && ctx[k].name) ? ctx[k].name : ('x' + tm.i);
      }
      case 'ref': return tm.name;
      case 'const': return tm.name;
      case 'symbol': return tm.name;
      case 'U': return tm.l === 0 ? 'Type' : 'Type ' + tm.l;
      case 'nat': return 'ℕ';
      case 'bool': return 'Bool';
      case 'empty': return '0';
      case 'unit': return '1';
      case 'zero': return '0';
      case 'suc': {
        const lit = natLit(tm);
        if (lit !== null) return String(lit);
        return 'suc ' + show(ctx, tm.n, 2);
      }
      case 'true': return 'true';
      case 'false': return 'false';
      case 'star': return '★';
      case 'refl': return 'refl';
      case 'pi': {
        if (tm.cod.t === 'empty') {
          const d = tm.dom;
          const needParen = (d.t === 'pi' && d.cod.t !== 'empty') || d.t === 'app' || d.t === 'lam';
          return '¬' + (needParen ? '(' + show(ctx, d) + ')' : show(ctx, d));
        }
        if (!usesVar0(tm.cod)) {
          const d = tm.dom;
          const isNeg = d.t === 'pi' && d.cod.t === 'empty';
          // Arrow is sugar, but cod still lives under the inner binder, so add a name layer when printing.
          return show(ctx, d, isNeg ? 2 : 3) + ' → ' +
            show(ctx.concat([{ name: tm.name || '_' }]), tm.cod, 2);
        }
        const nm = tm.name || 'x';
        return 'Π ' + nm + ' : ' + show(ctx, tm.dom, 3) + '. ' + show(ctx.concat([{ name: nm }]), tm.cod);
      }
      case 'sigma': {
        if (!usesVar0(tm.cod)) {
          return show(ctx, tm.dom, 3) + ' × ' +
            show(ctx.concat([{ name: tm.name || '_' }]), tm.cod, 2);
        }
        const nm = tm.name || 'x';
        return 'Σ ' + nm + ' : ' + show(ctx, tm.dom, 3) + '. ' + show(ctx.concat([{ name: nm }]), tm.cod);
      }
      case 'lam': {
        const nm = tm.name || 'x';
        const ann = tm.ty ? ' : ' + show(ctx, tm.ty) : '';
        return 'λ' + nm + ann + '. ' + show(ctx.concat([{ name: nm }]), tm.body);
      }
      case 'app': return show(ctx, tm.f, 1) + ' ' + show(ctx, tm.a, 2);
      case 'pair': return '⟨' + show(ctx, tm.a) + ', ' + show(ctx, tm.b) + '⟩';
      case 'fst': return 'fst ' + show(ctx, tm.p, 2);
      case 'snd': return 'snd ' + show(ctx, tm.p, 2);
      case 'id': return 'Id ' + show(ctx, tm.ty, 3) + ' ' + show(ctx, tm.l, 2) + ' ' + show(ctx, tm.r, 2);
      case 'natrec': {
        const nm = tm.mot.name || 'm';
        return 'natrec ' + show(ctx, tm.n, 2) + ' [' + nm + '. ' + show(ctx.concat([{ name: nm }]), tm.mot.body) + '] ' +
          show(ctx, tm.z, 2) + ' [' + show(ctx, tm.s) + ']';
      }
      case 'if': return 'if ' + show(ctx, tm.b) + ' then ' + show(ctx, tm.x) + ' else ' + show(ctx, tm.y);
      case 'absurd': return 'absurd ' + show(ctx, tm.e, 2);
      case 'unitrec': return 'unitrec ' + show(ctx, tm.u, 2) + ' ' + show(ctx, tm.mot, 2) + ' ' + show(ctx, tm.base, 2);
      case 'sigind': return 'sigma_ind ' + show(ctx, tm.p, 2) + ' ' + show(ctx, tm.mot, 2) + ' ' + show(ctx, tm.step, 2);
      case 'J': return 'J(' + show(ctx, tm.a) + '; ' + show(ctx, tm.mot) + '; ' + show(ctx, tm.d) + '; ' +
        show(ctx, tm.b) + '; ' + show(ctx, tm.p) + ')';
      case 'annot': return '(' + show(ctx, tm.term) + ' : ' + show(ctx, tm.ty) + ')';
      case 'hole': return '?';
      default: return '<?>';
    }
  }

  function natLit(tm) {
    let n = 0, t = tm;
    while (t && t.t === 'suc') { n++; t = t.n; }
    return t && t.t === 'zero' ? n : null;
  }

  // Check precisely whether de Bruijn index target is used (shift +1 through an inner binder).
  function usesFree(tm, target) {
    if (!tm || typeof tm !== 'object') return false;
    switch (tm.t) {
      case 'var': return tm.i === target;
      case 'pi': case 'sigma': return usesFree(tm.dom, target) || usesFree(tm.cod, target + 1);
      case 'lam': return (tm.ty ? usesFree(tm.ty, target) : false) || usesFree(tm.body, target + 1);
      case 'app': return usesFree(tm.f, target) || usesFree(tm.a, target);
      case 'pair': return usesFree(tm.a, target) || usesFree(tm.b, target);
      case 'fst': case 'snd': return usesFree(tm.p, target);
      case 'suc': return usesFree(tm.n, target);
      case 'id': return usesFree(tm.ty, target) || usesFree(tm.l, target) || usesFree(tm.r, target);
      case 'natrec': return usesFree(tm.n, target) || usesFree(tm.mot, target + 1) ||
        usesFree(tm.z, target) || usesFree(tm.s, target + 2);
      case 'unitrec': return usesFree(tm.u, target) || usesFree(tm.mot, target) || usesFree(tm.base, target);
      case 'sigind': return usesFree(tm.p, target) || usesFree(tm.mot, target + 1) || usesFree(tm.step, target + 2);
      case 'if': return usesFree(tm.b, target) || usesFree(tm.x, target) || usesFree(tm.y, target);
      case 'absurd': return usesFree(tm.e, target);
      case 'J': return usesFree(tm.a, target) || usesFree(tm.mot, target + 2) ||
        usesFree(tm.d, target) || usesFree(tm.b, target) || usesFree(tm.p, target);
      case 'annot': return usesFree(tm.term, target) || usesFree(tm.ty, target);
      default: return false;
    }
  }
  function usesVar0(tm) { return usesFree(tm, 0); }

  function showVal(ctx, v) { return show(ctx, quote(ctx.length, v)); }

  // ---------------- Levels ----------------
  function buildCtx(givens) {
    const ctx = [];
    for (const g of givens || []) {
      sortOf(ctx, g.ty);
      ctx.push({ name: g.name, ty: evalTm(envOf(ctx), g.ty) });
    }
    return ctx;
  }

  function checkInfer(ctx, level, tm) {
    try {
      // tm is the type submitted by the player; first make sure it is a type.
      sortOf(ctx, tm);
      const got = evalTm(envOf(ctx), tm);
      const want = infer(ctx, level.inferTerm);
      if (!conv(got, want)) {
        fail('E_MISMATCH', 'Inferred type is ' + showVal(ctx, want) + ', but you gave ' + showVal(ctx, got), tm,
          { expected: showVal(ctx, want), actual: showVal(ctx, got) }, 'inferredMismatch', { expected: showVal(ctx, want), actual: showVal(ctx, got) });
      }
      return { ok: true, ctx, inferred: want };
    } catch (e) {
      if (e instanceof CheckError) return { ok: false, error: e, ctx };
      throw e;
    }
  }

  function checkLevel(level, tm) {
    const ctx = buildCtx(level.givens);
    // Local variables supplied by the answer slot (possibly several, in declaration order).
    const binders = level.answerBinders || (level.answerBinder ? [level.answerBinder] : []);
    for (const b of binders) {
      sortOf(ctx, b.ty);
      ctx.push({ name: b.name, ty: evalTm(envOf(ctx), b.ty) });
    }
    if (level.inferTerm) return checkInfer(ctx, level, tm);
    let goalV;
    try {
      sortOf(ctx, level.goal);
      goalV = evalTm(envOf(ctx), level.goal);
    } catch (e) {
      return { ok: false, error: e, ctx, internal: true };
    }
    const goals = [];
    try {
      check(ctx, tm, goalV, goals);
    } catch (e) {
      if (e instanceof CheckError) return { ok: false, error: e, ctx, goals };
      throw e;
    }
    if (goals.length) return { ok: false, holes: goals, ctx, goals };
    return { ok: true, ctx, goalV };
  }

  // ---------------- Block JSON -> core terms ----------------
  // j = {type, id, fields:{}, binds:{input:[uid]}, names:{uid:name}, inputs:{input:j}}
  function elabBlock(j, scope, opts) {
    scope = scope || [];
    opts = opts || {};
    if (!j) fail('E_EMPTY', 'No block here yet', null, null, 'noBlock');
    const src = j.id;
    const inp = (n) => j.inputs && j.inputs[n] ? j.inputs[n] : null;
    const el = (n, sc) => {
      const c = inp(n);
      if (!c) fail('E_EMPTY', 'A slot is still empty', { src }, null, 'emptySlot');
      return elabBlock(c, sc || scope, opts);
    };
    const binds = j.binds || {};
    const nameOf = (uid) => (j.names && j.names[uid]) || 'x';
    const push = (uid) => scope.concat([{ uid, name: nameOf(uid) }]);

    switch (j.type) {
      case 'tt_symbol': {
        const id = j.fields && j.fields.REF;
        const symbol = opts.symbols && opts.symbols.get(id);
        if (!symbol) fail('E_SCOPE', 'Unknown declaration: ' + (id || '?'), { src }, null, 'declarationMissing', { id: id || '?' });
        return { t: 'symbol', name: symbol.name, value: symbol.value, tyValue: symbol.tyValue, src };
      }
      case 'tt_var': {
        const raw = (j.fields && j.fields.REF) || '';
        const bar = raw.indexOf('\u241F');
        const ref = bar < 0 ? raw : raw.slice(0, bar);
        const nm = bar < 0 ? ((j.fields && j.fields.NAME) || '') : raw.slice(bar + 1);
        let pos = -1;
        for (let i = scope.length - 1; i >= 0; i--) if (scope[i].uid === ref) { pos = i; break; }
        if (pos < 0) for (let i = scope.length - 1; i >= 0; i--) if (scope[i].name === nm) { pos = i; break; }
        if (pos < 0) fail('E_SCOPE', 'Variable "' + (nm || '?') + '" is not in scope', { src }, null, 'variableScope', { name: nm || '?' });
        return Var(scope.length - 1 - pos, src);
      }
      case 'tt_U': return U(parseInt((j.fields && j.fields.LEVEL) || '0', 10), src);
      case 'tt_given': {
        const idx = parseInt((j.fields && j.fields.IDX) || '-1', 10);
        const n = opts.nGivens || 0;
        if (!(idx >= 0 && idx < n)) fail('E_SCOPE', 'This given is not in the current level context', { src }, null, 'givenScope');
        return Var(scope.length + (n - 1 - idx), src);
      }
      case 'tt_nat': return Object.assign({}, NAT, { src });
      case 'tt_bool': return Object.assign({}, BOOL, { src });
      case 'tt_empty': return Object.assign({}, EMPTY, { src });
      case 'tt_unit': return Object.assign({}, UNIT, { src });
      case 'tt_zero': return Object.assign({}, ZERO, { src });
      case 'tt_true': return Object.assign({}, TRUE, { src });
      case 'tt_false': return Object.assign({}, FALSE, { src });
      case 'tt_star': return Object.assign({}, STAR, { src });
      case 'tt_refl': return Object.assign({}, REFL, { src });
      case 'tt_hole': return Hole(j.id, src);
      case 'tt_lemma': return Ref((j.fields && j.fields.NAME) || '', src);
      case 'tt_answer':
      case 'tt_goal': {
        // The answer slot declares its own local variable (LBM); TERM is in its scope.
        if (!inp('TERM')) fail('E_EMPTY', 'The "answer" slot is still empty', { src }, null, 'emptyAnswer');
        let sc = scope;
        if (opts.answerBinder) {
          for (const uid of (binds.TERM || [])) sc = sc.concat([{ uid, name: nameOf(uid) }]);
        }
        return elabBlock(inp('TERM'), sc, opts);
      }
      case 'tt_annot': return Annot(el('TERM'), el('TYPE'), src);
      case 'tt_suc': return Object.assign(SUC(el('N')), { src });
      case 'tt_fst': return Fst(el('P'), src);
      case 'tt_snd': return Snd(el('P'), src);
      case 'tt_app': return App(el('F'), el('A'), src);
      case 'tt_pair': return Pair(el('A'), el('B'), src);
      case 'tt_if': return If(el('B'), el('X'), el('Y'), src);
      case 'tt_absurd': return Absurd(el('E'), src);
      case 'tt_unitrec': return UnitRec(el('U'), el('MOT'), el('BASE'), src);
      case 'tt_sigma_ind': {
        const pUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const aUid = binds.STEP_BODY && binds.STEP_BODY[0];
        const bUid = binds.STEP_BODY && binds.STEP_BODY[1];
        const mot = Lam(nameOf(pUid), el('MOT_BODY', push(pUid)), null, src);
        const stepScope = scope.concat([
          { uid: aUid, name: nameOf(aUid) },
          { uid: bUid, name: nameOf(bUid) }
        ]);
        const step = Lam(nameOf(aUid), Lam(nameOf(bUid), el('STEP_BODY', stepScope), null, src), null, src);
        return SigmaInd(el('P'), mot, step, src);
      }
      case 'tt_pi': {
        const uid = binds.BODY && binds.BODY[0];
        return Pi(nameOf(uid), el('DOM'), el('BODY', push(uid)), src);
      }
      case 'tt_sigma': {
        const uid = binds.BODY && binds.BODY[0];
        return Sigma(nameOf(uid), el('DOM'), el('BODY', push(uid)), src);
      }
      case 'tt_lam': {
        const uid = binds.BODY && binds.BODY[0];
        return Lam(nameOf(uid), el('BODY', push(uid)), inp('TY') ? el('TY') : null, src);
      }
      case 'tt_id': return Id(el('TY'), el('L'), el('R'), src);
      case 'tt_let': {
        const uid = binds.BODY && binds.BODY[0];
        const ty = inp('TY') ? el('TY') : null;
        return App(Lam(nameOf(uid), el('BODY', push(uid)), ty, src), el('VALUE'), src);
      }
      case 'tt_natrec': {
        const mUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const kUid = binds.STEP_BODY && binds.STEP_BODY[0];
        const iUid = binds.STEP_BODY && binds.STEP_BODY[1];
        const mot = Lam(nameOf(mUid), el('MOT_BODY', push(mUid)), null, src);
        const stepScope = scope.concat([
          { uid: kUid, name: nameOf(kUid) },
          { uid: iUid, name: nameOf(iUid) }
        ]);
        const step = Lam(nameOf(kUid), Lam(nameOf(iUid), el('STEP_BODY', stepScope), null, src), null, src);
        return NatRec(el('N'), mot, el('Z'), step, src);
      }
      case 'tt_J': {
        const yUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const qUid = binds.MOT_BODY && binds.MOT_BODY[1];
        const motScope = scope.concat([
          { uid: yUid, name: nameOf(yUid) },
          { uid: qUid, name: nameOf(qUid) }
        ]);
        const mot = Lam(nameOf(yUid), Lam(nameOf(qUid), el('MOT_BODY', motScope), null, src), null, src);
        return J(el('BASE'), mot, el('D'), el('B'), el('P'), src);
      }
      default: fail('E_INTERNAL', 'Unknown block type ' + j.type, { src }, null, 'unknownBlock', { type: j.type });
    }
  }

  // Wrap a block tree as an entry point that checks the goal in an empty context.
  function hasBlockType(j, type) {
    if (!j) return false;
    if (j.type === type) return true;
    const inputs = j.inputs || {};
    for (const key of Object.keys(inputs)) {
      if (hasBlockType(inputs[key], type)) return true;
    }
    return false;
  }

  function checkBlocks(level, blockJson) {
    let tm;
    try {
      const hasAnswerBinder = !!(level.answerBinders && level.answerBinders.length) || !!level.answerBinder;
      tm = elabBlock(blockJson, [], { nGivens: level.givens.length, answerBinder: hasAnswerBinder });
    } catch (e) {
      if (e instanceof CheckError) return { ok: false, error: e, phase: 'elab' };
      throw e;
    }
    const r = checkLevel(level, tm);
    r.term = tm;
    if (r.ok && level.requireBlock && !hasBlockType(blockJson, level.requireBlock)) {
      r.ok = false;
      r.error = new CheckError('E_REQUIRE', 'This level requires the ' +
        (level.requireBlockName || level.requireBlock) + ' block', null, null, 'requiredBlock',
        { name: level.requireBlockName || level.requireBlock });
      r.requireBlock = level.requireBlock;
    }
    return r;
  }

  // Workshop symbols hold checked semantic values. They are local to one check,
  // never enter DEFS, and can therefore safely depend on the level context.
  function checkWorkshop(level, blockJson, declarationBlocks, inspection) {
    declarationBlocks = declarationBlocks || [];
    const declarations = [], symbols = new Map(), dependencies = new Map();
    try {
      const ctx = buildCtx(level.givens);
      const binders = level.answerBinders || (level.answerBinder ? [level.answerBinder] : []);
      for (const b of binders) {
        sortOf(ctx, b.ty);
        ctx.push({ name: b.name, ty: evalTm(envOf(ctx), b.ty) });
      }
      const answerUids = blockJson && blockJson.binds && blockJson.binds.TERM || [];
      const answerScope = binders.map((b, i) => ({
        uid: answerUids[i],
        name: blockJson && blockJson.names && blockJson.names[answerUids[i]] || b.name,
      }));
      const opts = { nGivens: level.givens.length, symbols };
      const names = new Set(ctx.map(c => c.name));
      for (const entry of answerScope) names.add(entry.name);
      const byId = new Map();
      for (const d of declarationBlocks) {
        const name = String(d.fields && d.fields.NAME || '').trim();
        const kind = d.fields && d.fields.KIND;
        if (!name || /[\s:␟]/u.test(name)) fail('E_DECLARATION', 'Enter a symbol name without spaces or colons', { src: d.id }, null, 'declarationName');
        if (names.has(name) || DEFS.has(name)) fail('E_DECLARATION', 'Symbol name is already used: ' + name, { src: d.id }, null, 'declarationDuplicate', { name });
        if (!['assumption', 'axiom', 'definition'].includes(kind)) fail('E_DECLARATION', 'Unknown declaration kind', { src: d.id }, null, 'declarationKind');
        if (!d.id || byId.has(d.id)) fail('E_DECLARATION', 'Declaration needs a unique ID', { src: d.id }, null, 'declarationId');
        names.add(name);
        byId.set(d.id, d);
      }
      function references(j, result = new Set()) {
        if (!j) return result;
        if (j.type === 'tt_symbol') result.add(j.fields && j.fields.REF);
        for (const child of Object.values(j.inputs || {})) references(child, result);
        return result;
      }
      const visiting = new Set();
      function resolve(id) {
        if (symbols.has(id)) return;
        const d = byId.get(id);
        if (!d) fail('E_SCOPE', 'Declaration has been removed or is unavailable: ' + (id || '?'), { src: id }, null, 'declarationMissing', { id: id || '?' });
        if (visiting.has(id)) fail('E_DECLARATION', 'Circular declaration: ' + d.fields.NAME, { src: id }, null, 'declarationCircular', { name: d.fields.NAME });
        visiting.add(id);
        const kind = d.fields.KIND, name = d.fields.NAME.trim();
        const inputs = d.inputs || {};
        const refs = references(inputs.TYPE);
        if (kind === 'definition') references(inputs.VALUE, refs);
        for (const ref of refs) resolve(ref);
        dependencies.set(id, refs);
        const active = { type: 'tt_declare', inputs: { TYPE: inputs.TYPE } };
        if (kind === 'definition') active.inputs.VALUE = inputs.VALUE;
        if (hasBlockType(active, 'tt_hole')) fail('E_DECLARATION', 'Complete the declaration before using it', { src: id }, null, 'declarationIncomplete');
        const ty = elabBlock(inputs.TYPE, answerScope, opts);
        sortOf(ctx, ty);
        const tyValue = evalTm(envOf(ctx), ty);
        let value;
        if (kind === 'definition') {
          const term = elabBlock(inputs.VALUE, answerScope, opts);
          const goals = [];
          check(ctx, term, tyValue, goals);
          if (goals.length) fail('E_DECLARATION', 'Complete the definition before using it', { src: id }, null, 'declarationIncomplete');
          value = evalTm(envOf(ctx), term);
        } else value = vNe({ h: 'const', name }, []);
        symbols.set(id, { name, tyValue, value });
        declarations.push({ id, name, kind, typeText: showVal(ctx, tyValue) });
        visiting.delete(id);
      }
      for (const id of byId.keys()) resolve(id);
      const used = references(blockJson);
      function includeDependencies(id) {
        for (const ref of dependencies.get(id) || []) {
          if (!used.has(ref)) { used.add(ref); includeDependencies(ref); }
        }
      }
      for (const id of used) includeDependencies(id);
      const assumptions = declarations.filter(d => d.kind !== 'definition' && used.has(d.id));
      const tm = elabBlock(blockJson, [], { ...opts, answerBinder: !!binders.length });
      const result = checkLevel(level, tm);
      if (result.ok && level.requireBlock && !hasBlockType(blockJson, level.requireBlock)) {
        result.ok = false;
        result.error = new CheckError('E_REQUIRE', 'This level requires the ' + (level.requireBlockName || level.requireBlock) + ' block', null, null, 'requiredBlock', { name: level.requireBlockName || level.requireBlock });
      }
      const output = Object.assign(result, { term: tm, declarations, assumptions });
      if (inspection) {
        const declaration = declarations.find(d => d.id === inspection.id);
        if (declaration) output.selectedType = declaration.typeText;
        else {
          let selected = inspection.json, nestedScope = false;
          function find(j, nested = false) {
            if (!j) return;
            if (j.id === inspection.id) { selected = j; nestedScope = nested; }
            for (const [input, child] of Object.entries(j.inputs || {})) {
              find(child, nested || j.type !== 'tt_answer' && !!(j.binds && j.binds[input]?.length));
            }
          }
          find(blockJson);
          try {
            if (nestedScope) fail('E_SCOPE', 'Select the complete expression to check its local bindings', { src: inspection.id });
            if (result.ok && (selected === blockJson || selected && selected.id === (blockJson.inputs && blockJson.inputs.TERM && blockJson.inputs.TERM.id))) {
              output.selectedType = showVal(ctx, level.inferTerm ? infer(ctx, tm) : evalTm(envOf(ctx), level.goal));
            } else if (selected) {
              const selectedTm = selected === blockJson ? tm : elabBlock(selected, answerScope, opts);
              output.selectedType = showVal(ctx, infer(ctx, selectedTm));
            }
          } catch (e) { output.selectedError = e; }
        }
      }
      return output;
    } catch (error) {
      if (error instanceof CheckError) return { ok: false, error, declarations, assumptions: [], phase: 'declaration' };
      throw error;
    }
  }

  function inspectWorkshop(level, blockJson, declarations, selectedId, selectedJson) {
    if (blockJson && !blockJson.inputs?.TERM) {
      blockJson = { ...blockJson, inputs: { ...blockJson.inputs, TERM: { type: 'tt_hole', id: '__inspection_empty' } } };
    }
    return checkWorkshop(level, blockJson, declarations, { id: selectedId, json: selectedJson });
  }

  return {
    // terms
    Var, U, Pi, Sigma, Lam, App, Pair, Fst, Snd, Id, NatRec, If, Absurd, J, Annot, Hole, Ref, Const, UnitRec, SigmaInd,
    NAT, ZERO, SUC, BOOL, TRUE, FALSE, EMPTY, UNIT, STAR, REFL,
    // checking
    evalTm, quote, conv, infer, check, sortOf, buildCtx, checkLevel, elabBlock, checkBlocks, checkWorkshop, inspectWorkshop,
    envOf, define, clearDefs, DEFS,
    // printing
    show, showVal,
    // errors
    CheckError,
  };
});
