/* Bidirectional term checking and level goals. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateChecking = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime, printing) {
  'use strict';

  const { vU, vPi, vSigma, vPair, vNat, vZero, vSuc, vBool, vEmpty, vUnit, vStar, vId, vRefl, vNe,
    applyV, fstV, evalTm, envOf, conv, CheckError, fail } = runtime;
  const { showVal } = printing;

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
        const d = runtime.DEFS.get(tm.name);
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
        if (tp.t !== 'Sigma') fail('E_NOT_PAIR', 'ind_sigma needs a Sigma value, but got: ' + showVal(ctx, tp), tm, null, 'sigmaIndNotPair', { type: showVal(ctx, tp) });
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


  return {
    infer, check, sortOf, buildCtx, checkLevel,
  };
});
