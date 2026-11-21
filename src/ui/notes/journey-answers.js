// Worked explanations accompany the same reference blocks shown on the canvas.
export const JOURNEY_ANSWERS = {
  L0: {
    'zh-CN': `现在画布上已经放好了标准答案：答案槽里只有一个积木 x。让我们一步步顺着类型检查器的思路，看看为什么这么填就通过了：

1. 先看题目要什么：判断卡下方写着“? : A”，意思是冒号左边必须填入一个“具有类型 A 的项”。
2. 再看条件区有什么：顶部以符号 Γ（Gamma，表示“上下文 / 已知条件”）开头，声明了 A : Type 0（A 是一个类型）和 x : A（x 是已经存在的一个项，它的类型恰好是 A）。
3. 把 x 放进去：因为条件区已经把现成的 x 交到了你手边，不需要额外加工，直接拖进答案槽就变成了 Γ ⊢ x : A，检查直接通过！

你可以点击画布上的 x 看看下方的类型提示。顺便记住为什么不能交 A：A 是“类型标签”（它自己的类型是 Type 0），而题目要的是属于 A 的“具体对象”x。以后遇到更复杂的关卡，都可以先做这两步：看清目标要什么类型，再看材料库里谁符合要求！`,
    en: `The reference answer is now on the canvas: just the single block x inside the answer slot. Let's trace step by step why this solves the puzzle:

1. Check what the goal asks for: the bottom of the card reads “? : A”, meaning the left side of the colon needs a term of type A.
2. Check what the context supplies: at the top, introduced by Γ (Gamma, standing for the “context” of known assumptions), A : Type 0 declares a type A, and x : A gives us a ready-made term named x whose type is already A.
3. Put x in place: because we already have an item of type A in hand, placing x in the slot forms Γ ⊢ x : A, which checks immediately!

Try selecting x on the canvas to inspect its type. Notice why A itself wouldn't fit: A is the category label (its own type is Type 0), whereas the slot asks for an item x inside A. For bigger puzzles later on, start with these same two questions: what type is required, and what material in scope can provide it?`
  },
  L1: {
    'zh-CN': `画布上的答案是 λx. x——这就是大名鼎鼎的“恒等函数（Identity Function）”。我们来拆解一下，为什么条件里明明没有 A 类型的东西，却能造出 A → A：

1. 为什么先放 λ？目标 A → A 代表一台函数机器：“只要未来给我一个 A，我就还你一个 A。”因为机器只需要描述“收到输入后怎么处理”，不需要在制造机器的此刻就拿到实际输入，所以用 λ 把未来收到的输入请进来、命名为 x。
2. 参数类型从哪来？由于答案槽的目标是 A → A，检查器自动推导出这个参数 x 的类型必须是 A。
3. 函数体里填什么？进入函数体后，当前视野里已经有了刚引入的 x : A，而目标正好要求返回一个 A——直接把 x 原封不动交出去，就组成了 λx. x！

留意变量 x 的作用域：它只在当前这台 λ 的函数体内部有效；如果把它拖到 λ 外面，就会立刻超出作用域。积木的嵌套不仅决定结构，也划定了名字能生效的范围。`,
    en: `The answer on the canvas is λx. x—the famous “identity function”. Let's see how it satisfies A → A even without any ready-made element of A in the context:

1. Why start with λ? The goal A → A asks for a function machine: “Give me an A in the future, and I will return an A.” Building a function only describes how to handle a future input, so you don't need that input upfront—λ lets you name it x.
2. Where does x get its type? From the expected goal A → A, the type checker automatically knows that the parameter x must have type A.
3. What goes in the body? Inside the body, x : A is now in scope and the body must return an A—so handing x straight back gives λx. x!

Keep an eye on x's scope: x belongs strictly to this λ's body. Dragging it outside the λ makes it out of scope. Block nesting records both program structure and where names are visible.`
  },
  L3: {
    'zh-CN': `答案是应用表达式 f x，读作“把 x 交给 f 来处理”。让我们对照应用积木的左右两个槽位检查一遍：

1. 左边（函数位置）放 f：条件区声明 f : A → B，说明 f 是一台接收 A、返回 B 的机器，符合“函数位置”的要求。
2. 右边（参数位置）放 x：条件区声明 x : A，恰好是机器 f 说明书里要求吃的原料类型！
3. 合起来的结果：通过应用积木把 x 喂给 f，整块 f x 的结果类型就自动变成了 B，正好命中本关目标。

可以分别点击画布上的 f、x 和外层的应用积木，观察下方的类型反馈怎样从 A → B 和 A 一步步变成 B。记住这个非常实用的思考习惯：当你手里没有目标类型 B 时，先去找找看有没有哪台函数能产出 B；找到它之后，它的输入类型就会告诉你下一步该去寻找什么材料！`,
    en: `The reference answer is the application f x—meaning “pass x to f”. Let's check both slots of the application block:

1. Left slot (function): holds f. From f : A → B in the context, f is a machine expecting an A and returning a B.
2. Right slot (argument): holds x. From x : A, x matches the exact input type that f requires.
3. Combined result: applying f to x yields a term of type B, matching the goal!

Click f, x, and the enclosing application block on the canvas to watch the type feedback move from A → B and A to B. This also teaches a handy problem-solving habit: when you don't already have an object of your target type, look for a function that produces it—its input type immediately tells you what ingredient to find next!`
  },
  L7: {
    'zh-CN': `冒号右边的答案槽里填的是 B a——一块用应用积木把类型族 B 和参数 a 组合起来的类型表达式！为什么这里要填写一个“应用”呢？

1. 先看 B 的类型：B : A → Type 0，说明 B 是一台“吃进一个 A，吐出一个具体类型”的类型族机器。
2. 再看 f 的类型：f : Π (x : A) → B x，说明当你把任意参数 x 交给 f 时，返回值的类型会跟着变成 B x。
3. 代入实际参数 a：题目左边的给定项 f a 把具体参数 a 喂给了 f，所以返回值类型里的 x 也要同步替换成 a，得到具体类型 B a！

为什么不能只填一个单独的 B？因为单独的 B 还是一台没收到参数的类型族（类型为 A → Type 0），只有用应用积木把 a 传给它，得到的 B a 才真正是一个具体类型（Type 0）。对比冒号两边：左边的 f a 是项层面的应用，右边的 B a 是类型层面的应用，参数不仅参与计算，也参与决定结果的类型！`,
    en: `The missing type on the right of the colon is B a—built with an application block combining the type family B and the argument a! Let's trace why:

1. Check B's declaration: B : A → Type 0 means B is a type family that takes an A and returns a concrete type.
2. Check f's dependent type: f : Π (x : A) → B x means the return type depends on whichever argument x is passed to f.
3. Substitute the actual argument a: in the given term f a on the left, f is applied to a, so replacing x with a in B x tells us that f a has type B a!

Why isn't bare B enough? Alone, B is still a family waiting for an input (with type A → Type 0). Applying B to a produces the concrete type B a (in Type 0). Compare both sides of the colon: f a is application at the term level, and B a is application at the type level—the argument shapes both the value and its type!`
  },
  L8: {
    'zh-CN': `答案槽里躺着一颗五角星 ★，完整的判断是 Γ ∅ ⊢ ★ : 1。即使条件清单空空如也（∅），我们也能直接构造出单元类型的标准值：

1. 题目要求：冒号右边写着目标类型 1，要求左边填入一个属于类型 1 的项。
2. 单元类型的引入规则：单元类型自带了规范元素 ★，并且规定 ★ : 1，所以把 ★ 拖进答案槽就能直接通过检查。
3. 别和积木 1 搞混：工具箱里的“1”表示单元类型本身（它自己的类型是 Type 0），相当于盒子的标签；“★”才是真正住在盒子里的物品。

顺便一提，“只有一个规范构造值”并不代表类型为 1 的表达式只有 ★ 一种写法——以后我们也能写出更复杂的函数调用，经过计算后同样归约成 ★。记住这对好搭档：1 是类型，★ 是它的标准元素！`,
    en: `Inside the answer slot sits a single star ★, completing the judgment Γ ∅ ⊢ ★ : 1. Even with an empty context (∅), the unit type lets us construct a canonical value right away:

1. Check the goal: the right side of the colon is 1, asking for an element belonging to the unit type.
2. Unit introduction rule: ★ : 1 is built into the unit type, so placing ★ in the answer slot satisfies the judgment immediately.
3. Don't mix up 1 and ★: the block 1 is the type itself (which has type Type 0, like a box label), whereas ★ is the item inside it (with type 1).

Note that having one canonical constructor doesn't mean ★ is the only expression of type 1—later, function applications can also compute down to ★. Remember the pair: 1 is the type, and ★ is its canonical element!`
  },
  journey_pair: {
    'zh-CN': `参考答案是 ⟨a, b⟩。通过配对积木，我们把两件相互关联的材料装进了同一个依赖序对里：

1. 目标类型是 Σ (x : A) × B x，它规定第一格（x）必须具有类型 A。条件区里的 a : A 正好符合这个要求，所以我们把 a 放进第一格。
2. 一旦第一格确定放进了 a，第二格要求的类型 B x 就随之代入变成 B a！
3. 条件区里恰好准备了 b : B a，刚好严丝合缝地满足第二格的要求，于是 ⟨a, b⟩ 就构造完成了！

这就是“依赖序对”的精妙之处：第二格的类型不是一成不变的，而是跟着第一格填进去的值同步变化。检查器也确实会先核对第一格，再把第一格的值代入第二格的类型去做检验。如果第二格类型始终固定（不依赖第一格），那就是常见的普通积类型 A × B 啦。`,
    en: `The reference answer is ⟨a, b⟩, packaging two related pieces of data into one dependent pair:

1. The goal Σ (x : A) × B x requires the first slot (named x) to have type A, and a : A from the context fits.
2. Once a is placed in the first slot, the required type B x for the second slot automatically specializes to B a!
3. The supplied b : B a matches that requirement, completing the pair ⟨a, b⟩.

That substitution is what makes the pair “dependent”: the second component's type depends on the actual value placed in the first slot. The checker verifies the first component first, then substitutes it before checking the second component. When the second type stays fixed regardless of the first value, we get the simpler ordinary product A × B.`
  },
  L13: {
    'zh-CN': `最后空着的分支出口填入了 a，完整答案是 with_pair A B p (λa. λb. a)。因为包裹 p 已经现成放在 Γ 里了，这关就省去了外层接收包裹的 λ，让你专心体验“拆开包裹挑材料”：

1. with_pair 把包裹打开：它拿着规格 A、B 和包裹 p，把拆出的两件物品交给了分支“λa. λb. ?”，使分支内同时拥有 a : A 和 b : B a。
2. 挑出符合目标的那一件：题目要求返回一个 A。桌上的 a 类型恰好是 A，所以直接把 a 交出去！至于另一件 b : B a，留着不用完全合法——函数和证明从来没有要求“把每份材料都用光”。
3. 右键卡片看看幕后：右键点击 with_pair 选择“查看类型与构造…”，你会看见它内部其实只用了一句 ind_sigma A B p (λ_. A) step——其中目标族 λ_. A 声明“不管拆开谁，最终都交出 A”，而 step 就是你刚刚补好的分支 λa. λb. a。

“命名卡片”把固定的接线收进了一个小盒子，底层的拆包原理依然全是由你已经学过的积木搭出来的！`,
    en: `The missing branch slot is filled with a, completing with_pair A B p (λa. λb. a). Because Γ already supplies the pair p, this puzzle skips the outer λ so you can focus directly on choosing from the unpacked pieces:

1. with_pair opens the package: using the types A and B along with p, it hands the two unpacked components to the branch “λa. λb. ?”, bringing a : A and b : B a into scope.
2. Pick the matching component: the goal asks for an A, and a : A fits! Leaving b : B a unused is completely valid—nothing requires using every available item.
3. Peek inside with_pair: right-click with_pair and select “View type and construction…” to see ind_sigma A B p (λ_. A) step inside—where the constant motive λ_. A promises an A for every pair, and step is the branch λa. λb. a you just completed.

Named theorem cards tidy up fixed wiring without hiding any new rules—everything inside is built from ordinary blocks!`
  },
  journey_nat: {
    'zh-CN': `参考答案是 suc 0，也就是自然数 1。画布上已经固定了外层的 suc，我们往它的输入槽放入起点 0，就完成了一次“往前迈一步”：

1. 0 : ℕ 是自然数的起点构造值。
2. suc 接收任何自然数，并产出它的下一个自然数（后继）；既然 0 属于 ℕ，suc 0 自然也属于 ℕ！
3. 把 0 放进 suc 里，目标类型 ℕ 就顺利通过检查啦。

如果再往外多套一层 suc，就得到 suc (suc 0)（即 2），继续套下去就能搭出 3、4……（其实只要输入任意合法的自然数表达式，检查都会通过，参考答案只是选择了最简洁的一步）。这种构造方式让每个自然数自带“出生履历”，下一关的递归就要顺着这层层台阶来自动工作！`,
    en: `The reference answer is suc 0—the natural number 1. With the outer suc already placed on the canvas, inserting the starting point 0 completes one step forward:

1. 0 : ℕ is the starting constructor for natural numbers.
2. suc takes any natural number and constructs its successor, so since 0 has type ℕ, suc 0 also has type ℕ!
3. Plugging 0 into suc satisfies the goal ℕ.

Wrapping another suc around it gives suc (suc 0) (which is 2), and stacking more builds 3, 4, and beyond (any valid natural number in the slot passes checking; the reference answer picks the simplest step). Because every number records its own step-by-step construction, recursion in the next level can follow those steps automatically!`
  },
  journey_double: {
    'zh-CN': `后继分支里填入的是 suc (suc ih)，完整答案写成 repeat_nat n 0 (λk. λih. suc (suc ih))。因为待处理的数字 n 已经在 Γ 里了，这关直接算出它的结果，不用先在外面套一层 λn。

让我们顺着接力过程走一遍：
1. 起点（0 分支）：输入是 0 时没有任何台阶，结果直接从 0 起步（2 × 0 = 0）。
2. 接力（λk. λih. ?）：k 是前一个数，ih 是机器对 k 算出来的“前一步答案”（即 2 × k）。输入每次增加 1，翻倍的结果就要增加 2，所以对 ih 连续套两层 suc，得到 suc (suc ih)！
3. 举个例子看看：当 n = 2（即 suc (suc 0)）时，从起点 0 出发，第一步算出 2，第二步接力算出 4，刚好就是两倍！

右键点击 repeat_nat 选择“查看类型与构造…”，就能看到它内部是用 ind_nat 搭出来的、且把返回类型固定为 ℕ 的普通表达式。以后只要在外面再包一层 λn、把类型写成 ℕ → ℕ，它就能变成一张属于你自己的翻倍函数卡片啦！（注：本关检查核对的是自然数类型，因此其他同样返回 ℕ 的步骤也可通过；suc (suc ih) 示范的则是准确的翻倍计算。）`,
    en: `The missing successor step is suc (suc ih), completing repeat_nat n 0 (λk. λih. suc (suc ih)). Since n is already in Γ, this puzzle computes the result for n directly without wrapping an outer λn.

Let's trace the relay step by step:
1. Starting point (at 0): with zero steps, the answer starts at 0 (since twice 0 is 0).
2. Relay step (λk. λih. ?): k is the previous number, and ih is the machine's already-computed answer for k (twice k). Increasing the input by 1 increases its double by 2, so we apply suc twice to ih: suc (suc ih)!
3. Try n = 2 (suc (suc 0)): starting from 0, the first step produces 2, and the second step produces 4—exactly double!

Right-click repeat_nat (“View type and construction…”) to see ind_nat inside with a constant ℕ motive. Wrap λn around this expression with type ℕ → ℕ anytime you want a reusable doubling function! (Note: checking verifies the ℕ type, so other well-typed steps can pass while suc (suc ih) demonstrates exact doubling.)`
  },
  L15: {
    'zh-CN': `答案槽里只有一块干脆的 refl，代表“自反性（Reflexivity）”——自己一定等于自己。

为什么连任何参数都不需要给 refl 填，直接拖进去就能证明 Id A a a 呢？
1. 双向类型检查的功劳：题目已经在冒号右边规定好了目标类型 Id A a a（在类型 A 中，比较左边 a 和右边 a）。检查器检验 refl 时，会自动去核对左右两端是否相等！
2. 区分对象、命题与证明：a 是被比较的“对象”，Id A a a 是写出“a = a”的“命题类型”，而 refl 才是这个等式成立的“证明项”。题目要的是证明项，当然放 refl！

一个小预告：refl 的本领比看起来还要大——只要等式两边在“计算之后”会变成同一个表达式（比如 2 + 2 算出来就是 4），检查器也都能直接用 refl 通过！而在下一关里，我们就要拿着相等证明去办一件超酷的事：跨类型搬运数据！`,
    en: `The reference answer is just a single block: refl (short for “reflexivity”—everything equals itself).

Why doesn't refl need any slots filled to prove Id A a a?
1. Bidirectional checking handles it: the goal type Id A a a on the right of the colon tells the checker which type A and endpoints a, a are being compared, so checking refl automatically verifies that both sides match!
2. Object vs. proposition vs. proof: a is the object being compared, Id A a a is the equality proposition (a type), and refl is the proof term inhabiting it.

One neat bonus: refl isn't limited to expressions that look identical character-for-character—whenever both sides compute to the same result (like 2 + 2 and 4), refl proves them equal too! Next, we'll put an equality proof to work transporting data between types.`
  },
  L19: {
    'zh-CN': `最后一个材料槽里填入了 b，完整答案是 transport A B x y p b。原本住在房间 B x 里的 b，经过相等桥梁 p : Id A x y 的搬运，稳稳变成了属于 B y 的结果！

这里三个核心角色各司其职，类型不同、绝对不能调换：
1. B（类型族）：指明地图上每一个位置 w 对应着哪个房间类型 B w；
2. p（桥梁）：提供“x 与 y 相等”的证据 Id A x y；
3. b（起点货物）：真正要被运过去的实物，类型为 B x。

好奇 transport 卡片里面藏着什么吗？右键选择“查看类型与构造…”，你会看到它展开成：J A x (λw. λq. B w) b y p。其中的目标族 λw. λq. B w 规定“到了任意位置 w，就要交出一个 B w”；而当终点刚好停在起点 x、相等证据是 refl 时，起点处的 b 就已经够用了！等式消去子 J 正是把“起点 x 处已有的材料 b”沿着任意相等证明 p 推广到终点 y，从而安全地交出 B y。`,
    en: `The final cargo slot is filled with b, completing transport A B x y p b. Starting from b : B x, the equality bridge p : Id A x y carries it safely into B y!

Three distinct roles work together here—each has its own type and cannot be swapped:
1. B (the type family): specifies which room type B w belongs at each location w;
2. p (the bridge): supplies evidence Id A x y that x and y are equal;
3. b (the starting cargo): the actual item of type B x to be carried across.

Right-click transport and choose “View type and construction…” to peek inside: you will see J A x (λw. λq. B w) b y p. Its motive λw. λq. B w asks for an item of B w at any destination w; in the base case where the destination is still x with proof refl, the starting item b already fits! The equality eliminator J extends that base construction along the bridge p to yield a term in B y.`
  },
  journey_induction: {
    'zh-CN': `最后的证据槽里填入了 ih，完成后的式子是 suc_cong (add k 0) k ih！让我们一步步看清这条“归纳接力”是如何精准命中目标的：

1. 接力棒 ih 在手里：条件区 Γ 里的 ih : Id ℕ (add k 0) k 是一份已经证明好的证据，保证 add k 0 = k。
2. 助手 suc_cong 来推进：suc_cong 接收两个数（add k 0 和 k）以及它们相等的证明 ih，接着把等号两边同时套上一层 suc，产出 Id ℕ (suc (add k 0)) (suc k)！
3. 为什么和目标 add (suc k) 0 = suc k 对得上？因为加法 add 是按第一个参数递归定义的，遇到 suc k 时会自动展开计算：add (suc k) 0 ≡ suc (add k 0)。类型检查器算完这一步后，立刻认出两边是同一个等式目标！

这正是完整定理 add_zero 的后继一步！右键点击卡片库里的 add_zero（选择“查看类型与构造…”），就能看到整份证明如何用 refl 搞定起点 0（因为 add 0 0 ≡ 0），再用 ind_nat 把你刚才这一招反复接力到所有自然数上；顺便还可以右键 suc_cong 查看“相等两边同取后继”的证明。它们全都是由最基础的积木搭成、经过严格检查且不依赖任何额外公理的真正证明！`,
    en: `The missing evidence slot is filled with ih, completing suc_cong (add k 0) k ih! Let's trace how this induction relay hits the target:

1. Hold the baton ih: in Γ, ih : Id ℕ (add k 0) k is already proved, guaranteeing add k 0 = k.
2. Advance with suc_cong: given the two numbers (add k 0 and k) and their equality proof ih, suc_cong applies suc to both sides, producing Id ℕ (suc (add k 0)) (suc k)!
3. Why does that match the goal add (suc k) 0 = suc k? Because add recurses on its first argument, it computes add (suc k) 0 ≡ suc (add k 0). The checker performs that computation and sees the exact same equality target!

You just built the inductive step of the full theorem add_zero! Right-click add_zero in the card shelf (“View type and construction…”) to see how refl proves the base case 0 (since add 0 0 ≡ 0) and ind_nat chains this exact relay step across every natural number—and right-click suc_cong to see how successor-congruence is proved too. Every piece is genuinely checked from ordinary blocks with zero hidden axioms!`
  },
  L2: {
    'zh-CN': `参考答案是 λy. x。仔细看：这个函数的参数叫 y，函数体里却忽略了它，直接返回了 x！为什么这样完全合法呢？

1. 先满足函数外形：目标 B → A 要求一台“接收 B、返回 A”的机器。所以最外层放一块 λ 引入参数 y，检查器根据目标自动确定 y : B。
2. 看看作用域里有什么：进到 λ 函数体后，当前需要交出一个类型为 A 的项。此时视野里有两份材料：刚收到的内层参数 y : B（类型不对），以及外层条件区里一直都在的 x : A（类型正好符合！）。
3. 返回外层材料：函数从来没有义务非得用上自己的输入，直接返回外层的 x 就组成了常函数 λy. x（“不管投给我什么 B，我永远只交回那个 x”）。

记住这两个要点：作用域是可以嵌套的，内层看得到外层；挑选变量永远看“类型是否匹配目标”，而不是看谁是最新声明的。`,
    en: `The reference answer is λy. x. Notice that the function accepts a parameter named y, ignores it, and returns x! Let's see why that works cleanly:

1. Match the function shape: the goal B → A calls for a λ taking a B, so the checker automatically gives the new parameter y type B.
2. Check what is in scope: inside the λ body, you need an A. Two variables are visible—the inner y : B (wrong type) and the outer x : A from the context (right type!).
3. Return the outer variable: a function is never required to use its input. Returning x gives the constant function λy. x—“no matter which B arrives, I always return x.”

Keep both lessons in mind: scopes nest so outer declarations stay visible inside inner bodies, and choosing a variable is always about matching the required type!`
  },
  L5: {
    'zh-CN': `看看画布上的答案：只有一块应用积木 f x，连 λ 都没用！为什么只喂一个参数就已经满足目标 B → C 了呢？

1. 读懂右结合的箭头：f 的类型是 A → B → C，展开括号就是 A → (B → C)。它表示“先吃一个 A，就会吐出一台 B → C 的函数”。
2. 观察一次应用的结果：手头的 x 恰好具有类型 A。用应用积木把 x 喂给 f 后，消耗掉了第一段箭头 A → ...，于是 f x 的类型正好就成了 B → C！
3. 直接作为答案提交：既然 f x 本身就已经是题目要的 B → C 函数，就不用画蛇添足再去包一层 λ 了。

这种“先交出一部分参数、把剩下的计算留成一台新函数”的做法，就是“部分应用（Partial Application）”。它和下一关要学的“柯里化”是一对好兄弟：柯里化研究怎样把“接收序对”的接口改造成“分步收参数”；本关则练习直接使用这种分步接收参数的函数！`,
    en: `Look at the completed answer: just a single application block f x, with no λ needed! Why is one application already enough for the goal B → C?

1. Group arrows to the right: f has type A → B → C, which means A → (B → C)—it takes an A and returns a function of type B → C.
2. Apply f once: feeding x : A to f uses up the first input, so the resulting expression f x already has type B → C!
3. Submit it directly: because f x is already the exact function type requested by the goal, wrapping it in an extra λ would be unnecessary.

Supplying only part of a function's arguments to obtain a remaining function is called “partial application”. It pairs closely with currying: currying converts a paired-input interface into successive inputs, while this level practices using a function that already takes inputs one at a time!`
  },
  function_compose: {
    'zh-CN': `答案是 λx. g (f x)，也就是“先走 f、再走 g”的复合函数。让我们顺着积木嵌套的顺序读一遍：

1. 外层 λ 引入输入 x : A，为新机器接住原材料。
2. 内层应用 f x：把 x 喂给 f : A → B，产出一个类型为 B 的半成品。
3. 外层应用 g (f x)：把刚才算出的半成品 f x 当作参数，放进 g : B → C 的右边参数槽里，最终产出类型为 C 的成品！
4. 于是整台机器实现了从 A 到 C 的转换，符合目标 A → C。

这里的小窍门是“倒着从目标往回找”：想要 C？去找能产出 C 的 g；g 需要 B？再去找能产出 B 的 f；f 需要 A？正好把最外层 λ 接住的 x 递给它！注意 g 并没有直接碰到 x，它吃到的是 f 加工后的结果。`,
    en: `The answer is λx. g (f x), the composition of f followed by g. Let's trace the pipeline from inside out:

1. The outer λ receives the input x : A.
2. The inner application f x feeds x to f : A → B, producing an intermediate result of type B.
3. The outer application g (f x) places that intermediate B into the argument slot of g : B → C, yielding a final result of type C!
4. Thus the whole function transforms an A into a C, matching A → C.

You can also plan backward from the goal: need a C? Use g. g needs a B? Use f. f needs an A? Pass the x bound by the outer λ! Notice that g never touches x directly—it processes the output produced by f.`
  },
  function_curry: {
    'zh-CN': `参考答案是 λa. λb. h ⟨a, b⟩。我们没有改变 h 原本的工作方式，只是在外面替它加了一层接口适配器：

1. 第一层 λ 接收 a : A：目标 A → B → C 还有剩余的 B → C，因此需要再套一层 λ。
2. 第二层 λ 接收 b : B：进入最内层函数体时，剩余目标已经变成 C，而且 a 和 b 都同时在作用域内可见！
3. 打包交给 h：因为老机器 h : (A × B) → C 只认一个完整的序对，我们用配对积木把 a 和 b 装成 ⟨a, b⟩ : A × B，再用应用积木喂给 h，最终得到目标 C！

站在外面看，这台新机器可以分两次依次接收 A 和 B；但走到里面，它还是老老实实把两样东西打成包交给原来的 h。把“收一个序对”改造成“分步收两个参数”，正是“柯里化（Currying）”的本来面目！`,
    en: `The reference answer is λa. λb. h ⟨a, b⟩. Without changing how h works internally, we wrapped a neat adapter around it:

1. First λ receives a : A, leaving the remaining goal B → C, which calls for a second λ.
2. Second λ receives b : B. Inside the innermost body, the goal is now C, and both a and b are in scope together!
3. Pack and pass to h: because h : (A × B) → C expects a single pair, we bundle a and b with a pair block as ⟨a, b⟩ : A × B and apply h to it, producing C!

From the outside, the new machine accepts A and B one after another; on the inside, it packages them into the pair that h expects. Turning a single paired-input function into a sequence of single-argument functions is “currying”!`
  },
  dependent_constant: {
    'zh-CN': `答案是 λ_. A。这里的下划线 _ 表示“我不打算在函数体里用到这个参数”，就算换成 x 或其他合法名字，功能也完全一样。

让我们看看为什么“返回类型本身”也能这么写：
1. 目标是 A → Type 0，说明要先接收一个 A 类型的输入，所以最外层放一块 λ。
2. 走进函数体后，目标变成了 Type 0——这次它要的不是属于 A 的某个对象，而是一个“住在 Type 0 里的类型”！
3. 条件区给的 A : Type 0 恰好就是一个合法的类型，直接把 A 返回出去，就得到“无论输入谁，永远返回类型 A”的常量类型族。

把它和主线的恒等函数 λx. x 放在一起对比特别有意思：恒等函数返回收到的项，常量类型族返回固定的类型；两者用的都是同一块 λ 积木，只是目标类型引导我们交出了不同角色的东西。这也说明“类型族”并没有什么神秘语法，它就是返回类型为 Type 0 的普通函数！`,
    en: `The answer is λ_. A. The underscore _ simply marks an unused parameter—renaming it to x or any valid name behaves identically.

Let's see why a function can return a type just as easily as a value:
1. The goal A → Type 0 asks for a λ that receives an input of type A.
2. Inside the body, the expected result type is Type 0—asking for a TYPE living in Type 0, rather than an element inside A!
3. The context declaration A : Type 0 provides such a type, so returning A gives a constant type family that yields A for every input.

Compare λ_. A with the identity λx. x: one returns its received term, while the other returns a fixed type. Both use ordinary λ blocks, guided by their different goal types—showing that a “type family” is simply an ordinary function whose return type is Type 0!`
  },
  dependent_pi: {
    'zh-CN': `冒号右边的答案槽里拼出了一整张 Π 类型：Π (x : A) → B x。这次由你自己组装出了函数 f 所承诺的“依赖接口”！

我们逐个位置核对一下这张 Π 卡片：
1. 输入类型槽填 A：说明这台函数接收类型为 A 的参数（这里起名为 x）。
2. Π 绑定的参数进入作用域：参数 x 虽然写在箭头左边，但它在箭头右边的“结果类型”槽位里是可见的！
3. 结果类型槽填 B x：用应用积木把类型族 B : A → Type 0 应用于刚才那个新参数 x，就能表达“当输入是 x 时，输出必须具有类型 B x”。

记住 Π 和 λ 的分工：Π 用来写“函数的类型（接口说明书）”，λ 用来写“函数的实现（机器内部怎么算）”；本关空槽在冒号右边，所以要填 Π。顺便一提，参数名不一定要叫 x，只要右边引用的确实是这张 Π 卡片自己绑定的那个参数，把名字统一换成 y 也表达完全相同的依赖类型！`,
    en: `In the type slot on the right of the colon, the answer is the dependent function type Π (x : A) → B x—the exact interface promised by f!

Let's check every slot of the Π block:
1. Input-type slot gets A: specifies that the parameter (named x here) has type A.
2. Scope inside Π: the bound parameter x becomes visible inside the result-type slot to the right of the arrow!
3. Result-type slot gets B x: applying the type family B : A → Type 0 to that bound x expresses “for input x, the output must have type B x.”

Remember the roles of Π and λ: Π writes a function's TYPE (its specification), while λ builds a function TERM (its implementation). Because the empty slot is on the right of the colon, it needs Π. Note too that the parameter doesn't have to be called x—renaming both occurrences consistently to y defines the very same type, as long as the result refers to the parameter bound by this Π!`
  },
  L17: {
    'zh-CN': `答案是 λA. λx. x——把“类型”也当成第一个参数收进来的多态恒等函数！看看两层 λ 是怎样步步兑现目标 Π (A : Type 0) → A → A 的：

1. 外层 λ 接收类型 A : Type 0：收下类型 A 后，剩下的目标变成了 A → A——注意这里的 A 已经不再是固定某个字母，而是刚刚收进来的那个具体类型参数！
2. 第二层 λ 接收项 x : A：既然已经知道了这次处理的是类型 A，检查器就自动确定第二个参数 x 的类型正是 A。
3. 直接返回 x：既然要求交出一个 A，把刚收到的 x 原封不动交还即可！

体会一下两层矢量的区别：外层 Π 是“依赖的”，因为后面的整个类型 A → A 都引用了第一参数 A；而内层 A → A 的返回类型不再依赖具体传进来的 x，所以简写成普通箭头。整道题依然只用了最基础的 λ 与变量引用——让已有积木也能直接接收、返回类型，正是依赖类型强大表达力的源泉！`,
    en: `The answer is λA. λx. x—the polymorphic identity function that accepts a type as its first argument! Let's trace how the two λ layers fulfill Π (A : Type 0) → A → A:

1. Outer λ receives the type A : Type 0: once A is bound, the remaining goal becomes A → A, referring directly to whichever type A was passed in!
2. Inner λ receives x : A: knowing the first argument is A, the checker assigns the second parameter x type A.
3. Return x: inside the innermost body, x : A matches the expected result type A, completing the function!

Notice the contrast between the two levels: the outer Π is dependent because the rest of the type A → A mentions A, whereas the inner arrow A → A does not depend on the specific element x. Only ordinary λs and variables were needed—letting the same building blocks operate on types as well as values is where dependent type theory gets its power!`
  },
};
