/* Short main journey and optional practice series; stable IDs remain shareable. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTLevelJourney = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (syntax, existing) {
  'use strict';
  const { v, Uo, pi, sigma, lam, app, pair, id, ref, NATo, ZEROo } = syntax;
  const suc = n => ({ nt: 'suc', n });
  const apply = (f, ...args) => args.reduce(app, f);
  const add = (a, b) => apply(ref('add'), a, b);
  const type = name => ({ name, ty: Uo(0) });
  const types = ['A', 'B', 'C'].map(type);
  const family = { name: 'B', ty: pi('_', v('A'), Uo(0)) };
  const naturalEquality = (a, b) => id(NATo, a, b);
  const base = { givensRaw: [], newBlocks: [], hints: [] };
  const added = [
    {
      ...base, id: 'journey_pair', title: 'Pack two things', titleZh: '装进两个东西',
      tag: 'Dependent pairs', tagZh: '依赖序对',
      story: 'The second piece has a type determined by the first. Pack a and b together.',
      storyZh: '第一格装什么，决定第二格应该装哪种东西。把已经配好的 a 和 b 装进同一个序对吧！',
      answerBindersRaw: [type('A'), family, { name: 'a', ty: v('A') }, { name: 'b', ty: app(v('B'), v('a')) }],
      goalRaw: sigma('x', v('A'), app(v('B'), v('x'))),
      solutionRaw: pair(v('a'), v('b')), solutionText: '⟨a, b⟩',
      palette: ['tt_pair', 'tt_var'],
    },
    {
      ...base, id: 'journey_nat', title: 'Start from zero', titleZh: '从零开始',
      tag: 'Natural numbers', tagZh: '自然数',
      story: 'The successor block is ready. Fill its input with a natural number, starting with zero.',
      storyZh: '自然数从 0 开始；suc 表示再往前走一步。题目已经放好了 suc，给它一个自然数作为起点吧。',
      goalRaw: NATo, solutionRaw: suc(ZEROo), solutionText: 'suc 0',
      palette: ['tt_zero', 'tt_suc', 'tt_nat'], requireBlock: 'tt_suc', requireBlockName: 'suc',
    },
    {
      ...base, id: 'journey_double', title: 'Repeat the work', titleZh: '重复工作',
      tag: 'Recursion', tagZh: '递归',
      story: 'The recursive machine starts at zero. Each successor must add two to the previous result.',
      storyZh: '把数字翻倍：0 的两倍还是 0，输入每增加一步，结果就增加两步。补上递归步骤，让机器工作起来吧！',
      answerBindersRaw: [{ name: 'n', ty: NATo }], goalRaw: NATo,
      solutionRaw: apply(ref('repeat_nat'), v('n'), ZEROo, lam('k', lam('ih', suc(suc(v('ih')))))),
      solutionText: 'repeat_nat n 0 (λk. λih. suc (suc ih))',
      palette: ['tt_suc', 'tt_var', 'tt_app', 'tt_lam', 'tt_card'], cardNames: ['repeat_nat'],
      scaffoldPaths: [['A', 'BODY', 'BODY']],
    },
    {
      ...base, id: 'journey_induction', title: 'A proof for every number', titleZh: '第一次归纳',
      tag: 'Induction', tagZh: '归纳证明',
      story: 'Zero is settled. Use the induction hypothesis and the supplied successor-congruence lemma for the next step.',
      storyZh: '起点已经站稳，这关专心练习归纳的接力一步：用 ih，把 k + 0 = k 推进到下一阶。完整归纳证明可以在 add_zero 定理的详情里查看。',
      answerBindersRaw: [{ name: 'k', ty: NATo }, { name: 'ih', ty: naturalEquality(add(v('k'), ZEROo), v('k')) }],
      goalRaw: naturalEquality(add(suc(v('k')), ZEROo), suc(v('k'))),
      solutionRaw: apply(ref('suc_cong'), add(v('k'), ZEROo), v('k'), v('ih')),
      solutionText: 'suc_cong (add k 0) k ih',
      palette: ['tt_app', 'tt_var', 'tt_card', 'tt_zero', 'tt_suc', 'tt_refl'], cardNames: ['add', 'suc_cong', 'add_zero'],
      scaffoldPaths: [['A']],
    },
    {
      ...base, id: 'function_compose', title: 'Connect two functions', titleZh: '函数复合',
      tag: 'Composition', tagZh: '函数复合',
      story: 'First turn an A into a B, then turn that B into a C.',
      storyZh: 'f 把 A 变成 B，g 再把 B 变成 C。把两台机器接起来，做成一台 A → C 的新机器吧！',
      answerBindersRaw: [...types, { name: 'f', ty: pi('_', v('A'), v('B')) }, { name: 'g', ty: pi('_', v('B'), v('C')) }],
      goalRaw: pi('x', v('A'), v('C')),
      solutionRaw: lam('x', app(v('g'), app(v('f'), v('x')))), solutionText: 'λx. g (f x)',
      palette: ['tt_lam', 'tt_app', 'tt_var'],
    },
    {
      ...base, id: 'function_curry', title: 'Change the way arguments arrive', titleZh: '柯里化',
      tag: 'Currying', tagZh: '柯里化',
      story: 'h takes a whole pair. Build a function that receives the two pieces one at a time.',
      storyZh: 'h 习惯一次收到一整个序对。现在把它包装一下，让调用者可以先交 A，再交 B，最后得到 C。',
      answerBindersRaw: [...types, { name: 'h', ty: pi('_', sigma('_', v('A'), v('B')), v('C')) }],
      goalRaw: pi('a', v('A'), pi('b', v('B'), v('C'))),
      solutionRaw: lam('a', lam('b', app(v('h'), pair(v('a'), v('b'))))), solutionText: 'λa. λb. h ⟨a, b⟩',
      palette: ['tt_lam', 'tt_app', 'tt_pair', 'tt_var'],
    },
    {
      ...base, id: 'dependent_constant', title: 'A constant type family', titleZh: '常量类型族',
      tag: 'Type families', tagZh: '类型族',
      story: 'A type is a valid result too. Return A for every input of type A.',
      storyZh: '函数也可以返回一个类型。无论交进来哪个 A 类型的对象，都返回类型 A 本身，做一台最简单的类型生产机吧。',
      answerBindersRaw: [type('A')], goalRaw: pi('x', v('A'), Uo(0)),
      solutionRaw: lam('_', v('A')), solutionText: 'λ_. A',
      palette: ['tt_lam', 'tt_var', 'tt_U'],
    },
    {
      ...base, id: 'dependent_pi', title: 'Build a dependent function type', titleZh: '构造依赖函数类型',
      tag: 'Π types', tagZh: 'Π 类型',
      story: 'The given function returns B x for its own input x. Assemble its whole type.',
      storyZh: '这次要填写一整个函数类型。留意 B 后面的参数：它需要引用 Π 在函数类型内部引入的那个名字。',
      answerBindersRaw: [type('A'), family, { name: 'f', ty: pi('x', v('A'), app(v('B'), v('x'))) }],
      inferTermRaw: v('f'), goalRaw: Uo(0),
      solutionRaw: pi('x', v('A'), app(v('B'), v('x'))), solutionText: 'Π (x : A) → B x',
      palette: ['tt_pi', 'tt_app', 'tt_var'],
    },
  ];
  const catalog = {
    journey: [
      ['L0', 'Who are you', '你是谁'], ['L1', 'Return the input', '原样返回'],
      ['L3', 'Use a function', '使用一个函数'], ['L7', 'The type follows the argument', '类型跟着参数变'],
      ['L8', 'One little star', '唯一的一颗星'], ['journey_pair'],
      ['L13', 'Open a package', '拆开一个包裹'], ['journey_nat'], ['journey_double'],
      ['L15', 'Equality is a type', '相等也是一种类型'], ['L19', 'Use an equality', '相等可以拿来用'], ['journey_induction'],
    ],
    functions: [
      ['L2', 'Keep an outer variable', '外层变量'], ['L5', 'Apply one argument first', '多参数与部分应用'],
      ['function_compose'], ['function_curry'],
    ],
    dependent: [['dependent_constant'], ['dependent_pi'], ['L17', 'An identity for every type', '多态恒等函数']],
  };
  const all = [...existing, ...added], byId = new Map(all.map(level => [level.id, level]));
  for (const [series, entries] of Object.entries(catalog)) entries.forEach(([id, title, titleZh], seriesOrder) => {
    const level = byId.get(id);
    Object.assign(level, { series, seriesOrder, returnSeries: series === 'journey' ? null : 'journey' });
    if (title) Object.assign(level, { title, titleZh });
  });
  byId.get('L1').recommendedBranch = 'functions';
  byId.get('L3').recommendedBranch = 'functions';
  byId.get('L7').recommendedBranch = 'dependent';
  Object.assign(byId.get('L13'), {
    answerBindersRaw: [type('A'), family, { name: 'p', ty: sigma('x', v('A'), app(v('B'), v('x'))) }],
    goalRaw: v('A'), goalText: 'A',
    solutionRaw: apply(ref('with_pair'), v('A'), v('B'), v('p'), lam('a', lam('b', v('a')))),
    solutionText: 'with_pair A B p (λa. λb. a)',
    palette: ['tt_lam', 'tt_var', 'tt_app', 'tt_card'], cardNames: ['with_pair'], newBlocks: [],
    scaffoldPaths: [['A', 'BODY', 'BODY']],
    hints: ['The package p is already in the context.', 'with_pair opens p and gives the branch a : A and b : B a.', 'Return the item whose type is A.'],
  });
  Object.assign(byId.get('L19'), {
    solutionRaw: apply(ref('transport'), v('A'), v('B'), v('x'), v('y'), v('p'), v('b')),
    solutionText: 'transport A B x y p b',
    palette: ['tt_app', 'tt_var', 'tt_card'], cardNames: ['transport'], newBlocks: [], scaffoldPaths: [['A']],
    hints: ['transport already contains the equality-elimination machinery.', 'The missing input must have type B x.', 'The context provides exactly that starting material.'],
  });
  return all;
});
