// Short journey lessons introduce one idea; optional workshops unpack the details.
export const JOURNEY_GUIDES = {
  L0: {
    'zh-CN': `欢迎来到积木工坊！先不用被一堆数学名词吓到，我们从一个最简单的小问题开始：如果手头已经有一件现成的东西，怎样把它交给题目？

看看画布上的紫色卡片，它叫作一张“判断（Judgment）”，我们可以像读句子一样从上往下读它：
1. 顶部左上角的符号“Γ”（大写希腊字母，读作 Gamma）代表“上下文（Context）”，也就是你的“已知条件 / 材料清单”。紧跟在 Γ 后面的声明用逗号隔开，冒号“:”读作“属于”或“具有类型”——你可以把“类型”想成分类标签（比如“水果”），把“项”想成贴着这个标签的具体物品（比如一颗苹果）。因此，A : Type 0 表示“A 是一个类型”，x : A 表示“我们手头已经有了一个名叫 x 的项，它属于类型 A”。
2. 下方的符号“⊢”（读作“在这些条件下”）把条件和目标连起来。后面的“? : A”表示：冒号右边规定了目标类型是 A，冒号左边留了一个空槽，等你放入一个真正属于 A 的项。

去左侧材料区找找看吧！请分清“类型标签 A”和“属于该类型的具体对象 x”，谁才是这里真正需要交上去的那一个？`,
    en: `Welcome to the block workshop! No need to memorize heavy jargon right away—let's start with a simple question: how do you hand the puzzle something you already have?

The purple card on the canvas is called a “judgment”. We can read it from top to bottom like a sentence:
1. At the top-left, the symbol “Γ” (the capital Greek letter Gamma) stands for the “context”—your list of given assumptions and available materials. The declarations after Γ are separated by commas, and the colon “:” means “has type” or “belongs to”. Think of a type as a category label (like “Fruit”) and a term as a concrete item carrying that label (like an apple). So A : Type 0 says “A is a type”, and x : A says “you already have a term named x of type A”.
2. Below that, the turnstile symbol “⊢” reads “under these conditions…”. After ⊢, “? : A” fixes the required type A on the right of the colon and leaves an empty term slot on the left.

Check the materials on the left! Be careful to distinguish the category label A from an actual item x inside it—which one belongs in the slot?`
  },
  L1: {
    'zh-CN': `这一关材料清单里只声明了类型 A : Type 0，手头却连一个 A 类型的具体对象都没有！先别急着说“无米难炊”，抬头看看冒号右边的目标类型：A → A。

什么是 A → A？它代表一种“函数类型”。你可以把函数想象成一台加工机器，或者一份约定：“只要以后有人交给我一个 A 类型的输入，我就能产出一个 A 类型的输出。”既然现在手里没有现成的 A，题目其实是让你造出这样一台“收 A 还 A”的机器！

造机器的工具，就是左侧工具箱里的 λ（读作 Lambda）积木。λ 的意思是：“假设我收到了一个输入，我先给它起个名字，再决定函数体里怎么算出结果。”当你把 λ 放进答案槽后，类型检查器就会顺着目标 A → A，自动确定这个参数的类型正是 A。

不过要记住一条很关键的规则——“作用域（Scope）”：由 λ 创造出来的参数名字，只能在这台 λ 机器的内部（函数体里）使用，跑出机器外面就看不见了。你可以从左侧局部变量区拖出它的引用，或者把鼠标悬停在参数名字上直接取用。想一想：拿到一个 A 后，最省力地交还一个 A 的方式是什么？`,
    en: `In this puzzle, the context only declares the type A : Type 0 and gives you no ready-made elements of A! Before thinking you have nothing to work with, look at the target type after the colon: A → A.

What is A → A? It is a “function type”. Think of a function as a processing machine or a promise: “Whenever someone gives me an input of type A in the future, I will return an output of type A.” Even without an A in hand right now, you can build that machine!

The tool for building a function is the λ (lambda) block in the toolbox. A λ says: “Suppose I receive an input; let me give it a name and describe what my body returns.” Once you place λ in the answer slot, the goal A → A tells the checker that its parameter has type A.

Keep one golden rule in mind—called “scope”: the parameter bound by λ exists only inside that λ's body. You can grab a reference to it from the local-variable shelf on the left, or hover over the parameter name. Now that your machine has received an A and needs to return an A, what is the simplest thing its body can output?`
  },
  L3: {
    'zh-CN': `上一关我们学会了用 λ 自己“制造”函数机器；这一关正好反过来，我们来学习如何“启动”一台已经造好的函数机器！

先读读 Γ 后面的材料清单：
• f : A → B —— 一台现成的加工机器 f。它的类型说明书写得很清楚：给我一份 A 类型的原料，我就吐出一份 B 类型的成品。
• x : A —— 这恰好就是一份 A 类型的原料！
再看下方的目标：我们需要交出一个 B 类型的项。手里虽然没有现成的 B，但既有能生产 B 的机器，又有它正等着吃的原料，把它们接起来不就行了吗？

在类型论中，把参数喂给函数的动作叫作“函数应用（Application）”，要用左侧的“应用”积木来完成。它有两个插槽，分工截然不同：左边放要调用的“函数”，右边放交给它的“参数”。只有把函数和参数真正拼进应用积木里（光把两块积木并排放在画布上可不会发生反应哦！），检查器才会核对参数类型是否符合机器要求。

留意左右顺序：谁负责加工，谁是被加工的材料？放反了可就通不过检查啦。`,
    en: `In the last level you built a new function machine with λ. Here, let's do the reverse: run a machine that has already been built for you!

Read the materials listed after Γ:
• f : A → B — a ready-made function machine named f. Its type tells you its rule: feed it an input of type A, and it produces an output of type B.
• x : A — an object of type A, matching the exact input f is waiting for!
Meanwhile, the target asks for a term of type B. You don't have a B directly, but you do have a machine that makes B and the exact ingredient it needs.

In type theory, feeding an argument to a function is called “function application”, done with the application block on the left. It has two slots with distinct roles: the left slot holds the function, and the right slot holds its argument. Simply placing two blocks side by side on the canvas does nothing—you must connect them inside an application block so the checker can verify that the argument fits.

Pay attention to the order: which block is the machine, and which is its input?`
  },
  L7: {
    'zh-CN': `咦？有没有发现这一关的判断卡反过来了？以前都是冒号右边写好类型、左边留空让你造项；这回冒号左边的项 f a 已经锁好了，空槽跑到了冒号右边！现在请你扮演一小会儿“类型检查器”——推断出 f a 究竟是什么类型。

这关还将带你见识类型论最强大的超能力——“依赖类型（Dependent Types）”。看看条件区里的两个新搭档：
1. B : A → Type 0 —— 它也是一台函数机器，只不过输入一个 A 之后，吐出来的不是普通物品，而是一个“类型”！所以我们叫它“类型族（Type Family）”，就像一台按订单定制分类标签的小机器。
2. f : Π (x : A) → B x —— 注意看箭头右边写着 B x，里面用到了输入参数的名字 x！这说明 f 是一台“依赖函数”：你传入不同的具体参数，它返回的结果类型也会跟着把 x 替换成那个参数！

现在左边的项 f a 已经把具体参数 a 喂给了 f。想一想：结果类型 B x 里的 x 会被谁顶替？另外要注意，单独的 B 只是一台还没吃参数的“类型族机器”，要想得到具体类型，别忘了应用积木同样可以把“类型族”和“它的参数”组合起来哦！`,
    en: `Notice how the judgment card has flipped! In earlier puzzles, the type on the right of “:” was fixed and you built a term on the left. Here, the term f a on the left is already locked in place, while the empty slot sits on the right—your turn to play type checker and infer the type of f a!

This level introduces the superpower of MLTT: “Dependent Types”. Look at the two declarations in the context:
1. B : A → Type 0 — a function whose return value is itself a type! We call B a “type family”: give it an input of type A, and it produces a custom type for that input.
2. f : Π (x : A) → B x — notice how the result type B x mentions the input variable x! That makes f a “dependent function”: whatever concrete argument you pass into f gets substituted for x in its return type.

In the given expression f a, the function f receives the specific argument a. What should replace x in the result type? Remember: bare B is still a family waiting for an input—and application blocks work on type families and their arguments too!`
  },
  L8: {
    'zh-CN': `接下来我们认识类型论世界里最娇小的基础类型——“单元类型（Unit Type）”，记作数字 1。

什么是单元类型 1？你可以把它想象成一个只装了一颗纪念星的小盒子：盒子外面的分类标签叫作“1”，而盒子里面有且仅有的一枚标准物品（称作“规范元素”）叫作“★”。在编程里，它就像不携带额外信息的空结果；在逻辑里，它代表不证自明的“真”。

再读一眼画布上的判断卡：Γ 后面跟着一个符号“∅”，表示“空上下文”——也就是说，这一关没有任何额外假设或现成变量。你可能会奇怪：“条件区空空的，我拿什么来交差呢？”别忘了，单元类型 1 自带了构造元素的方法（引入规则：★ : 1）！

左侧工具箱里同时摆着“1”和“★”两块积木。千万看清冒号两边谁是谁：题目要的是“装在盒子里的那颗星（项）”，还是“盒子本身的标签（类型）”？`,
    en: `Now let's meet the tiniest data type in MLTT: the “Unit Type”, written 1.

Think of the unit type 1 as a miniature box containing a single canonical badge: the label on the box is the type 1, while the sole item inside it is the star ★. In programming, 1 behaves like a trivial result carrying no extra data; in logic, it stands for a self-evident truth.

Look at the top of the judgment card: the symbol “∅” right after Γ means the context is empty—you have no extra assumptions or pre-made variables this time. How can you build anything from an empty context? Because the unit type comes with its own built-in constructor (its introduction rule: ★ : 1)!

Both 1 and ★ appear in the toolbox on the left. Check which side of the colon is empty: is the puzzle asking for the box's label (a type) or the badge inside it (a term)?`
  },
  journey_pair: {
    'zh-CN': `前面每张卡片都只交出一个孤零零的值；如果想把“两件有关系的东西”一起打包交出去，就要请出“序对（Pair）”啦！序对就像一个双格收纳盒，先装好第一格，再装好第二格，合起来就是一份完整的数据。

仔细读读本关的目标类型：Σ (x : A) × B x（读作“依赖对类型”）。它对两个格子分别提出了要求：
• 第一格（x）必须装一个类型为 A 的项；
• 第二格必须装一个类型为 B x 的项——注意这里写着 x！也就是说，第二格里究竟允许装什么类型，会跟着第一格具体选了谁而变化！

再看看条件区给你备好的材料：a : A 和 b : B a。先想清楚第一格准备放进谁，再顺着类型里的 x 推算一下，第二格要求的类型 B x 会变成谁？

本关不需要你凭空制造新东西，只要从左侧找到合适的配对积木 ⟨ , ⟩，按目标规定的先后顺序把两件材料放进对应的格子里就行。`,
    en: `So far every puzzle has asked for a single item. What if you want to bundle two related items together into one package? Meet the “pair”! A pair is like a two-compartment box: fill the first slot and the second slot, and together they form one value.

Read the target type carefully: Σ (x : A) × B x (called a “dependent pair type”). It sets a rule for each compartment:
• The first slot (named x) must hold a term of type A;
• The second slot must hold a term of type B x—notice the x! The required type of the second compartment depends on whichever value you place in the first compartment!

Check your context: you are given a : A and b : B a. Once you decide what goes into the first slot, what does B x specialize to for the second slot?

You don't need to invent any new data here—just grab the pair block ⟨ , ⟩ and pack the supplied items in the exact order the type describes.`
  },
  L13: {
    'zh-CN': `上一关我们学会了把两件相关物品“打包”进依赖对；这一关反过来，我们来体验怎样把包裹“拆开”并取出里面的第一项！

先看目标：(Σ x : A. B x) → A——要求造一台函数，接收一个依赖对 p，然后交出类型为 A 的第一项。别被画布上预搭好的那长串 ind_sigma 框架吓到！那些外壳题目已经帮你冻结并填妥了，你这一关只需要把注意力放在最后一个空槽（拆包分支的出口）上：
1. 最外层的 λ 引入了待拆的包裹 p : Σ (x : A) × B x；
2. 中间的 ind_sigma 负责把包裹打开，并把里面的两件物品摆到最后一行“λa. λb. ?”的工作台上——也就是两个局部变量 a : A 和 b : B a；
3. 唯一空着的，就是这个分支最后要交出去的结果。

站在工作台前看看目标和手头的两个局部材料：整台机器想要返回 A，而桌上躺着类型为 A 的 a 和类型为 B a 的 b。该把谁递出去呢？（想亲手从头搭完整套 ind_sigma 参数和目标族的同学，以后还可以去序对专题里深入挑战哦。）`,
    en: `In the last level you packed two items into a dependent pair. Now let's do the opposite: open a package and extract its first component!

Look at the goal: (Σ x : A. B x) → A—a function that takes a dependent pair p and returns an A. Don't be intimidated by the pre-built ind_sigma frame already on the canvas! All of its outer wiring is already filled and frozen for you, leaving just one empty slot at the very end:
1. The outer λ receives the incoming pair p : Σ (x : A) × B x;
2. ind_sigma opens p and hands its two unpacked contents to the final branch “λa. λb. ?”, placing two local variables—a : A and b : B a—on your workbench;
3. The only missing piece is the final result that the branch returns.

Look at what the machine needs (type A) and what lies on the workbench (a : A and b : B a). Which unpacked piece fits the goal?`
  },
  journey_nat: {
    'zh-CN': `自然数家族（写作 ℕ）正式登场啦！在类型论里，自然数不是一串现成的阿拉伯数字，而是像搭台阶一样一级一级“构造”出来的：
• 0 : ℕ 是所有自然数的起点；
• suc（Successor，后继）是一步“往上加 1”的积木：只要给它喂一个自然数，它就能产出下一个自然数。

于是，0 是零，suc 0 就是 1，suc (suc 0) 就是 2，每多套一层 suc，数字就往前走一步！有趣的是，这种写法让每个自然数自带“构造历史”——看到有几层 suc，就知道它是从 0 走了几步过来的。

看看画布：题目已经为你放好了外层的 suc 积木，只等你往它的输入槽里填入一个自然数作为起点。先试着把最小的起点放进去，亲手搭出数字 1 吧！（也可以试着再多套几层 suc，点选积木看看它们的类型是不是依然为 ℕ；不过千万别把类型标签 ℕ 放进项的位置哦。）

这种“起点 + 下一步”的台阶结构非常关键，下一关我们马上要用它来驱动一台能自动重复工作的机器！`,
    en: `Meet the natural numbers, whose type is written ℕ! In type theory, numbers aren't opaque symbols—they are built step by step like a staircase:
• 0 : ℕ is the starting point;
• suc (short for “successor”, meaning +1) takes any natural number and produces the next one.

That makes 0 zero, suc 0 one, suc (suc 0) two, and so on—every extra suc wrapper steps one unit forward, so each number literally carries its own construction history!

On your canvas, a suc block is already waiting for a natural-number input. Try plugging in the smallest starting point to construct the number 1! (Feel free to stack extra suc blocks to see that every step still has type ℕ—just remember not to put the type label ℕ itself into a term slot.)

This “base + next step” pattern is the foundation for the next level, where we'll build a machine that repeats work automatically!`
  },
  journey_double: {
    'zh-CN': `现在我们来打造一台“数字翻倍机”！它的目标类型是 ℕ → ℕ：输入一个自然数 n，输出 2 倍的 n。画布上已经用 ind_nat（自然数递归/归纳子）搭好了机器外壳，你只需要补全最后一行空着的“后继分支”。

怎么让一台机器处理任意大的自然数呢？ind_nat 的思路像接力赛，只问你两个问题：
1. 起点（n = 0 时）返回什么？题目已经替你填好了 0，因为 0 的两倍还是 0。
2. 接力（n 从 k 变成 suc k 时）怎么算？在最后面的分支“λk. λih. ?”里，你不仅拿到了前一个数 k，还直接拿到了机器已经替你算好的“k 的结果”——ih（归纳假设，也就是 2 × k）！

所以你完全不用从头算起！只要盯住那份现成的接力棒 ih：当输入从 k 变成 suc k（增加了 1）时，翻倍后的结果应该在 ih 的基础上再往前走几步呢？用左侧的 suc 积木加工 ih 吧！
（小提示：这里的“检查”主要核对分支返回的类型是不是 ℕ；打开“查看答案”可以看到标准的翻倍做法哦。）`,
    en: `Time to build a doubling machine! Its goal is ℕ → ℕ: given a natural number n, return twice n. The canvas already provides the ind_nat (natural-number recursion) frame, leaving only the final successor step for you to fill.

How does ind_nat handle arbitrarily large numbers without an infinite loop? Like a relay race, it asks just two questions:
1. Base case (at 0): what should we return for 0? Already filled with 0, because twice zero is zero.
2. Step case (from k to suc k): inside the branch “λk. λih. ?”, you receive the previous number k AND the result ih (the induction hypothesis) that the machine has already computed for k—namely, twice k!

You don't need to recompute from scratch. Focus on the baton ih: when the input grows from k to suc k (+1), how many steps forward should the doubled result advance from ih? Use suc blocks to build on ih! (Note: checking verifies that your step has type ℕ; the reference answer demonstrates the exact doubling step.)`
  },
  L15: {
    'zh-CN': `在日常数学里，我们常写“a = a”或“2 + 2 = 4”。但在类型论里，马丁-洛夫做了一个极其精妙的设计：没有单独一套“等号逻辑”，而是把“两个东西相等”这件事本身，也变成一种类型！

这就是本关目标里的“恒等类型（Identity Type）”：Id A a b。它有三个部分：第一个是 A（规定要在哪个类型里比较），后面是两个待比较的项 a 和 b。所以 Id A a a 读作：“在类型 A 中，a 与 a 相等”这一命题所对应的证据类型。

既然“等式”是一种类型，那么“证明等式成立”就等于“造出一个属于该类型的项（证据）”！怎么造出最基本的相等证据呢？依靠自反性公理（Reflexivity）：世间万物天然等于它自己。左侧工具箱里的 refl 积木就是这把万能钥匙——检查器会顺着目标 Id A a a 自动核对等号两边是不是同一个东西。

分清三个角色：a 是被比较的对象，Id 是写出等式命题的标签，而 refl 才是真正交上去的相等证明！`,
    en: `In everyday math, we write equations like “a = a”. Martin-Löf had a brilliant idea for expressing equality inside type theory: turn an equality statement itself into a type!

Meet the “Identity Type”, written Id A a b. It names the common type A where both items live, followed by the two endpoints a and b. So Id A a a is the type of evidence proving “within A, a equals a”.

Because an equality claim is a type, proving an equation means constructing a term (a piece of evidence!) that inhabits that type. The most fundamental equality rule is reflexivity: every object equals itself, constructed by the block “refl”. The checker reads the goal Id A a a and verifies that both sides match.

Keep the three roles separate: a is the object being compared, Id writes the equality proposition, and refl is the proof term you submit!`
  },
  L19: {
    'zh-CN': `上一关我们造出了相等证据，这一关来看看相等证据能帮我们干什么大事——答案是“搬运数据（Transport）”！

读读条件区的设定：A 里有两个元素 x 和 y，p : Id A x y 是它们相等的证据；同时还有一个类型族 B : A → Type 0，在 x 处生成类型 B x，在 y 处生成类型 B y。现在我们手里拿了一个属于 B x 的项 b，可目标却要我们交出一个属于 B y 的项！

站在类型检查器的角度，B x 和 B y 名字写得不一样，不能直接混用；但是有了相等证据 p : Id A x y 搭桥，消去函数 J 就可以把“起点房间 B x”里的材料，顺着桥搬运到“终点房间 B y”里！

画布上已经把 J 的长长参数骨架（类型 A、起点 x、目标族 λw. λq. B w、终点 y 和桥梁 p）都铺好了，唯独空出了中间那个“起点处的材料”槽位：想一想，假如终点还没离开起点 x（就是 x 自己），这时候需要交出一份 B x 类型的材料——条件区里谁恰好就在 B x 里面呢？`,
    en: `Now that you can construct equality evidence, let's put it to work—by “transporting” data across related types!

Read the context: x and y are elements of A, and p : Id A x y is evidence that x equals y. Meanwhile, a type family B : A → Type 0 gives a type B x at x and a type B y at y. You already hold a term b : B x, yet the goal demands a term of type B y!

To the type checker, B x and B y are written differently, so b cannot be submitted directly. With the equality bridge p : Id A x y, however, the eliminator J can carry material from the starting room B x across to the target room B y!

The canvas already wires up J's surrounding frame (type A, start x, motive λw. λq. B w, endpoint y, and proof p), leaving just one missing slot for the “starting material”: if the endpoint were still at x itself, which available term already lives in B x?`
  },
  journey_induction: {
    'zh-CN': `主线最后一关！我们要把前面学到的函数、类型族、递归和相等证据全都串起来，完成你的第一个正式数学归纳证明：对每一个自然数 n，都有 add n 0 = n（任意自然数加上 0 还是它自己）。

仔细看目标 Π (n : ℕ) → Id ℕ (add n 0) n：外层用 λn 接收任意的 n，里面再用 ind_nat 对 n 做归纳——没错，ind_nat 不仅能像刚才那样递归算出数字，还能一步一步递归构造“证明”！
• 起点（n = 0）：因为 add 0 0 会直接计算成 0，所以零分支里的 refl 已经帮我们证明好了 add 0 0 = 0；
• 接力（n = suc k）：现在只剩下后继分支“λk. λih. ?”需要你补全！在这里，你拿到了前一个数 k，以及接力棒 ih : Id ℕ (add k 0) k（也就是已经证明好的“k + 0 = k”）。而按加法的计算规则，目标左边 add (suc k) 0 会自动算成 suc (add k 0)，所以这个空槽期待的证明是：Id ℕ (suc (add k 0)) (suc k)。

看看手里新发的助手 suc_cong：它接收两个自然数 a、b，以及“a = b”的相等证据，就能把证据升级成“suc a = suc b”！配合引理区的 add 和起点 0，想想该把哪两个数以及接力棒 ih 依次传给 suc_cong？`,
    en: `Welcome to the final boss of the main journey! Let's unite functions, type families, recursion, and equality into your first real proof by induction: for every natural number n, add n 0 = n.

Look at the goal Π (n : ℕ) → Id ℕ (add n 0) n: an outer λn introduces any n, and ind_nat recurses on n—this time building a proof at every step instead of a number!
• Base case (n = 0): because add 0 0 computes straight to 0, the pre-filled refl already proves add 0 0 = 0.
• Step case (n = suc k): only the successor branch “λk. λih. ?” is left for you! Here you have the previous number k and the relay baton ih : Id ℕ (add k 0) k (the induction hypothesis that k + 0 = k). By addition's computation rule, add (suc k) 0 reduces to suc (add k 0), so your empty slot needs a proof of Id ℕ (suc (add k 0)) (suc k).

Look at your new helper suc_cong: give it two natural numbers a, b and evidence of Id ℕ a b, and it returns evidence of Id ℕ (suc a) (suc b)! Using add from Lemmas and 0, what two numbers and baton ih should you pass to suc_cong?`
  },
  L2: {
    'zh-CN': `欢迎来到函数工坊！先来看看这一关的条件与目标：条件区里已经有了两个类型 A、B，以及一个现成的项 x : A；而下方的目标类型是 B → A——要你建造一台“接收 B、返回 A”的函数机器。

很多同学一看到这里就犯嘀咕：“我收到的输入是 B 类型的，又没有办法把 B 变成 A，这怎么可能造出 A 呢？”其实这里藏着两个非常实用的小秘密：
1. 作用域是嵌套的：站在 λ 函数体里面时，你既看得到 λ 自己刚刚接收的新参数（内层），也依然看得到顶部条件区里早就准备好的 x（外层）！
2. 函数不是非得“用掉”它的输入：一台机器完全有权收下你投进去的 B 类型参数，然后置之不理，直接把外层现成的 A 交出来。

动手时先根据目标确定外层 λ 的输入类型是什么、输出类型又是什么；挑选变量时永远看“类型是否匹配”，别被刚刚新起的名字带偏啦。`,
    en: `Welcome to the Function Workshop! Look at what you have and what you need: the context gives types A and B along with a term x : A, while the goal B → A asks for a function machine that accepts a B and returns an A.

At first glance this feels tricky: “If my machine only receives a B, and I have no way to turn a B into an A, how can I return an A?” Two helpful facts unlock it:
1. Scopes nest: from inside a λ's body, you can see both the function's own new parameter (inner scope) and the outer declaration x : A from the top context (outer scope)!
2. A function never has to use its input: it is completely valid to accept an argument of type B, set it aside, and return an A that was already available outside.

Always match variables by their types rather than automatically reaching for the newest parameter!`
  },
  L5: {
    'zh-CN': `如果一台函数机器本来需要两个参数，而我们只给它喂了第一个参数就停下来，会发生什么？来看看本关的条件与目标：条件里有 f : A → B → C 和 x : A，而目标类型写着 B → C！

秘密在于箭头“→”的结合方向——类型论中的箭头是向右结合的，所以 A → B → C 的真实结构其实是 A → (B → C)。换句话说，f 是一台“吃进一个 A 后，就会吐出一台 B → C 新机器”的母机！

很多同学看到目标 B → C 带了个箭头，就会条件反射地去拖 λ 积木自己造函数。但在动手之前先停下来想想：如果你把手头的 x : A 喂给 f，吐出来的成果本身属于什么类型？

这就是编程和类型论中非常有名的“部分应用（Partial Application）”：多参数函数只接收前面一部分参数后，剩下的计算本身就是一台完完整整的新函数！画一下 f 类型被消耗掉第一段后的剩余部分，看看这一关到底需不需要 λ 吧。`,
    en: `What happens if a function expects two inputs, and you only feed it the first one? Look at the puzzle: you have f : A → B → C and x : A, and the goal is B → C!

The secret lies in how arrows group: arrows in types associate to the right, so A → B → C really means A → (B → C). In other words, f is a function that takes an A and returns a brand-new function of type B → C!

Whenever learners see an arrow in the goal (B → C), their instinct is to grab a λ block and build a function from scratch. Before doing that, ask yourself: if you apply f to x : A once, what type does the resulting expression already have?

This technique is called “partial application”: supplying the first argument to a multi-argument function leaves a complete function waiting for the remaining argument. Cross off the first part of f's type and see what remains!`
  },
  function_compose: {
    'zh-CN': `这一关我们来亲手搭一条“两段式加工流水线”！条件区有两台现成的机器：f : A → B（把 A 加工成 B）和 g : B → C（把 B 加工成 C），而本关目标是要你合成一台 A → C 的新机器。

仔细观察两台机器的接口：第一台 f 吐出的成品类型是 B，恰好严丝合缝地对上了第二台 g 要吃的原料类型 B！这说明我们可以把它们前后串起来，完全不需要额外材料。

怎么组装这条流水线呢？
1. 先看目标 A → C：最外层需要一台接收 A 类型输入的函数机器，所以先放一块 λ，把未来收到的材料接进来。
2. 进到函数体后，你手头有了那份 A：先让谁来加工它，再把半成品交给谁？记住应用积木的结构——当内层一块应用积木被放进外层应用的右边（参数槽）时，内层算出的半成品就会直接流进外层那台机器里继续加工！

在心里默念一遍数据的流动路线“A → B → C”，顺着接口把这两步接起来吧。`,
    en: `Let's assemble a two-stage pipeline! You have two ready-made machines: f : A → B (turns an A into a B) and g : B → C (turns a B into a C). Your goal is to combine them into a single machine of type A → C.

Look at their interfaces: f's output type B matches g's input type B! That means you can wire f's output straight into g's input without needing any extra materials.

How do you wire them up?
1. Start from the goal A → C: use an outer λ block to receive the incoming input of type A.
2. Inside the body, you have that A in hand: which machine must process it first, and which machine takes the intermediate result? Remember how nesting application blocks works: placing an inner application inside the right (argument) slot of an outer application feeds the inner result directly into the outer function!

Trace the data flow A → B → C in your head as you snap the stages together.`
  },
  function_curry: {
    'zh-CN': `还记得装两样东西的序对吗？本关条件区给了机器 h : (A × B) → C——这台机器的脾气比较“挑剔”，它要求你把 A 和 B 打包成一个完整的序对 ⟨a, b⟩，才肯一次性处理出 C；可本关目标 A → B → C 却想要一台“分两次分别接收 A 和 B”的新机器！

别去改动原本的 h，我们在它外面套一层“接口适配器”就行：新机器先用第一层 λ 收下 A，再用第二层 λ 收下 B；等两份原料在最内层凑齐了，再顺手把它们装进一个普通序对里，交给老机器 h 去处理！

沿着目标 A → B → C 从外往里读，目标中有几个箭头，就需要搭几层 λ。进入最内层的函数体时，外层收到的两个参数都会同时处于你的视野（作用域）里，可以一起拿来打包。

想一想 h 原本需要什么形状的输入，再去工具箱里找对打包积木吧——把“一次收一对”转换成“分两次收两个”，这就是函数式编程里著名的“柯里化（Currying）”！`,
    en: `Remember how pairs bundle two items together? Here you are given h : (A × B) → C—a machine that expects a single packaged pair of type A × B and returns a C. However, your goal is A → B → C: a function that receives an A first, then a B, and finally returns a C!

Instead of changing h, wrap an adapter around it: use two λs to collect an A and a B one at a time; once both pieces are in hand inside the innermost body, pack them into a pair and feed that pair to h!

Read the goal A → B → C from outside in to see how many λ layers you need. Inside the innermost body, both parameters remain in scope together so you can combine them.

Check what input shape h expects and grab the matching packaging block—converting a function on pairs into a function that takes arguments one by one is the famous technique called “currying”!`
  },
  dependent_constant: {
    'zh-CN': `欢迎来到依赖类型工坊！我们先用一个最温柔的小热身开场：这一关的目标是 A → Type 0——做一个不管输入什么 A，永远返回同一个类型 A 的“常量类型族”。

仔细对比一下它和主线“恒等函数”的差别：
• 主线的目标 A → A：接收一个 A 类型的项，返回一个 A 类型的项；
• 这一关的目标 A → Type 0：依然接收一个 A 类型的项，但冒号后面的箭头指向了 Type 0！这说明函数体里要交出去的，不再是属于 A 的某个普通物品，而是一个“类型本身”！

再看一眼条件区：A : Type 0 告诉我们，A 本身就是住在 Type 0 里的一个类型。在 MLTT 里，类型和普通项用的是完全同一套 λ 与引用积木，所以函数同样可以把类型 A 当作返回值交出去！

先用 λ 搭出函数外形，再看清楚函数体里到底是要“一个属于 A 的项”，还是“一个属于 Type 0 的类型”吧。`,
    en: `Welcome to the Dependent Types workshop! Let's start with a gentle warm-up: the goal A → Type 0 asks for a “constant type family”—a function that receives an input of type A and always returns the type A itself.

Compare this with the identity function from the main journey:
• In A → A, the function receives an element of A and returns an element of A;
• Here in A → Type 0, the function still receives an element of A, but the arrow points to Type 0! That means the body must return a TYPE itself, not an element inside A!

Look at the context: A : Type 0 tells you that A is a type living in Type 0. Because MLTT treats types as first-class values, λ functions can return types using the exact same blocks you already know.

Start with a λ for the function shape, then check carefully whether its body expects an element of A or a type belonging to Type 0!`
  },
  dependent_pi: {
    'zh-CN': `在主线第 4 关里，我们曾经推断过依赖函数“应用之后”的结果类型；这一关更进一步，请你把一整张“依赖函数类型（Π 类型）”亲手拼出来！

仔细看画布：条件区里声明了 A : Type 0、B : A → Type 0，以及函数 f : Π (x : A) → B x；而冒号左边的项 f 已经写好并锁住了，空槽在冒号右边——这意味着你要提交的是 f 的完整类型，而不是再去造一个函数项。

从左侧工具箱拖出 Π 积木看看它的结构：它包含一个参数名字、一个“输入类型”槽位，以及一个“结果类型”槽位。最神奇的地方在于：Π 绑定的这个参数名字会直接进入“结果类型”的作用域里，让你能写出“结果类型随具体输入变化”的依赖关系！

先填好 f 接收的输入类型，再进入 Π 右边的“结果类型”槽位。借助已经给你的类型族 B : A → Type 0，想想该把 B 和 Π 自己绑定的那个新参数怎样组合起来？（参数名字可以自己定，关键是右边要引用到这张 Π 自己绑定的那个参数哦！）`,
    en: `In the main journey you inferred the result type after applying a dependent function. Here, let's build an entire “dependent function type (Π-type)” yourself!

Look at the canvas: the context gives A : Type 0, B : A → Type 0, and f : Π (x : A) → B x. The term f on the left of the colon is already locked in place, while the empty slot is on the right—so your task is to assemble the full TYPE of f rather than another function term.

Inspect the Π block from the toolbox: it has a parameter name, an input-type slot, and a result-type slot. Crucially, the parameter bound by Π enters scope inside the result-type slot, allowing the return type to depend on that input!

Fill in the input type first, then look inside the result-type slot. Using the supplied type family B : A → Type 0, how should you combine B with the parameter bound by this Π block? (You can name the parameter anything you like, as long as the result refers to the parameter bound by this Π.)`
  },
  L17: {
    'zh-CN': `还记得主线第 2 关那个“收到什么就返回什么”的恒等函数吗？当时它只能处理某一个固定类型 A；今天我们要把它升级成能服务 Type 0 里**所有类型**的“多态恒等函数（Polymorphic Identity Function）”！

读读本关的目标：Π (A : Type 0) → A → A。从外往里拆成两步约定：
1. 第一步（外层 Π）：先接收一个“类型 A : Type 0”作为参数！注意后面的 A → A 用到了刚刚收到的 A，所以外层 Π 是真正依赖参数的——你传入 ℕ，后面就变成 ℕ → ℕ；你传入 1，后面就变成 1 → 1！
2. 第二步（内层 A → A）：再接收一个“属于刚才那个类型 A 的具体项 x”，然后把它原样交还！

因为有两个箭头约定，所以要嵌套两层 λ：外层 λ 先接住类型，内层 λ 再接住属于那个类型的项。进入最内层函数体时，你会同时看到一个“类型参数”和一个“该类型的项”。看清最终要交还的是谁，千万别把“类型标签”和“标签下的物体”拿反啦！`,
    en: `Remember the identity function from the main journey that returns whatever input it receives? Back then it worked for only one fixed type A. Today you will upgrade it to the “polymorphic identity function”, which works for EVERY type in Type 0!

Read the goal Π (A : Type 0) → A → A from outside in as two successive promises:
1. First promise (outer Π): accept a TYPE A : Type 0 as an input! Notice how the remaining type A → A mentions that A—making the outer Π genuinely dependent (pass ℕ and the rest becomes ℕ → ℕ; pass 1 and it becomes 1 → 1!).
2. Second promise (inner A → A): accept an element x of that very type A, and return it unchanged!

Fulfill both promises by nesting two λ blocks: the outer λ binds the type, and the inner λ binds the element of that type. Inside the innermost body, both the type parameter and its element are in scope—make sure you return the element, not the type label itself!`
  },
};
