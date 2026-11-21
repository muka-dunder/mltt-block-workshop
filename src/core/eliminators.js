/* Closed, checked functions expose the existing eliminators through ordinary application. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateEliminators = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (R, checking) {
  'use strict';
  const constant = term => () => term;
  const v = name => scope => {
    const index = scope.lastIndexOf(name);
    if (index < 0) throw new Error('Unbound eliminator parameter: ' + name);
    return R.Var(scope.length - 1 - index);
  };
  const app = (f, ...args) => scope => args.reduce((term, arg) => R.App(term, arg(scope)), f(scope));
  const pi = (name, dom, cod) => scope => R.Pi(name, dom(scope), cod(scope.concat(name)));
  const sigma = (name, dom, cod) => scope => R.Sigma(name, dom(scope), cod(scope.concat(name)));
  const pair = (a, b) => scope => R.Pair(a(scope), b(scope));
  const equality = (A, a, b) => scope => R.Id(A(scope), a(scope), b(scope));
  const cache = new Map();
  function build(levelA, levelB) {
    const type = constant(R.U(0)), typeA = constant(R.U(levelA)), typeB = constant(R.U(levelB)), nat = constant(R.NAT), unit = constant(R.UNIT);
    const A = v('A'), B = v('B'), C = v('C'), p = v('p'), a = v('a'), b = v('b');
    const definitions = {};
    function define(name, parameters, result, body) {
      const scope = parameters.map(([parameter]) => parameter);
      const ty = parameters.reduceRight((cod, [parameter, dom]) => pi(parameter, dom, cod), result)([]);
      const term = scope.reduceRight((inner, parameter) => R.Lam(parameter, inner), body(scope));
      checking.sortOf([], ty);
      checking.check([], term, R.evalTm([], ty), []);
      definitions[name] = { name, parameters: scope, ty, body: term,
        value: R.evalTm([], term), tyValue: R.evalTm([], ty) };
    }
    define('ind_nat', [
      ['n', nat], ['C', pi('k', nat, type)], ['z', app(C, constant(R.ZERO))],
      ['step', pi('k', nat, pi('ih', app(C, v('k')), app(C, scope => R.SUC(v('k')(scope)))))],
    ], app(C, v('n')), scope => R.NatRec(v('n')(scope), C(scope), v('z')(scope), v('step')(scope)));
    define('ind_unit', [
      ['u', unit], ['C', pi('u', unit, type)], ['base', app(C, constant(R.STAR))],
    ], app(C, v('u')), scope => R.UnitRec(v('u')(scope), C(scope), v('base')(scope)));
    const pairType = sigma('a', A, app(B, a));
    define('ind_sigma', [
      ['A', typeA], ['B', pi('a', A, typeB)], ['p', pairType], ['C', pi('p', pairType, type)],
      ['step', pi('a', A, pi('b', app(B, a), app(C, pair(a, b))))],
    ], app(C, p), scope => R.SigmaInd(p(scope), C(scope), v('step')(scope)));
    define('J', [
      ['A', typeA], ['a', A], ['C', pi('b', A, pi('q', equality(A, a, b), type))],
      ['d', app(C, a, constant(R.REFL))], ['b', A], ['p', equality(A, a, b)],
    ], app(C, b, p), scope => R.J(a(scope), C(scope), v('d')(scope), b(scope), p(scope)));
    return definitions;
  }
  function getDefinitions(levels = [0, 0]) {
    const [levelA = 0, levelB = 0] = levels;
    if (![levelA, levelB].every(level => Number.isSafeInteger(level) && level >= 0)) {
      R.fail('E_REQUIRE', 'Invalid eliminator universe level', null, null, 'unknownTerm', { term: 'universe level' });
    }
    const key = levelA + ':' + levelB;
    if (!cache.has(key)) cache.set(key, build(levelA, levelB));
    return cache.get(key);
  }
  function term(name, src, levels = [0, 0]) {
    const definitions = getDefinitions(levels);
    if (!Object.hasOwn(definitions, name)) R.fail('E_REQUIRE', 'Unknown eliminator: ' + name, { src }, null, 'unknownTerm', { term: name });
    const definition = definitions[name];
    return { t: 'symbol', name, src, eliminatorLevels: [...levels], tyValue: definition.tyValue, value: definition.value };
  }
  return { definitions: getDefinitions(), term };
});
