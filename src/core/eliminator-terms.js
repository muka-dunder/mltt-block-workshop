/* Present primitive eliminations using checked function symbols and ordinary application. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateEliminatorTerms = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (R, C, eliminator) {
  'use strict';
  const primitive = new Set(['natrec', 'unitrec', 'sigind', 'J']);
  function contains(term) {
    if (!term || typeof term !== 'object' || term.t === 'symbol') return false;
    return primitive.has(term.t) || Object.values(term).some(value => value?.t && contains(value));
  }
  function functionForm(ctx, term, expected) {
    if (!contains(term)) return term;
    const env = R.envOf(ctx), level = ctx.length;
    const value = expression => R.evalTm(env, expression);
    const visit = (expression, type) => functionForm(ctx, expression, type);
    const under = (name, dom, body, type) => functionForm(ctx.concat([{ name, ty: dom }]), body, type);
    const fresh = R.vNe({ h: 'var', lvl: level }, []);
    let name, args, levels = [0, 0];
    if (term.t === 'natrec') { name = 'ind_nat'; args = [term.n, term.mot, term.z, term.s]; }
    if (term.t === 'unitrec') { name = 'ind_unit'; args = [term.u, term.mot, term.base]; }
    if (term.t === 'sigind') {
      const type = C.infer(ctx, term.p);
      if (type.t !== 'Sigma') R.fail('E_NOT_PAIR', 'Expected a Sigma value', term, null, 'sigmaIndNotPair', { type: type.t });
      const dom = R.quote(level, type.dom), cod = R.quote(level + 1, type.cod(fresh));
      levels = [C.sortOf(ctx, dom), C.sortOf(ctx.concat([{ name: 'a', ty: type.dom }]), cod)];
      const family = cod.t === 'app' && cod.a.t === 'var' && cod.a.i === 0 && cod.f.t === 'var' && cod.f.i > 0
        ? R.Var(cod.f.i - 1) : R.Lam('a', cod);
      name = 'ind_sigma'; args = [dom, family, term.p, term.mot, term.step];
    }
    if (term.t === 'J') {
      const type = R.quote(level, C.infer(ctx, term.a));
      levels = [C.sortOf(ctx, type), 0];
      name = 'J'; args = [type, term.a, term.mot, term.d, term.b, term.p];
    }
    if (name) {
      let applied = eliminator(name, term.src, levels);
      for (const arg of args) {
        const type = C.infer(ctx, applied);
        applied = R.App(applied, visit(arg, type.dom), term.src);
      }
      return applied;
    }
    switch (term.t) {
      case 'annot': return R.Annot(visit(term.term, value(term.ty)), visit(term.ty), term.src);
      case 'lam': {
        const dom = expected?.t === 'Pi' ? expected.dom : term.ty && value(term.ty);
        if (!dom) R.fail('E_NEED_TYPE', 'A lambda needs its expected function type', term, null, 'lambdaNeedsType');
        return R.Lam(term.name, under(term.name, dom, term.body, expected?.t === 'Pi' ? expected.cod(fresh) : undefined),
          term.ty && visit(term.ty), term.src);
      }
      case 'pi': case 'sigma': {
        const dom = visit(term.dom), body = under(term.name, value(term.dom), term.cod);
        return term.t === 'pi' ? R.Pi(term.name, dom, body, term.src) : R.Sigma(term.name, dom, body, term.src);
      }
      case 'app': return R.App(visit(term.f), visit(term.a, C.infer(ctx, term.f).dom), term.src);
      case 'pair': {
        const type = expected?.t === 'Sigma' ? expected : C.infer(ctx, term);
        return R.Pair(visit(term.a, type.dom), visit(term.b, type.cod(value(term.a))), term.src);
      }
      case 'fst': return R.Fst(visit(term.p), term.src);
      case 'snd': return R.Snd(visit(term.p), term.src);
      case 'suc': return { ...term, n: visit(term.n, R.vNat) };
      case 'if': return R.If(visit(term.b, R.vBool), visit(term.x, expected), visit(term.y, expected), term.src);
      case 'absurd': return R.Absurd(visit(term.e, R.vEmpty), term.src);
      case 'id': return R.Id(visit(term.ty), visit(term.l, value(term.ty)), visit(term.r, value(term.ty)), term.src);
      default: return term;
    }
  }
  return { functionForm };
});
