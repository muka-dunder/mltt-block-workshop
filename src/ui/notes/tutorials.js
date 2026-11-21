// Problem guides explain notation and the task without assembling its solution.
export const TUTORIALS = {
  L0: {
    'zh-CN': `欢迎来到马丁-洛夫类型论（MLTT）的世界！在开始动手拼搭之前，我们先花一分钟认识一下类型论中最核心的两个概念：“类型（Type）”与“项（Term）”。你可以把“类型”想象成一种分类标签（比如“整数”“水果”），或者逻辑中的一个命题；而把“项”想象成属于这个分类的具体对象（比如数字 3、一颗苹果），或者证明该命题成立的具体证据。

现在看看画布上的紫色卡片，它叫作一张“判断（Judgment）”，我们可以像读句子一样从上往下读它：
1. 顶部左上角的符号“Γ”（大写希腊字母，读作 Gamma）代表“上下文（Context）”，也就是你手头的“已知条件 / 材料库”。紧跟在 Γ 后面的声明用逗号隔开，其中的冒号“:”读作“属于”或“具有类型”。因此，A : Type 0 的意思是“A 是一个类型”，而 x : A 的意思是“我们手头已经有一个名叫 x 的对象（项），它的类型是 A”。
2. 下方的符号“⊢”（读作“推导出”或“在这些条件下”）把前提与目标连接起来。整张卡片合起来就是“在条件 Γ 下，推导出后面的判断”。它后面的“? : A”表示：在冒号右边，题目已经规定好目标类型是 A；而冒号左边留了一个空槽，等待你放入一个真正属于类型 A 的项。

请注意区分“类型的名字（A）”和“属于该类型的项（x）”——它们扮演着截然不同的角色，不能把标签本身当成物品交上去。观察一下条件区已经为你准备好的材料，想想谁才是真正具有类型 A 的那个项吧！`,
    en: `Welcome to Martin-Löf Type Theory (MLTT)! Before snapping blocks together, let's meet the two central characters of type theory: “Types” and “Terms”. You can think of a type as a category or label (like “Number” or “Fruit”)—or, in logic, a proposition to be proved. A term is a concrete object belonging to that category (like the number 3 or an apple)—or a piece of evidence proving that proposition.

The purple card on the canvas is called a “judgment”. We can read it from top to bottom like a sentence:
1. At the top-left, the symbol “Γ” (the capital Greek letter Gamma) stands for the “context”—your supply of given assumptions and available materials. The declarations after Γ are separated by commas, and a colon “:” means “has type” or “belongs to”. So A : Type 0 tells you “A is a type”, while x : A tells you “you are given an object (term) named x whose type is A”.
2. Below that, the turnstile symbol “⊢” reads “under these conditions, we can construct…”. Together, the card reads “from context Γ, derive the judgment below”. After ⊢, another colon separates the term on the left from its required type A on the right. Because the empty slot is on the left of the colon, your task is to supply a term of type A.

Be careful to distinguish the name of a category (the type A) from an actual object inside it (the term x). Look at the declarations provided in your context and ask yourself: which symbol represents a term of type A?`
  },
  L1: {
    'zh-CN': `上一关里，条件区直接把现成的 x : A 交给了你；但在这一关，条件区只声明了 A : Type，手里连一个 A 类型的项都没有！别慌，再仔细看看冒号右边的目标类型：这次我们要构造的不是单独的 A，而是 Π (x : A) → A（通常简写为 A → A）。

什么是 A → A？它代表一个“函数类型”。你可以把函数想象成一台加工机器，或者一份承诺：“只要有人在未来给我放入一个 A 类型的输入，我就能产出一个 A 类型的结果。”因为当输出类型不依赖于输入的具体数值时，Π (x : A) → A 就会简写成亲切的单箭头 A → A。

既然目标是一台“函数机器”，我们就需要使用左侧工具箱里的 λ（读作 Lambda）积木来制造它。λ 的意思是：“假设我收到了一个输入，不妨给它起名叫 x，接下来我要用它算出点什么……”

当你把 λ 放上去时，它会为你诞生一个代表“未来输入”的新变量（比如 x）。这里有一条非常重要的规则叫“作用域（Scope）”：由 λ 创造出来的参数名字，只能在这台 λ 机器的内部（即函数体槽位中）使用，跑出机器外面就失效了。想一想：如果一台机器需要接收一个 A 并交还一个 A，它内部最简单的做法是什么？`,
    en: `In the previous level, the context handed you a ready-made term x : A. Here, the context only declares A : Type—you aren't given any element of A upfront! Don't worry: look at the target type to the right of the colon. Instead of asking for a bare A, the goal asks for Π (x : A) → A, usually written in its shorter arrow form A → A.

What does A → A mean? It is a “function type”. Think of a function as a processing machine or a contract: “If someone gives me an input of type A in the future, I promise to produce an output of type A.” When the output type does not depend on the specific value of the input, Π (x : A) → A is abbreviated as the simple arrow A → A.

To build a function machine, you use the λ (lambda) block from the toolbox. A λ block says: “Suppose I receive an input—let's name it x—here is the result I will compute inside my body.”

Notice an important rule called “scope”: the parameter created by a λ block only exists inside that λ block's body. You cannot use that parameter outside the function that created it. If your machine receives an input of type A and needs to return a result of type A, what should it output inside its body?`
  },
  L2: {
    'zh-CN': `这一关我们来体会“多层作用域”是如何协同工作的。先看顶部的条件区：我们不仅有两个类型 A 和 B，手头还已经拿到了一个现成的项 x : A。再看下方的目标类型：Π (y : B) → A，也就是 B → A。

读懂这个目标了吗？它要求你建造一台函数机器：这台机器需要接收一个 B 类型的参数，但最后吐出来的却必须是一个 A 类型的结果！

很多初学者看到这里会觉得奇怪：“我收到的输入明明是 B 类型的，又没有办法把 B 变成 A，这怎么可能造得出 A 呢？”秘诀在于两点：
第一，站在 λ 函数机器的内部时，你的视野不仅能看到机器自己刚刚接收的参数（内层作用域），还能抬头看到顶部条件区里早就准备好的外层变量（外层作用域）！
第二，没有任何法律规定函数必须“用掉”它收到的输入。一台机器完全可以收下你投进去的 B 类型硬币，然后置之不理，直接把外层现成的 A 类型物品交给你。

动手之前，先分清外层条件里的变量与 λ 新绑定的参数各自是什么类型，再看看函数的输出槽究竟需要哪一个类型吧。`,
    en: `This level explores how outer declarations and inner function parameters work together across different levels of scope. Look at the context at the top: besides two types A and B, you already possess a ready-made term x : A. Now look at the target type below: Π (y : B) → A, or simply B → A.

What is the goal asking for? It wants a function machine that accepts an input of type B and returns an output of type A.

At first glance, this might feel puzzling: “If my function receives an input of type B, and I have no way to convert a B into an A, how can I possibly return an A?” Two key ideas solve the mystery:
First, from inside a λ function body, you can see both the function's own parameter (inner scope) and the declarations from the top context (outer scope).
Second, a function is never required to use its input! A machine is completely allowed to accept an input of type B, ignore it, and hand back an object of type A that was already available outside.

Check the types of the outer variables and the newly bound λ parameter, then decide which one belongs inside the function body.`
  },
  L3: {
    'zh-CN': `前两关我们学习了如何用 λ “制造”一台函数机器；这一关正好反过来，我们要学习如何“使用”一台已经造好的函数机器！

先看条件区给我们的两件宝贝：
1. f : A → B —— 这是一台现成的函数机器 f。它的说明书（类型 A → B）写得很清楚：只要向它投喂一个 A 类型的原料，它就能为你加工出一个 B 类型的成品。
2. x : A —— 这恰好是一个 A 类型的原料！
而我们下方的目标类型，正好就是希望得到一个 B 类型的项。

在类型论中，“把参数投喂给函数”的动作叫作“函数应用（Application）”。你需要使用左侧工具箱里的“应用”积木。这个积木有两个插槽：左边是“函数位置”，必须放入一台具有函数类型（形如 A → B）的机器；右边是“参数位置”，必须放入符合机器输入要求的原料（这里是 A 类型）。

请特别注意：直接把两块积木并排扔在画布上，它们是不会自己发生反应的；必须通过“应用”积木把它们正式组装起来，而且函数在左、参数在右的顺序绝对不能颠倒哦！`,
    en: `In the last two levels, you used λ to build new function machines. In this level, you will do the reverse: use a function machine that has already been built for you!

Look at the two resources in your context:
1. f : A → B — a ready-made function machine named f. Its type A → B is its user manual: give it an input of type A, and it will produce an output of type B.
2. x : A — a term of type A, which matches the exact input f is waiting for!
Meanwhile, the target type after the colon asks you to construct a term of type B.

In type theory, feeding an argument into a function is called “function application”. Use the application block from the toolbox. It has two slots with distinct roles: the left slot holds the function (which must have an arrow/Π type), and the right slot holds the argument (whose type must match the function's expected input).

Simply placing blocks next to each other on the canvas does nothing—you must connect them inside an application block, and keep the function on the left and its argument on the right.`
  },
  L4: {
    'zh-CN': `如果一台函数机器需要接收“两个”参数才能给出最终结果，在类型论里会怎么写呢？来看看本关条件区里的 f : A → B → C，同时我们手头还有原料 x : A 和 y : B，而最终目标是得到 C。

这里藏着类型论一个非常精妙的设计：在 MLTT 中，每台函数机器每次其实只吃“一个”参数！那么 A → B → C 是什么意思呢？原来，类型里的箭头“→”是向右结合的，所以 A → B → C 的真实结构是 A → (B → C)：
• 第一步：当你先给 f 投喂第一个参数（类型 A）时，它不会立刻吐出 C，而是会吐出一台“新的半成品函数机器”，这台新机器的类型是 B → C（还在等待一个 B）。
• 第二步：你再把第二个参数（类型 B）投喂给刚才那台新机器，它才会最终吐出类型 C 的结果！

因为一块“应用”积木一次只能喂一个参数，所以要喂两个参数，你就需要把两块“应用”积木嵌套起来：先让内层应用算好第一步，生成那台 B → C 的新机器，再把这整块内层应用当作“函数”，放进外层应用的左边插槽里继续喂第二个参数。顺着“每喂一次参数、类型就消去一层箭头”的节奏去思考吧！`,
    en: `How does type theory represent a function that needs two inputs? Look at the declaration f : A → B → C in your context, alongside x : A and y : B, with a target type of C.

Here is a central insight of MLTT: every function actually takes one argument at a time! The arrow “→” in a type groups to the right, which means A → B → C is really shorthand for A → (B → C):
• Step 1: When you feed f its first input of type A, it does not immediately produce a C. Instead, it returns a new function of type B → C—a machine still waiting for a B!
• Step 2: When you feed that returned function an input of type B, it finally produces a result of type C.

Because a single application block feeds only one argument, feeding two arguments requires nesting two application blocks. The inner application feeds the first argument to produce a B → C function; the outer application takes that entire inner application as its function and feeds it the second argument. Track the type after each step!`
  },
  L5: {
    'zh-CN': `再来看看这一关的条件：我们依然有双参数函数 f : A → B → C，以及第一个参数 x : A；但仔细看，这次没有给你 y : B，而且冒号右边的目标类型也变成了 B → C！

先回忆一下上一关我们刚学到的秘密：A → B → C 其实就是 A → (B → C)。也就是说，f 是一台“吃进一个 A，吐出一台 B → C 函数机器”的母机。

很多同学一看到目标类型是 B → C（带箭头的函数类型），就会条件反射地想去拿 λ 积木来自己造函数。但在动手之前不妨停下来想一想：如果一个函数本来需要两个参数，而你只给它喂了第一个参数就停下来，会发生什么？
在编程语言和类型论中，这叫作“部分应用（Partial Application）”或“柯里化（Currying）”。一个只吃了一半参数的双参数函数，它剩下的部分本身就是一个完完整整的单参数函数！

对照一下你手里的 f : A → (B → C) 和 x : A，再看看目标要求的 B → C，想想是不是只需要走完上一关的“第一步”，就已经大功告成了呢？`,
    en: `Look closely at how this level differs from the last one: you still have f : A → B → C and x : A in the context, but there is no y : B—and the target type after the colon is now B → C!

Recall the secret we uncovered in the previous level: arrows group to the right, so A → B → C really means A → (B → C). In other words, f is a function that takes an A and returns a function of type B → C.

When learners see an arrow in the target type (B → C), their first instinct is often to reach for a λ block. While λ builds a function from scratch, it is not the only way to obtain a function! Ask yourself: what happens if a function expects two arguments, and you only feed it the first one?
This idea is called “partial application” (or “currying”). Feeding f its first argument of type A already produces a complete value of type B → C—a function waiting for its second input.

Compare what you get after applying f once with the target type B → C. Do you need a second step at all?`
  },
  L6: {
    'zh-CN': `咦？仔细看画布上的紫色判断卡，是不是发现哪里不一样了？
在前几关里，冒号右边的“类型”是题目写死的，留空的是冒号左边的“项”，让你去造出一个符合要求的对象。但是在这一关，冒号左边的项“f x”已经帮你拼好并锁住了，空槽跑到了冒号右边！

这意味着什么呢？在判断 Γ ⊢ t : T 中，左边 t 是项，右边 T 是它的类型。这一次，请你来扮演“类型检查器”的角色——题目已经把表达式 f x 摆在你面前，要求你推断出它的类型是什么，并把这个“类型”本身填进冒号右边的空槽里。

看看顶部的条件区：A 和 B 是两个类型，f : A → B 是一台把 A 变成 B 的函数机器，而 x : A 是投给它的原料。那么 f x 运转之后产出的结果，应该属于什么类型呢？
顺便你会发现一个有趣的事实：在我们的工坊里，“类型（如 A、B）”和普通的“项（如 f、x）”一样，都是可以从左侧条件区拖出来的符号积木。这正是类型论的迷人之处——类型本身也是可以被我们直接拿来操作和填写的对象！`,
    en: `Take a close look at the purple judgment card on the canvas—notice how the puzzle has flipped!
In every level so far, the type on the right side of the colon “:” was fixed, and you had to build a term in the empty slot on the left. Here, the term f x on the left is already built and locked in place, while the empty slot is on the right of the colon!

What does that mean? In a judgment Γ ⊢ t : T, the left side t is a term and the right side T is its type. This time, you are playing the role of the type checker: given the expression f x, you need to infer its type and place that type into the right-hand slot.

Check the declarations at the top: A and B are types, f : A → B is a function that turns an A into a B, and x : A is the argument fed into f. Once f is applied to x, what type does the resulting expression f x have?
Notice something cool here: in MLTT, types like A and B are represented by symbol blocks just like terms! You can drag and place a type expression directly into a type slot.`
  },
  L7: {
    'zh-CN': `这一关依然是“给你冒号左边的项 f a，请你填写冒号右边的类型”，但它将带你见识马丁-洛夫类型论最核心、最强大的超能力——“依赖类型（Dependent Types）”！

在普通编程中，函数的返回类型总是固定不变的（比如 A → B，不管你传入哪个 A，出来的永远是同一个类型 B）。但如果“返回值的类型”本身要随着“输入的具体数值”而改变呢？比如：输入一个自然数 n，返回“长度为 n 的数组”这个类型——输入 3 就返回“长度为 3 的数组”，输入 5 就返回“长度为 5 的数组”！

为了表达这种变化，我们引入了两个新角色：
1. 类型族（Type Family）B : A → Type —— 注意它的箭头右边是 Type！这说明 B 不是普通函数，而是一台“生产类型的机器”：你给它喂一个值 a : A，它就会为你定制出一个专属的具体类型 B a。
2. 依赖函数（Π 类型）f : Π (x : A) → B x —— 仔细看箭头右边写着 B x，里面引用了输入参数的名字 x！这表示：当你把某个具体的参数传入 f 时，返回类型里的 x 也会同步被替换成那个具体的参数。

现在，题目左边的项是 f a（把具体参数 a 传给了 f）。顺着上面的替换规律想一想：单独的 B 只是一个还没吃参数的“类型族”，要想在冒号右边填上 f a 对应的“具体类型”，你应该用哪块积木把 B 和实际参数组合起来呢？`,
    en: `Like the previous level, the term f a on the left of the colon is already given, and your task is to fill in its type on the right. But this puzzle introduces the superpower that makes Martin-Löf Type Theory special: “Dependent Types”!

In an ordinary function A → B, the return type B is fixed no matter which input of type A you pass in. But what if the type of the output depends on the specific value of the input? (For example, a function that takes a number n and returns a list of length n—passing 3 returns a type of 3-element lists, while passing 5 returns a type of 5-element lists!)

Two ingredients make this work in our context:
1. A “type family” B : A → Type. Notice that its output is Type! That means B is a function that takes a value of type A and produces a type. Alone, B is not a finished type yet; only when you apply B to a value a : A do you get a concrete type B a.
2. A “dependent function” f : Π (x : A) → B x. Notice how the return type B x mentions the input variable x! Whenever you apply f to a specific argument, every x in the return type B x gets replaced by that actual argument.

Look at the given term f a: which argument was passed into f, and how do you construct the resulting concrete type in the right-hand slot?`
  },
  L8: {
    'zh-CN': `从这一关开始，我们要逐一认识类型论大厦里的几种基本数据类型。在类型论中，每认识一种新类型，我们都会问三个黄金问题：
1. 引入规则（Introduction）：怎样造出这个类型里的元素？
2. 消去规则（Elimination）：拿到这个类型的元素后，怎样使用它？
3. 计算规则（Computation）：把刚造出来的元素立刻拿去使用，会算出什么？

本关我们先来认识最简单的一种类型——“单元类型（Unit Type）”，记作数字 1。
什么是单元类型 1？你可以把它想象成一个只装了一颗独苗苗的小盒子，里面有且仅有一个标准元素（称作“规范元素”），记作五角星 ★。在编程里，它就像不携带任何额外信息的 void 或空元组 ()；在逻辑里，它代表一个不证自明的“真命题（True）”，而 ★ 就是那个现成的唯一证据。

这就是单元类型的“引入规则”：★ : 1（五角星 ★ 具有类型 1）。
看一眼本关的判断卡：冒号右边写着目标类型 1，冒号左边是待填的项。左侧工具箱里同时放了“1”和“★”两块新积木——请千万分清“盒子本身（类型 1）”和“盒子里的那颗星（项 ★）”，把正确的那个放进冒号左边吧！`,
    en: `Starting from this level, we will explore the fundamental data types of MLTT. Whenever type theorists introduce a new type, they explain it through three golden rules:
1. Introduction rule: How do we construct an element of this type?
2. Elimination rule: Once we have an element of this type, how do we use it?
3. Computation rule: What happens when an elimination rule meets an element we just constructed?

Let's start with the simplest possible type: the “Unit Type”, written 1.
Think of the unit type 1 as a box that contains one—and only one—canonical object, written as the star ★. In programming, 1 corresponds to a dummy result carrying no extra data (like unit or ()); in logic, 1 represents the trivially true proposition “True”, and ★ is its sole, ready-made proof.

That gives us the introduction rule for the unit type: ★ : 1 (“the star ★ has type 1”).
In the judgment on your canvas, the target type to the right of the colon is 1, and the term slot on the left is empty. The toolbox offers both the type block 1 and the element block ★—keep the roles of “type” and “term” distinct as you fill in the slot!`
  },
  L9: {
    'zh-CN': `上一关我们学了单元类型 1 的“引入规则”（造出 ★ : 1）；这一关我们来学它的“消去规则”——如果别人递给你一个类型为 1 的未知变量 u : 1，你该如何利用它来完成任务？

先读读本关的条件区：
• C : 1 → Type 是一个“目标类型族”（也叫动机 Motive）：它告诉我们，对于不同的单元值 x : 1，我们想要构造的目标类型是 C x。
• u : 1 是我们手头拿到的一个未知单元值；而本关的最终目标正是构造出 C u。
• c : C ★ 是我们已经准备好的“基本情况”：也就是当那个单元值恰好是五角星 ★ 时，我们已经有一个属于 C ★ 的现成结果 c。

你可能会问：“既然单元类型 1 里面只有 ★ 这一个元素，那 u 肯定就是 ★ 呀！为什么不能直接把 c : C ★ 当作 C u 交上去呢？”
因为在类型检查器眼里，u 毕竟还是一个抽象的变量名，写的字面形式是 C u 而不是 C ★，检查器不会凭猜测自动把变量 u 替换成 ★。我们需要一块专门的消去子积木“unitrec”（单元递归/消去）来正式搭起这座桥梁！

unitrec 的含义就像数学归纳法（只不过这里只有 1 种情况）：只要你交出①要被分析的单元值（u 槽）、②目标随输入怎么变（类型族 C 槽），以及③在唯一标准元素 ★ 处该怎么处理（基本情况 c 槽），它就能帮你把 C ★ 合法地推广到任意的 C u！`,
    en: `In the last level we met the introduction rule for the unit type (★ : 1). Now let's learn its elimination rule: if someone hands you an arbitrary variable u : 1, how do you use it?

Let's read the declarations in the context:
• C : 1 → Type is a “type family” (often called the motive): for any unit value x : 1, C x describes the result type we want to produce at x.
• u : 1 is an unknown unit value given to us, and our goal at the bottom is to produce a term of type C u.
• c : C ★ is the “base case”: it provides the desired result specifically when the input is the canonical star ★.

You might wonder: “Since ★ is the only element of type 1, mustn't u be ★? Why can't I just submit c : C ★ directly for the goal C u?”
Because to the type checker, u is still a variable, so the written type C ★ does not automatically match C u! To bridge that gap, we use the unit eliminator block “unitrec”.

Think of unitrec as case analysis on a type with only one possible case: if you tell it (1) which unit value you are inspecting, (2) which type family describes your target, and (3) what value to return in the single case where the input is ★, unitrec produces a valid term of type C u for any u : 1.`
  },
  L10: {
    'zh-CN': `我们已经集齐了单元类型 1 的“引入规则（★）”和“消去规则（unitrec）”。现在，是时候见证第三个黄金问题——“计算规则（Computation Rule）”了：如果我们在 unitrec 要分析的单元值槽位里，不放未知的变量 u，而是直接塞进刚刚引入的具体元素 ★，会发生什么？

想想看：unitrec 的作用是“去看看第一个槽里的单元值是不是 ★；如果是 ★，就把第三个槽里的基本情况 c 拿出来作为结果”。那么，当你第一个槽里明明就放着货真价实的 ★ 时，这台消去机器根本不用犹豫，当场就会化简（归约）成基本情况 c！
用公式写出来，就是：
unitrec ★ C c ≡ c
这里的“≡”读作“定义相等（Definitional Equality）”，意思是两边的表达式在计算意义下是完全一模一样的东西，类型检查器会自动把左边算成右边。

看看画布：目标类型是 C ★，而且答案槽里已经为你冻结好了一块 unitrec 积木骨架（为了让你专门体验完整的消去表达式是如何通过计算的）。对照上一关 unitrec 三个插槽各自的职责，想一想这次第一个槽位 u 应该换上哪块积木，才能让它正好代表在 ★ 处的计算？`,
    en: `Now that we have seen the introduction rule (★) and elimination rule (unitrec) for the unit type, we arrive at the third golden question—its “computation rule”: what happens when we feed the canonical element ★ itself directly into unitrec?

Think about what unitrec does: it inspects a unit value and says, “In the case where this unit value is ★, return the base case c.” So if the unit value you hand it is literally ★, the eliminator can immediately simplify (reduce) to the base case c!
In symbols, this computation rule is written:
unitrec ★ C c ≡ c
The triple bar “≡” means “definitional equality”: to the type checker, the two sides compute to the exact same value, and either one has type C ★.

On your canvas, a frozen unitrec skeleton is already placed in the answer slot so you can see this computation rule in action. Review the roles of the three slots inside unitrec—the unit value being eliminated, the result type family, and the base case at ★—and fill them in so the whole expression has type C ★.`
  },
  L11: {
    'zh-CN': `认识了“只有一个元素”的单元类型 1 之后，我们来认识它的孪生兄弟——“连一个元素都没有”的“空类型（Empty Type）”，记作数字 0。

空类型 0 最大的特点是：它没有任何“引入规则”！也就是说，在正常的无矛盾世界里，你永远不可能凭空造出一个属于类型 0 的项。在逻辑中，0 代表“假命题（False）”或“矛盾”。

听到这里你一定会惊讶地指着条件区问：“既然 0 没有元素，为什么本关的条件区里明明写着一个 e : 0，而且还让我去构造一个毫无关系的任意类型 A 呢？”
问得好！请注意区分“真实世界”与“假设条件”：条件区里的 e : 0 并不是你造出来的，而是题目给你的一条“假设”（“假如天塌下来了，假如我们手里真的拿到了一个矛盾的证据 e : 0……”）。

一旦手里有了 e : 0，空类型的“消去规则”（absurd 积木）就登场了。还记得上一关的消去规则是要“为每一种可能的元素提供处理方案”吗？单元类型 1 有 1 个元素 ★，所以要填 1 个基本情况；而空类型 0 有 0 个元素，所以要做分类讨论时，需要填写的分支数量是——0 个！你只需要把手头的矛盾证据 e : 0 交给 absurd 积木，不用填任何分支，就能直接得到任何你想要的目标类型 A。在逻辑学中，这正是著名的“爆炸原理（由假可以推出一切）”！`,
    en: `After meeting the unit type 1 (which has exactly one element), let's meet its extreme sibling: the “Empty Type”, written 0, which has no elements at all!

Because the empty type 0 is completely uninhabited, it has no introduction rule—there is no block that creates an element of 0 from scratch. In logic, 0 represents falsehood or a contradiction (“False”).

Wait: if 0 has no elements, why does the context at the top of the card give you e : 0, and ask you to construct an arbitrary type A?
Remember that the context is a list of hypotheses (“Suppose someone handed us a proof of a contradiction e : 0…”). While you can never build a term of type 0 out of thin air, you can reason about what would follow if you already had one in scope.

That is what the empty elimination rule—the “absurd” block—is for. Recall how eliminating the unit type 1 required supplying 1 base case (for its 1 element ★). Since the empty type 0 has 0 possible elements, doing case analysis on a term of type 0 requires handling 0 cases! Handing a term of type 0 to the absurd block immediately satisfies any target type A. In logic, this is the famous “principle of explosion” (from a contradiction, anything follows).`
  },
  L12: {
    'zh-CN': `接下来我们学习如何把两样东西“打包”在一起。先看本关的目标类型：Σ (x : A) × B，当后半部分 B 里没有用到前半部分的变量 x 时，通常简写为我们熟悉的乘号形式“A × B”，叫作“积类型（Product Type）”或“序对类型（Pair Type）”。

什么是 A × B？就像平面直角坐标系里的坐标点 (x, y) 一样，A × B 表示一个“双格收纳盒（序对）”：它的左格子里必须装一个类型为 A 的项，右格子里必须装一个类型为 B 的项。在逻辑学中，A × B 对应着“A 并且 B（合取）”——要想证明“A 并且 B”同时成立，你必须既交出 A 的证据，又交出 B 的证据，一个都不能少。

那么，怎样造出一个属于 A × B 的序对呢？（也就是积类型的“引入规则”）：
这里千万不要把左侧工具箱里的“Σ 积木”和“配对 ⟨ , ⟩ 积木”搞混了：
• Σ 积木是用来书写“收纳盒的规格说明书（即类型 A × B）”的；
• 而配对积木 ⟨ , ⟩ 才是用来把两件具体物品真正打包进盒子里的（即构造属于该类型的项）！

看看本关冒号左边空缺的是“项”，再看看条件区里已经给你准备好的材料，按正确的先后顺序把它们装进配对积木里吧。`,
    en: `Next, let's learn how to bundle two pieces of data together into a single package. Look at the target type: Σ (x : A) × B. Because the second type B does not mention the first variable x, this type is also written as the familiar product “A × B”, called a “product type” or “pair type”.

What is A × B? Just like a coordinate pair (x, y) in geometry, an element of A × B is an ordered pair with two compartments: its first component must have type A, and its second component must have type B. In logic, A × B corresponds to “A and B” (conjunction): to prove “A and B”, you must supply both a proof of A and a proof of B.

How do we construct an element of A × B (its introduction rule)?
Be careful not to confuse the two new blocks in the toolbox:
• The Σ block constructs the pair type itself (the specification of the two compartments).
• The pair block ⟨ , ⟩ constructs an actual pair term by placing two items into its left and right slots.

Since the empty slot is on the left of the colon (a term position), use the block that builds an actual pair, and make sure its first and second slots match the required types A and B in order.`
  },
  L13: {
    'zh-CN': `上一关我们学会了用配对积木把两个项“打包”成一对；这一关我们要学习它的消去规则——如果别人给了你一个打包好的序对，怎样用“sigma_ind”积木把它“拆包”并取出里面的第一项？

而且这一关的序对是更强大的完全体——“依赖对（Σ 类型）”，写作 Σ (x : A). B x！
还记得第 7 关的依赖函数 Π 吗？在依赖对 Σ (x : A). B x 中，盒子左格子里装的是第一项 x : A，而右格子里装的第二项的类型是 B x——也就是说，第二项是什么类型，取决于第一项装的具体是谁！
本关的目标类型是 (Σ x : A. B x) → A：请你造一台函数机器（别忘了目标是带箭头的函数类型，最外层要先用 λ 接收那个包裹！），它接收一个依赖对包裹，然后把里面的第一项（类型 A）取出来返回。

当你把消去子积木“sigma_ind”放进函数体时，会看到三个需要填写的区域，我们一层一层来读懂它：
1. 第一行“p =”槽：放入你要拆开的那个序对包裹（就是外层 λ 刚收到的那个参数）。
2. 第二行“目标族 λ _ ▸”槽：用来向检查器声明“整个拆包过程最终想要产出什么类型”。本关无论拆哪个包裹，最终都只想要一个类型 A 的结果。
3. 第三行“归纳步骤 λ a λ b ▸”槽：这是真正动手拆包的地方！sigma_ind 已经贴心地帮你把包裹拆开，变出了两个局部变量——代表左格子的第一项 a（类型为 A）和代表右格子的第二项 b（类型为 B a）。站在这一行的插槽里，想想该把拆出来的哪一项交出去，才能满足目标要求的 A？`,
    en: `In the last level you packed two items into a pair. Now let's learn the elimination rule for pairs: given a packaged pair, how do we unpack it with “sigma_ind” to extract its first component?

Notice that the input type here is a full “dependent pair (Σ-type)”, written Σ (x : A). B x!
Just as in a dependent function (Π), in a dependent pair the type of the second component B x depends on the specific value x stored in the first component.
Your goal is the function type (Σ x : A. B x) → A: build a function (don't forget to start with an outer λ to receive the pair!) that takes a dependent pair and returns its first component of type A.

Inside that function, the eliminator block “sigma_ind” unpacks a pair using three slots:
1. The “p =” slot: the pair term you want to unpack (the parameter received by your outer λ).
2. The “motive λ _ ▸” slot: a type expression stating what result type the entire unpacking operation should produce. Here, no matter which pair we unpack, we always want a result of type A.
3. The “step λ a λ b ▸” slot: the unpacking step itself! The block automatically binds two local variables for the unpacked contents—the first component a : A and the second component b : B a. Inside this step slot, decide which of those unpacked components to return.`
  },
  L14: {
    'zh-CN': `上一关我们用 sigma_ind 从依赖对里取出了第一项（相当于定义了投影函数 fst）；这一关我们趁热打铁，来写一个取出“第二项”的函数（相当于投影函数 snd）！

先看本关的目标类型：(A × B) → B。也就是说，我们要建造一台函数机器，它接收一个普通序对 A × B，然后返回里面类型为 B 的第二项。

这里有一个很自然的问题：“为什么对依赖对 Σ (x : A). B x 不能直接毫无条件地取出第二项，而对普通积类型 A × B 却可以轻松取出第二项得到类型 B 呢？”
想一想就能明白：在上一关的依赖对 Σ (x : A). B x 里，第二项的类型 B a 死死依赖于第一项的具体值 a；而在本关的普通积类型 A × B（即 Σ (_ : A) × B）里，第二项的类型就是固定不变的 B，根本不依赖第一项是谁！因此，整个函数的返回类型就可以干脆利落地写成固定的 B。

搭建的整体骨架和上一关几乎一模一样：最外层用 λ 接收序对包裹，函数体里放 sigma_ind 来拆包。但请特别留意最后两行：这一次我们整个拆包过程想要的目标类型（“目标族 λ _ ▸”槽）变成了谁？而在“归纳步骤 λ a λ b ▸”拆出左格子 a 和右格子 b 之后，又应该返回哪一个局部变量呢？`,
    en: `In the previous level, you used sigma_ind to extract the first component of a pair (defining the first projection, fst). Now let's build the companion function that extracts the second component (defining snd)!

Look at the target type: (A × B) → B. You need to construct a function that accepts a pair of type A × B and returns a result of type B.

Why did we switch from a dependent pair Σ (x : A). B x in the last level to a simple product A × B here?
Because in a dependent pair, the second component's type B a mentions the first component a—so you cannot even state the second component's type without knowing the first component! In an ordinary product A × B (which is just a Σ-type whose second type B ignores the first component), the second component always has the fixed type B.

The overall blueprint is just like the previous level: use an outer λ to receive the pair, and use sigma_ind inside its body to unpack that pair into two local variables a and b. This time, however, check carefully what result type the “motive λ _ ▸” slot should declare, and which unpacked variable the “step λ a λ b ▸” slot should return!`
  },
  L15: {
    'zh-CN': `在数学和逻辑里，我们每天都在写等式，比如“2 + 2 = 4”或者“a = a”。但是在类型论中，并没有一个独立于类型系统之外的“等号判断”——相反，马丁-洛夫提出了一个惊艳的想法：把“两个东西相等”这件事本身，也变成一种类型！

这就是本关的主角：“恒等类型（Identity Type，也叫相等类型）”，写作 Id A a a。
我们来拆解一下 Id 后面的三个部分：
1. 第一个参数 A：指明我们要比较的两个对象共同属于哪个类型（必须在同一个类型里才能谈论相等）；
2. 第二个参数 a：等号左边的项；
3. 第三个参数 a：等号右边的项。
所以，Id A a a 读作：“在类型 A 中，对象 a 与对象 a 相等”这一命题所对应的类型！

既然“相等命题”是一个类型，那么“证明这个等式成立”在类型论里意味着什么呢？没错——就是去构造一个属于 Id A a a 这个类型的“项”（证明项）！
那么，怎样造出一个恒等类型的证明项呢？（即恒等类型的“引入规则”）：
最基本的一条公理叫作“自反性（Reflexivity）”：世间万物都等于它自己。只要等号左右两边的项一模一样（或者经过计算后能化简成一模一样的结果），左侧工具箱里的“refl”积木就能直接作为它们相等的证据！分清“表示相等命题的 Id 积木”与“提供相等证据的 refl 积木”，看看本关的答案槽需要哪一个吧。`,
    en: `In everyday math, we write equations like “a = a” all the time. How do we express equality inside type theory? Martin-Löf's brilliant answer was to turn an equality statement itself into a type!

Meet the “Identity Type”, written Id A a a in our goal. Let's read the three pieces after Id:
1. The first part, A, states the common type to which both sides of the equation belong.
2. The second part, a, is the left-hand side of the equation.
3. The third part, a, is the right-hand side of the equation.
Together, Id A a a represents the proposition “within type A, the term a is equal to the term a”.

If an equality statement is a type, what does it mean to prove that two things are equal? It means constructing a term (a proof!) that inhabits that identity type!
And what is the introduction rule for the identity type? It is the law of “reflexivity”, represented by the block “refl”: every object is equal to itself. Whenever the left and right endpoints of an Id type are the same (or compute to the exact same value), refl serves as a direct proof of their equality. Distinguish the Id block (which writes the equality claim) from the refl block (which proves it), and look at what the empty slot on the left of the colon needs.`
  },
  L16: {
    'zh-CN': `恭喜你走到了基础篇的最后一关！回想一下我们在第 0 关见过的声明 A : Type，以及第 6、7 关里我们把类型 A、B 当作普通积木一样拖进插槽的操作。在 MLTT 中，“类型本身也是项（Types are terms）”——类型不仅可以放在冒号右边用来约束别人，它自己也可以放在冒号左边，作为一个被讨论、被计算的对象！

但这立刻会引出一个让人脑洞大开的哲学问题：既然在类型论里“每一个项都必须有它的类型”，而“类型本身也是一个项”，那么——Type 自己的类型又是什么呢？
能不能直接规定 Type : Type（自己属于自己）？不行！20 世纪初著名的“罗素悖论”（所有不包含自身的集合组成的集合是否包含自身）和类型论中的“吉拉德悖论”证明了：如果允许一个容纳所有类型的盒子直接装下它自己，整个逻辑系统就会产生矛盾而崩溃！

为了解决这个危机，马丁-洛夫设计了优雅的“宇宙层级（Hierarchy of Universes）”：
• 第 0 层宇宙 Type 0（平时简写为 Type）：装着我们熟悉的普通类型，比如单元类型 1、空类型 0、自然数类型等；
• 第 1 层宇宙 Type 1：专门用来装 Type 0（也就是说，Type 0 : Type 1），以及那些涉及 Type 0 的大家伙；
• 第 2 层宇宙 Type 2：用来装 Type 1（即 Type 1 : Type 2）……就这样像俄罗斯套娃一样，一层套一层，永无止境地向上延伸！

现在看看本关的判断卡：冒号右边的目标类型是“Type 1”，要求你在冒号左边放入一个属于 Type 1 的项。观察一下左侧工具箱里的宇宙积木 Type 以及它上面的层级数字，想一想几号宇宙恰好住在 Type 1 里面呢？`,
    en: `Welcome to the final level of the main sequence! Looking back, you have seen declarations like A : Type, and in levels 6 and 7 you dragged types like A and B into slots just like ordinary terms. In MLTT, types are first-class citizens: a type can sit on the right of a colon to classify other terms, or sit on the left of a colon as a term in its own right!

That naturally raises a deep question: if every term in type theory must have a type, and types are themselves terms, what is the type of Type?
Could we simply say Type : Type? No! Just like Russell's Paradox in set theory (“the set of all sets that do not contain themselves”), allowing a single universe of types to contain itself leads to logical contradictions (Girard's Paradox) that break the soundness of the system.

Martin-Löf solved this with an infinite “hierarchy of universes”:
• Type 0 (often abbreviated simply as Type) is the ground-floor universe containing ordinary types like 1, 0, and A × B.
• Type 1 is the next universe up, and Type 0 lives inside it as an element: Type 0 : Type 1.
• Type 2 contains Type 1 (Type 1 : Type 2), and so on upward forever, like infinitely nested Russian dolls!

In the judgment on your canvas, the target type to the right of the colon is Type 1. Look at the universe block in the toolbox and its level number: which universe level belongs inside Type 1?`
  },
  R0: {
    'zh-CN': `欢迎来到推导规则篇！在前面的关卡里，当你把函数 f 和参数 x 放进“应用”积木时，幕后的类型检查器会自动帮你核对它们是否合法。而在这一关，我们要揭开类型检查器的幕后黑盒，亲手把一步完整的“形式推理规则（Inference Rule）”搭建出来！

看看画布中央这张带有长横线的大卡片，它是逻辑学与类型论中最经典的“自然演绎推理图”，结构就像一个分数：
1. 最顶部的“共同条件（Γ）”：列出了这一步推理共享的已知声明（类型 A、B，函数 f : A → B，以及参数 x : A）。符号 Γ（读作 Gamma）就是这整组共同条件的代称。
2. 横线上方的“前提（Premises）”：要想发动一条推理规则，你得先把所需的原材料摆到横线上方。本关已经为你留好了两个前提插槽。
3. 横线右侧的“规则（Rule）”：写明你凭什么能从横线上方的材料推出横线下方的结果？在类型论中，构造一个函数的规则叫“Π-引入（Π-intro）”，而使用（应用）一个函数的规则就叫“Π-消去（Π-elim）”。
4. 横线下方的“结论（Conclusion）”：是一张形如“Γ ⊢ ? : B”的紫色判断卡，用来展示应用该规则后最终推导出的项及其类型。

试着按“摆好两个前提（谁是函数、谁是参数）→ 选定推理规则（Π-elim）→ 在下方写出应用后的结论项”这三步来读懂整张推导图吧！检查器会严密核对你的前提、规则和结论三者是否严丝合缝。`,
    en: `Welcome to the inference-rule levels! Up to now, whenever you snapped a function f and an argument x into an application block, the type checker silently applied a rule behind the scenes to verify your work. This level pulls back the curtain so you can assemble an explicit “inference step” yourself!

The large card with a horizontal bar in the center of the canvas is a formal deduction step, structured like a fraction in logic:
1. Shared context (Γ) at the very top: lists all given declarations available to this step (A, B, f : A → B, and x : A). The Greek letter Γ (Gamma) stands for this shared context.
2. Premises above the horizontal bar: the ingredients required before the rule can fire. Two premise slots are waiting above the bar.
3. Rule slot to the right of the bar: names the logical law that justifies stepping from the premises to the conclusion. In MLTT, building a function is called Π-introduction, while applying a function is called “Π-elimination” (written Π-elim).
4. Conclusion below the horizontal bar: a purple judgment card Γ ⊢ ? : B stating the final term produced by this rule and its resulting type.

Examine how the two premises above the bar, the rule name beside the bar, and the constructed term in the conclusion below the bar all fit together to justify one step of function application.`
  },
  R1: {
    'zh-CN': `这一关是上一关 R0 的“完全形态”。对比一下两关的横线上方：在 R0 里，横线上方的两个前提插槽里我们只简单放了项（f 和 x）；但在真正的类型论教材与论文里，横线上方的每一个前提，本身也必须是一张完整的“判断（Judgment）”！

为什么前提必须是判断呢？因为光把一个名字 f 摆在横线上是不够的，我们必须同时在前提里明确断言：“在条件 Γ 下，f 确实具有函数类型 A → B（即 Γ ⊢ f : A → B）”，以及“在条件 Γ 下，x 确实具有参数类型 A（即 Γ ⊢ x : A）”。只有当这两个前提判断都成立时，横线右侧的 Π-elim 规则才能名正言顺地推导出横线下方的结论判断：“在条件 Γ 下，应用项 f x 具有类型 B（即 Γ ⊢ f x : B）”！

观察画布上嵌套在横线上方的两张紫色判断卡，以及横线下方的第三张紫色判断卡，请理清这里的“两层结构”：
• 每一张紫色小卡片内部，都有自己的“条件 Γ ⊢ 项 : 类型”结构；注意它们内部 Γ 旁边的可选附加条件槽是留空的，这表示它们直接沿用最顶部的共同条件 Γ，不需要你重复添加声明。
• 而大卡片中间的那条大横线，则是把上面两张“前提判断卡”和下面那张“结论判断卡”连接成一步完整的逻辑推理。

分别看看三张紫色判断卡冒号右边的类型要求（第一张要 A → B，第二张要 A，下方第三张要 B），再来补全每张判断卡里的项以及横线旁边的规则名称吧！`,
    en: `This level presents the inference step from R0 in its full textbook form. Compare the area above the horizontal bar with the previous level: in R0, the two premises above the bar were written in shorthand as bare terms. In formal type theory, however, every premise above an inference bar is itself a complete “judgment” of the form Γ ⊢ term : type!

Why write full judgments as premises? Because to justify function application, it is not enough merely to mention f and x—the premises must establish their types:
• First premise judgment: Γ ⊢ f : A → B (“under context Γ, f has function type A → B”).
• Second premise judgment: Γ ⊢ x : A (“under context Γ, x has argument type A”).
Once both premise judgments are established, the rule Π-elim beside the bar justifies the conclusion judgment below the bar: Γ ⊢ f x : B (“under context Γ, the application f x has type B”).

Keep the two structural levels clear as you read the diagram:
• Inside each purple judgment card, the symbol ⊢ connects that card's context Γ (which automatically inherits the shared declarations at the top when its optional extra-condition slot is left empty) to a term and its type.
• Across the outer card, the long horizontal bar connects the two premise judgments above to the conclusion judgment below.

Check the required type on the right of each purple judgment card, then complete the missing terms and the rule slot.`
  }
};
