/* Preset cards use the same declaration blocks and checks as player-made cards. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreatePresetCards = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  let serial = 0;
  const node = (type, inputs = {}, fields = {}) => ({ type, id: 'preset_add_' + (++serial), fields, inputs });
  const natural = () => node('tt_nat');
  const variable = binding => node('tt_var', {}, { REF: binding.uid + '\u241F' + binding.name });
  function binder(type, name, body, domain) {
    const block = node(type, {}, { XNAME: name });
    const uid = 'b' + block.id + ':x';
    block.binds = { BODY: [uid] }; block.names = { [uid]: name };
    if (domain) block.inputs.DOM = domain;
    block.inputs.BODY = body({ uid, name });
    return block;
  }
  const lambda = (name, body) => binder('tt_lam', name, body);
  const pi = (name, body) => binder('tt_pi', name, body, natural());
  const dependent = (name, domain, body) => binder('tt_pi', name, body, domain);
  const sigma = (name, domain, body) => binder('tt_sigma', name, body, domain);
  const universe = () => node('tt_U', {}, { LEVEL: '0' });
  const apply = (fn, ...args) => args.reduce((f, argument) => node('tt_app', { F: f, A: argument }), fn);
  const ind = name => node('tt_eliminator_' + name);
  const reference = name => node('tt_symbol', {}, { REF: 'preset_' + name + '_v1' });
  const equality = (type, left, right) => node('tt_id', { TY: type, L: left, R: right });
  const successor = value => node('tt_suc', { N: value });
  const zero = () => node('tt_zero');
  const refl = () => node('tt_refl');
  const add = (a, b) => apply(reference('add'), a, b);
  const declaration = {
    type: 'tt_declare', id: 'preset_add_v1', fields: { NAME: 'add', KIND: 'definition' },
    inputs: {
      TYPE: pi('m', () => pi('n', natural)),
      VALUE: lambda('m', m => lambda('n', n => apply(node('tt_eliminator_ind_nat'),
        variable(m), lambda('_', natural), variable(n),
        lambda('k', () => lambda('ih', ih => node('tt_suc', { N: variable(ih) }))))))
    }
  };
  const cards = [];
  function card(name, description, type, value) {
    const declaration = { type: 'tt_declare', id: 'preset_' + name + '_v1', fields: { NAME: name, KIND: 'definition' }, inputs: { TYPE: type, VALUE: value } };
    cards.push({ id: declaration.id, name, kind: 'theorem', description, declaration });
  }
  cards.push({ id: declaration.id, name: 'add', kind: 'theorem',
    description: '自然数加法：从第二个数 n 出发，按第一个数 m 的步数一步步取后继。', declaration });
  card('with_pair', '拆包工具：打开依赖序对 p，把里面的 a 和 b 交给分支，算出类型为 A 的结果。',
    dependent('A', universe(), A => dependent('B', dependent('_', variable(A), universe), B =>
      dependent('p', sigma('x', variable(A), x => apply(variable(B), variable(x))), () =>
        dependent('step', dependent('a', variable(A), a => dependent('b', apply(variable(B), variable(a)), () => variable(A))), () => variable(A))))),
    lambda('A', A => lambda('B', B => lambda('p', p => lambda('step', step =>
      apply(ind('ind_sigma'), variable(A), variable(B), variable(p), lambda('_', () => variable(A)), variable(step)))))));
  card('repeat_nat', '自然数接力机：给定步数 n、起点和单步规则，反复算出一个自然数结果。',
    pi('n', () => pi('start', () => dependent('step', pi('k', () => pi('ih', natural)), natural))),
    lambda('n', n => lambda('start', start => lambda('step', step =>
      apply(ind('ind_nat'), variable(n), lambda('_', natural), variable(start), variable(step))))));
  card('transport', '跨类型搬运：沿着相等桥梁 p : Id A x y，把 B x 中的货物搬到 B y。',
    dependent('A', universe(), A => dependent('B', dependent('_', variable(A), universe), B =>
      dependent('x', variable(A), x => dependent('y', variable(A), y =>
        dependent('p', equality(variable(A), variable(x), variable(y)), () =>
          dependent('item', apply(variable(B), variable(x)), () => apply(variable(B), variable(y)))))))),
    lambda('A', A => lambda('B', B => lambda('x', x => lambda('y', y => lambda('p', p => lambda('item', item =>
      apply(ind('J'), variable(A), variable(x), lambda('w', w => lambda('q', () => apply(variable(B), variable(w)))), variable(item), variable(y), variable(p)))))))));
  card('suc_cong', '后继保持相等：若两个自然数 a 与 b 相等，则 suc a 与 suc b 也相等。',
    pi('a', a => pi('b', b => dependent('proof', equality(natural(), variable(a), variable(b)), () =>
      equality(natural(), successor(variable(a)), successor(variable(b)))))),
    lambda('a', a => lambda('b', b => lambda('proof', proof =>
      apply(ind('J'), natural(), variable(a), lambda('w', w => lambda('q', () => equality(natural(), successor(variable(a)), successor(variable(w))))), refl(), variable(b), variable(proof))))));
  card('add_zero', '归纳定理：对任何自然数 n，都有 add n 0 = n（加上零等于它自己）。',
    pi('n', n => equality(natural(), add(variable(n), zero()), variable(n))),
    lambda('n', n => apply(ind('ind_nat'), variable(n),
      lambda('m', m => equality(natural(), add(variable(m), zero()), variable(m))), refl(),
      lambda('k', k => lambda('ih', ih => apply(reference('suc_cong'), add(variable(k), zero()), variable(k), variable(ih)))))));
  const explanations = {
    add: `add 是“自然数加法”机器，它的类型是 ℕ → ℕ → ℕ：依次接收 m 和 n，返回一个自然数。两个参数分工很明确：m 决定要往前走多少步，n 决定从哪个数开始起步。

看看左边的构造，它是怎样一步步工作的：
1. 外层 λm. λn. 接住两个输入，然后用 ind_nat 对第一个数 m 做递归。
2. 目标族 λ_. ℕ 说明：无论走到哪一步，返回结果的类型始终都是 ℕ。
3. 起点（m = 0）填 n：0 加上 n 不用走任何台阶，结果直接就是 n（即 add 0 n ≡ n）。
4. 接力步骤 λk. λih. suc ih：k 是前一步的数字，ih 是机器已经算好的 add k n。当第一个数从 k 增加到 suc k（多 1 步）时，只要在 ih 外面多套一层 suc 就够啦！（这一步用不到 k 本身，但 ind_nat 仍会贴心地把它传进来。）

举个例子：计算 add 2 3 时，从起点 3 出发，按第一个数 2 走两次 suc，依次得到 4、5。正是因为 add 递归的是第一个参数，所以 add 0 n 和 add (suc k) n 会自动按定义展开，而把 0 放在后面的 add n 0 就需要靠后面的 add_zero 定理来证明啦！`,
    with_pair: `with_pair 是一张专门用来“打开依赖序对、取出 A 类型结果”的拆包卡片。它依次接收 4 个输入：第一项类型 A、第二项类型族 B、要拆的包裹 p（类型为 Σ(x : A). B x），以及拆开后怎么处理的分支 step。

为什么 step 的类型写着 Π(a : A). Π(b : B a). A？
因为包裹里的第二件物品 b 的类型依赖第一件物品 a，所以拆开之后，分支会先后拿到局部变量 a : A 和配套的 b : B a，并承诺最终交出一个类型为 A 的结果（a 和 b 只在 step 内部有效哦）。

看看左边的内部构造，其实没有藏任何黑魔法：
1. 外面四层 λ 依次接住 A、B、p、step；
2. 里面直接调用了你学过的 ind_sigma，把目标族固定为 λ_. A（“不管拆开哪个包裹，最终都只想要 A”）。
3. 当传入的 p 真的是一个配对 ⟨a, b⟩ 时，with_pair A B ⟨a, b⟩ step 就会直接计算成 step a b！

最常见的用法是把分支写成 λa. λb. a——拿到两件物品后直接交出第一件 a（比如把 ⟨2, 3⟩ 拆开就能拿回 2）。如果你以后想让返回类型也跟着包裹里的值变化，可以对照这张卡片里的 ind_sigma，把 λ_. A 换成更灵活的目标族！`,
    repeat_nat: `repeat_nat 是一位友好的“自然数接力循环器”：只要你的任务“无论走多少步，最终都返回一个自然数 ℕ”，就可以用它省去每次手写目标族 λ_. ℕ 的麻烦！

它的类型 ℕ → ℕ → (ℕ → ℕ → ℕ) → ℕ 对应三个非常直观的输入：
1. n：总共要沿着自然数台阶走多少步；
2. start：当 n = 0（一步都不走）时，起点应该交出的答案；
3. step：每往前多走一步的接力规则，它会收到前一步的编号 k 和机器已经算好的前一步结果 ih。注意 ih 已经帮你把前面的活干完了，不用从 0 重算，只要在 ih 的基础上推进一步就行！

看看左边的构造：λn. λstart. λstep. 里面只是把 ind_nat 的目标族固定成了 λ_. ℕ。因此它有两条自然的计算规律：
• 停在起点：repeat_nat 0 start step ≡ start
• 往前接力：repeat_nat (suc k) start step ≡ step k (repeat_nat k start step)

比如做一台“翻倍机”：起点填 0，步骤填 λk. λih. suc (suc ih)（输入多 1，输出多 2）。算 repeat_nat 3 0 (λk. λih. suc (suc ih)) 时，结果会从 0 → 2 → 4 → 6！这里没有用到 k，但如果是算“0 + 1 + … + n”这类和步数编号有关的任务，k 就会派上大用场。`,
    transport: `transport 的本领是“顺着相等桥梁，把数据从一个类型房间搬到另一个相关房间”！

先看清场景：假设类型族 B : A → Type 0 为 A 中的每个位置 w 都准备了一个房间 B w。现在你手里有一件住在起点房间 B x 里的货物 item，你想得到终点房间 B y 里的东西。虽然 B x 和 B y 字面上写得不一样，但只要手头有一座相等桥梁 p : Id A x y，transport 就能帮你把货物安全运过去！

6 个输入按顺序排成一队：所在类型 A、房间地图 B、起点 x、终点 y、桥梁 p、起点货物 item。

打开左边的构造，你会发现桥梁的底层其实全靠等式消去子 J：
1. 把 J 的起点钉在 x，目标族写成 λw. λq. B w（意思是“不管走到哪个终点 w，顺着证据 q，最终都要交出 B w 里的物品”；这里用不到 q 本身）。
2. 当终点还停在起点 x、证据是自反性 refl 时，目标就是交出 B x——手里的 item : B x 恰好直接顶上！
3. 最后把真正的终点 y 和桥梁 p 交给 J，就把起点的能力顺着 p 延展到了终点 B y。

当桥梁本身就是 refl（相当于原地不动：transport A B x x refl item）时，整个表达式会直接计算成 item；如果 p 还是个未知变量，检查器会确认类型完全合法，并等 p 具体化成 refl 后再继续展开。`,
    suc_cong: `suc_cong 表达了一条再自然不过的直觉：“如果两个自然数相等，那么给它们各自加上 1（取后继），结果肯定还是相等的！”

读它的类型：输入两个自然数 a、b，以及它们相等的证明 proof : Id ℕ a b，就能输出 Id ℕ (suc a) (suc b)。你可以把它当成一台“把等号两边同步往前推进一步”的证明小助手。

你可能会想：“既然它们相等，直接写 refl 不行吗？”不行哦！因为对于抽象的变量 a 和 b，如果不去使用 proof，类型检查器凭什么相信它们真的相等呢？所以这里必须请出等式消去子 J 来消耗掉 proof：
1. 先把左端钉死在 suc a，让右端暂时叫作 w，目标族写成 λw. λq. Id ℕ (suc a) (suc w)（“证明 suc a 等于 suc w”）。
2. 现在看看起点情况（当右端 w 回到 a、证据 q 是 refl 时）：目标立刻变成 Id ℕ (suc a) (suc a)！等号两边一模一样，填一块 refl 就当场证完！
3. 最后 J 顺着你传入的 proof，把这份“在 a 处成立的证明”一路带到右端 b，就变成了 Id ℕ (suc a) (suc b)！

在主线的归纳证明里，拿到 ih : Id ℕ (add k 0) k 后，调用 suc_cong (add k 0) k ih 就能立刻得到 Id ℕ (suc (add k 0)) (suc k)。而当传入的是 refl 时，J 的计算规则还会把 suc_cong a a refl 直接化简成 refl 呢。`,
    add_zero: `add_zero 是“每一个自然数加上零，结果还是它自己”的完整数学归纳证明！它的类型写着 Π(n : ℕ). Id ℕ (add n 0) n：只要交进来任意自然数 n，它就能产出一份 add n 0 = n 的证明。

你可能会奇怪：“在 add 卡片里 0 + n 直接就等于 n 了，为什么 n + 0 反而要大费周章地证明？”
因为 add 是按**第一个参数**递归的！当 0 在前面（add 0 n）时，计算规则立刻就能算成 n；可当 0 在后面、前面是未知变量 n（add n 0）时，机器不知道 n 要走几步，计算就卡住了——必须用数学归纳法对 n 一步步证出来！

看看左边的完整构造，是怎么把起点和接力连起来的：
1. 依赖目标族 λm. Id ℕ (add m 0) m：和返回固定 ℕ 的 repeat_nat 不同，这里每个自然数 m 对应的证明目标都不一样（都在证 m + 0 = m），所以目标族会随着 m 变化！
2. 起点（n = 0）：按 add 的计算规则，add 0 0 直接算成 0，目标变成 Id ℕ 0 0，一块 refl 就搞定了！
3. 接力（λk. λih.）：k 是前一个数，ih 是已经证好的归纳假设 Id ℕ (add k 0) k。当来到 suc k 时，目标左边 add (suc k) 0 会算成 suc (add k 0)，右边是 suc k——正好就是把 ih 等号两边一起取 suc！于是调用 suc_cong (add k 0) k ih 就稳稳接上啦！

起点靠 refl 站稳，每步靠 suc_cong 接力，再由 ind_nat 串起所有自然数——整份定理只依赖经过检查的 add 和 suc_cong，没有引入任何额外公理哦！`,
  };
  for (const item of cards) item.explanation = explanations[item.name];
  return cards;
});
