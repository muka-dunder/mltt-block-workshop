'use strict';
const assert = require('assert');
const M = require('../src/core.js');
const { levels } = require('../src/levels.js');
const natFun = { givens: [], goal: M.Pi('_', M.NAT, M.Pi('_', M.NAT, M.NAT)) };

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  [ok] ' + name); }
  catch (e) { fail++; console.log('  [FAIL] ' + name + '\n    ' + (e && e.message)); }
}

console.log('\n== Level reference solutions ==');
for (const lv of levels) {
  t(lv.id + ' ' + lv.title, () => {
    const r = M.checkLevel(lv, lv.solution);
    if (!r.ok) throw new Error((r.error && r.error.message) || ('holes: ' + (r.holes || []).length));
  });
}

console.log('\n== Error paths ==');
t('L0 free variable', () => {
  const r = M.checkLevel(levels[0], M.Var(5));
  assert(!r.ok && r.error.code === 'E_FREE', r.error && r.error.code);
});
t('L0 type mismatch', () => {
  const r = M.checkLevel(levels[0], M.Lam('x', M.U(0)));
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('L6 inference: wrong type rejected', () => {
  const r = M.checkLevel(levels[6], M.Var(3));
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('L7 dependent application inference: wrong type rejected', () => {
  const r = M.checkLevel(levels[7], M.Var(3));
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('L21 refl cannot prove transitivity', () => {
  const r = M.checkLevel(levels[21], M.REFL);
  assert(!r.ok && r.error.code === 'E_REFL', r.error && r.error.code);
});
t('lambda returning Bool rejected', () => {
  const r = M.checkLevel(natFun, M.Lam('m', M.Lam('n', M.TRUE)));
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('applying Nat as a function', () => {
  const r = M.checkLevel(natFun, M.Lam('m', M.Lam('n', M.App(M.Var(0), M.Var(0)))));
  assert(!r.ok && r.error.code === 'E_NOT_FUN', r.error && r.error.code);
});
t('refl on unequal things', () => {
  const lv = {
    givens: [], goal: M.Id(M.NAT, M.ZERO, M.SUC(M.ZERO))
  };
  const r = M.checkLevel(lv, M.REFL);
  assert(!r.ok && r.error.code === 'E_REFL', r.error && r.error.code);
});
t('holes are recorded', () => {
  const lv = { givens: [], goal: M.NAT };
  const r = M.checkLevel(lv, M.Hole('h1'));
  assert(!r.ok && r.holes && r.holes.length === 1, 'hole not recorded');
});

console.log('\n== Block elaboration / scope ==');
const varB = (ref, name, id) => ({ type: 'tt_var', id, fields: { REF: ref, NAME: name }, inputs: {} });
const lamB = (uid, name, body, id) => ({
  type: 'tt_lam', id, binds: { BODY: [uid] }, names: { [uid]: name },
  inputs: { BODY: body }
});

// Synthetic level with goal A -> A, for testing lambda / scope.
const arrowLv = { givens: [], goal: M.Pi('x', M.U(0), M.U(0)) };

t('L0 answer-slot local variable x', () => {
  const uid = 'ab1';
  const blk = {
    type: 'tt_answer', id: 'a1', binds: { TERM: [uid] }, names: { [uid]: 'x' },
    inputs: { TERM: varB(uid, 'x', 'v1') }
  };
  const r = M.checkBlocks(levels[0], blk);
  if (!r.ok) throw new Error(r.error.message);
});
t('variable escapes lambda (stale uid, no same-name binder)', () => {
  const blk = lamB('b1', 'x', varB('nope', 'z', 'v1'), 'l1');
  const r = M.checkBlocks(arrowLv, blk);
  assert(!r.ok && r.error.code === 'E_SCOPE', r.error && r.error.code);
});
t('stale uid after paste still binds by name', () => {
  const blk = lamB('b1', 'x', varB('stale-id', 'x', 'v1'), 'l1');
  const r = M.checkBlocks(arrowLv, blk);
  assert(r.ok, r.error && r.error.message);
});
t('x is not visible in Pi domain', () => {
  const blk = {
    type: 'tt_pi', id: 'p1', binds: { BODY: ['b1'] }, names: { b1: 'x' },
    inputs: { DOM: varB('b1', 'x', 'v1'), BODY: varB('b1', 'x', 'v2') }
  };
  const r = M.checkBlocks(arrowLv, blk);
  assert(!r.ok && r.error.code === 'E_SCOPE', r.error && r.error.code);
});
t('nested shadowing: inner x resolves to index 0', () => {
  const inner = lamB('b2', 'x', varB('b2', 'x', 'v2'), 'l2');
  const blk = lamB('b1', 'x', inner, 'l1');
  const tm = M.elabBlock(blk, []);
  assert(tm.t === 'lam' && tm.body.t === 'lam', 'wrong shape');
  assert(tm.body.body.i === 0, 'inner variable should be de Bruijn 0, got ' + tm.body.body.i);
});
t('empty slot reports E_EMPTY', () => {
  const blk = lamB('b1', 'x', null, 'l1');
  const r = M.checkBlocks(arrowLv, blk);
  assert(!r.ok && r.error.code === 'E_EMPTY', r.error && r.error.code);
});
t('answer slot: wrapping reference solution still passes', () => {
  const blk = {
    type: 'tt_answer', id: 'a1',
    inputs: { TERM: lamB('b1', 'x', varB('b1', 'x', 'v1'), 'l1') }
  };
  const r = M.checkBlocks(arrowLv, blk);
  if (!r.ok) throw new Error(r.error.message);
});
t('answer slot: empty input reports E_EMPTY', () => {
  const blk = { type: 'tt_answer', id: 'a1', inputs: {} };
  const r = M.checkBlocks(levels[0], blk);
  assert(!r.ok && r.error.code === 'E_EMPTY', r.error && r.error.code);
});
t('L6 inference: drag B into type hole', () => {
  const uids = ['uA', 'uB', 'uf', 'ux'];
  const blk = {
    type: 'tt_answer', id: 'a1',
    binds: { TERM: uids },
    names: { uA: 'A', uB: 'B', uf: 'f', ux: 'x' },
    inputs: { TERM: varB(uids[1] + '\u241F' + 'B', 'B', 'v1') }
  };
  const r = M.checkBlocks(levels[6], blk);
  if (!r.ok) throw new Error(r.error.message);
});
t('L7 inference: drag B a into type hole', () => {
  const uids = ['uA', 'uB', 'uf', 'ua'];
  const blk = {
    type: 'tt_answer', id: 'a1',
    binds: { TERM: uids },
    names: { uA: 'A', uB: 'B', uf: 'f', ua: 'a' },
    inputs: {
      TERM: {
        type: 'tt_app', id: 'ap1', inputs: {
          F: varB(uids[1] + '\u241FB', 'B', 'v1'),
          A: varB(uids[3] + '\u241Fa', 'a', 'v2')
        }
      }
    }
  };
  const r = M.checkBlocks(levels[7], blk);
  if (!r.ok) throw new Error(r.error.message);
});
t('L10 computation: answer without unitrec rejected', () => {
  const uids = ['uC', 'uc'];
  const blk = {
    type: 'tt_answer', id: 'a1',
    binds: { TERM: uids },
    names: { uC: 'C', uc: 'c' },
    inputs: { TERM: varB(uids[1] + '\u241Fc', 'c', 'v1') }
  };
  const r = M.checkBlocks(levels[10], blk);
  assert(!r.ok && r.error.code === 'E_REQUIRE', r.error && r.error.code);
});
t('L10 computation: unitrec star C c passes', () => {
  const uids = ['uC', 'uc'];
  const blk = {
    type: 'tt_answer', id: 'a1',
    binds: { TERM: uids },
    names: { uC: 'C', uc: 'c' },
    inputs: {
      TERM: {
        type: 'tt_unitrec', id: 'ur1', inputs: {
          U: { type: 'tt_star', id: 's1', inputs: {} },
          MOT: varB(uids[0] + '\u241FC', 'C', 'v2'),
          BASE: varB(uids[1] + '\u241Fc', 'c', 'v3')
        }
      }
    }
  };
  const r = M.checkBlocks(levels[10], blk);
  if (!r.ok) throw new Error(r.error.message);
});
t('L13 Sigma fst: sigma_ind block elaborates', () => {
  const uids = ['uA', 'uB'];
  const blk = {
    type: 'tt_answer', id: 'a1',
    binds: { TERM: uids },
    names: { uA: 'A', uB: 'B' },
    inputs: {
      TERM: {
        type: 'tt_lam', id: 'l1', binds: { BODY: ['uP'] }, names: { uP: 'p' },
        inputs: {
          BODY: {
            type: 'tt_sigma_ind', id: 'si1',
            binds: { MOT_BODY: ['uM'], STEP_BODY: ['uSa', 'uSb'] },
            names: { uM: 'p', uSa: 'a', uSb: 'b' },
            inputs: {
              P: varB('uP\u241Fp', 'p', 'v1'),
              MOT_BODY: varB('uA\u241FA', 'A', 'v2'),
              STEP_BODY: varB('uSa\u241Fa', 'a', 'v3')
            }
          }
        }
      }
    }
  };
  const r = M.checkBlocks(levels[13], blk);
  if (!r.ok) throw new Error(r.error.message);
});

console.log('\n== NbE ==');
t('beta: (lambda x. x) 3 = 3', () => {
  const app = M.App(M.Lam('x', M.Var(0)), M.SUC(M.ZERO));
  const a = M.evalTm([], app), b = M.evalTm([], M.SUC(M.ZERO));
  assert(M.conv(a, b));
});
t('iota: natrec 0 = z', () => {
  const app = M.NatRec(M.ZERO, M.Lam('_', M.NAT), M.ZERO, M.Lam('k', M.Lam('i', M.SUC(M.Var(0)))));
  assert(M.conv(M.evalTm([], app), M.evalTm([], M.ZERO)));
});
t('iota: unitrec star = c', () => {
  const c = M.SUC(M.ZERO);
  const rec = M.UnitRec(M.STAR, M.Lam('_', M.NAT), c);
  assert(M.conv(M.evalTm([], rec), M.evalTm([], c)));
});
t('iota: sigma_ind <a,b> = step a b', () => {
  const a = M.ZERO, b = M.SUC(M.ZERO);
  const rec = M.SigmaInd(M.Pair(a, b), M.Lam('p', M.NAT), M.Lam('a', M.Lam('b', M.Var(1))));
  assert(M.conv(M.evalTm([], rec), M.evalTm([], a)));
});
t('delta: add 2 2 = 4', () => {
  const two = M.SUC(M.SUC(M.ZERO));
  const app = M.App(M.App(M.Ref('add'), two), two);
  const four = M.SUC(M.SUC(M.SUC(M.SUC(M.ZERO))));
  assert(M.conv(M.evalTm([], app), M.evalTm([], four)));
});
t('eta: f = lambda x. f x', () => {
  const ctx = [{ name: 'A', ty: M.evalTm([], M.U(0)) }];
  const f = M.evalTm(M.envOf(ctx), M.Var(0));
  assert(M.conv(f, M.evalTm(M.envOf(ctx), M.Lam('y', M.App(M.Var(1), M.Var(0))))));
});
t('not equal: suc 0 != 0', () => {
  assert(!M.conv(M.evalTm([], M.SUC(M.ZERO)), M.evalTm([], M.ZERO)));
});

console.log('\n== Triple negation (L22) ==');
t('L22 reference solution lambda h p. h (lambda k. k p)', () => {
  const lv = levels[22];
  const r = M.checkLevel(lv, lv.solution);
  if (!r.ok) throw new Error((r.error && r.error.message) || 'holes');
});
t('L22 wrong solution lambda h p. h p rejected', () => {
  const lv = levels[22];
  const bad = M.Lam('h', M.Lam('p', M.App(M.Var(1), M.Var(0))));
  const r = M.checkLevel(lv, bad);
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('L22 wrong solution lambda h p. p rejected (type mismatch)', () => {
  const lv = levels[22];
  const bad = M.Lam('h', M.Lam('p', M.Var(0)));
  const r = M.checkLevel(lv, bad);
  assert(!r.ok && r.error.code === 'E_MISMATCH', r.error && r.error.code);
});
t('L22 print goal', () => {
  const lv = levels[22];
  const ctx = M.buildCtx(lv.givens);
  const s = M.show(ctx, lv.goal);
  console.log('    ' + s);
  assert(s.includes('\u00ac'), s);
});

console.log('\n== Printing ==');
t('print L1 goal', () => {
  const s = M.show(M.buildCtx(levels[1].givens), levels[1].goal);
  assert(s.includes('\u2192'), s);
  console.log('    ' + s);
});
t('print L21 reference solution', () => {
  const ctx = M.buildCtx(levels[21].givens);
  const s = M.show(ctx, levels[21].solution);
  assert(s.startsWith('J('), s);
  console.log('    ' + s);
});

console.log('\nResult: ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
