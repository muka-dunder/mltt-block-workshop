'use strict';
const assert = require('node:assert/strict');
const M = require('../src/core/mltt.js');
const apply = (name, ...args) => args.reduce((fn, arg) => M.App(fn, arg), M.eliminatorTerm(name));
const value = term => M.evalTm([], term);
const equivalent = (a, b) => assert(M.conv(value(a), value(b)));

for (const name of M.eliminatorNames) assert.equal(M.infer([], M.eliminatorTerm(name)).t, 'Pi');
const motive = M.Lam('n', M.NAT), step = M.Lam('k', M.Lam('ih', M.SUC(M.Var(0))));
const two = M.SUC(M.SUC(M.ZERO));
const natural = apply('ind_nat', two, motive, M.ZERO, step);
assert.equal(M.infer([], natural).t, 'Nat'); equivalent(natural, two);
assert.equal(M.infer([], apply('ind_nat', two)).t, 'Pi');
assert.equal(M.infer([], apply('ind_nat', two, motive, M.ZERO)).t, 'Pi');
const unit = apply('ind_unit', M.STAR, M.Lam('u', M.NAT), M.ZERO);
assert.equal(M.infer([], unit).t, 'Nat'); equivalent(unit, M.ZERO);

const family = M.Lam('a', M.Id(M.NAT, M.Var(0), M.Var(0)));
const pairType = M.Sigma('a', M.NAT, M.Id(M.NAT, M.Var(0), M.Var(0)));
const pair = M.Annot(M.Pair(M.ZERO, M.REFL), pairType);
const pairMotive = M.Lam('p', M.Id(M.NAT, M.Fst(M.Var(0)), M.Fst(M.Var(0))));
const pairStep = M.Lam('a', M.Lam('b', M.Var(0)));
const sigma = apply('ind_sigma', M.NAT, family, pair, pairMotive, pairStep);
assert.equal(M.infer([], sigma).t, 'Id'); equivalent(sigma, M.REFL);
equivalent(sigma, M.SigmaInd(pair, pairMotive, pairStep));
assert.equal(M.infer([], apply('ind_sigma', M.NAT, family)).t, 'Pi');
equivalent(M.Lam('p', M.SigmaInd(M.Var(0), pairMotive, pairStep)),
  M.Lam('p', apply('ind_sigma', M.NAT, family, M.Var(0), pairMotive, pairStep)));
equivalent(M.Lam('u', M.UnitRec(M.Var(0), M.Lam('_', M.NAT), M.ZERO)),
  M.Lam('u', apply('ind_unit', M.Var(0), M.Lam('_', M.NAT), M.ZERO)));
assert(!M.conv(value(M.Lam('u', M.UnitRec(M.Var(0), M.Lam('_', M.NAT), M.ZERO))),
  value(M.Lam('u', M.UnitRec(M.Var(0), M.Lam('_', M.NAT), M.SUC(M.ZERO))))));
const identity = apply('J', M.NAT, M.ZERO, M.Lam('b', M.Lam('q', M.NAT)), M.ZERO, M.ZERO, M.REFL);
assert.equal(M.infer([], identity).t, 'Nat'); equivalent(identity, M.ZERO);
assert.throws(() => M.infer([], apply('ind_nat', M.STAR)), M.CheckError);
assert.throws(() => M.infer([], M.App(natural, M.ZERO)), M.CheckError);
assert.throws(() => M.infer([], apply('ind_sigma', M.NAT, family, M.ZERO)), M.CheckError);
assert.throws(() => M.eliminatorTerm('forged'), M.CheckError);
assert.throws(() => M.eliminatorTerm('__proto__'), M.CheckError);
assert.throws(() => M.eliminatorTerm('J', undefined, [-1, 0]), M.CheckError);
assert.throws(() => M.eliminatorTerm('ind_sigma', undefined, [0, 0.5]), M.CheckError);
const highSigma = M.SigmaInd(M.Annot(M.Pair(M.NAT, M.ZERO), M.Sigma('T', M.U(0), M.Var(0))),
  M.Lam('p', M.NAT), M.Lam('T', M.Lam('x', M.ZERO)));
const highFamily = M.SigmaInd(M.Annot(M.Pair(M.ZERO, M.NAT), M.Sigma('n', M.NAT, M.U(0))),
  M.Lam('p', M.NAT), M.Lam('n', M.Lam('T', M.ZERO)));
const highJ = M.J(M.NAT, M.Lam('T', M.Lam('q', M.NAT)), M.ZERO, M.NAT, M.REFL);
for (const term of [highSigma, highFamily, highJ]) {
  const fn = M.functionForm([], term);
  assert.equal(M.infer([], fn).t, 'Nat'); equivalent(fn, term);
}
console.log('PASS: curried eliminators, partial application, dependent Sigma motives, computation and invalid arguments');
