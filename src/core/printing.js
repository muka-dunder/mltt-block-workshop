/* Formatting for core terms and semantic values. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreatePrinting = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime) {
  'use strict';

  const { quote } = runtime;

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
        return 'ind_nat ' + show(ctx, tm.n, 2) + ' [' + nm + '. ' + show(ctx.concat([{ name: nm }]), tm.mot.body) + '] ' +
          show(ctx, tm.z, 2) + ' [' + show(ctx, tm.s) + ']';
      }
      case 'if': return 'if ' + show(ctx, tm.b) + ' then ' + show(ctx, tm.x) + ' else ' + show(ctx, tm.y);
      case 'absurd': return 'absurd ' + show(ctx, tm.e, 2);
      case 'unitrec': return 'ind_unit ' + show(ctx, tm.u, 2) + ' ' + show(ctx, tm.mot, 2) + ' ' + show(ctx, tm.base, 2);
      case 'sigind': return 'ind_sigma ' + show(ctx, tm.p, 2) + ' ' + show(ctx, tm.mot, 2) + ' ' + show(ctx, tm.step, 2);
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


  return {
    show, showVal,
  };
});
