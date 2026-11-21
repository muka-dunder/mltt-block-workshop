// Worked reasoning shown while a reference answer is on the canvas.
export const ANSWER_TUTORIALS = {
  L0: {
    'zh-CN': `现在画布上已经放好了标准答案：答案槽里只有一个积木 x。让我们一步步顺着类型检查器的思路，看看为什么这么填就通过了。

1. 先看题目要什么：判断卡下方写着“? : A”，意思是冒号左边必须填入一个“具有类型 A 的项”。
2. 再看条件区有什么：顶部以符号 Γ（Gamma，表示“上下文 / 已知条件”）开头，紧接着声明了 A : Type 0（A 是一个类型）和 x : A（x 是已经存在的一个项，它的类型恰好就是 A）。
3. 为什么直接放 x 就行？因为题目已经把现成的 x : A 交到了你的手边，不需要额外加工。从左侧已知符号区把 x 拖进答案槽，点击“检查”，判断就变成了 x : A——完全符合要求！

你可以试着点击答案槽里的 x，观察下方的类型提示。记住一个关键区别：A 是“类型标签”，x 才是属于 A 的“具体对象”。如果错把 A 填进去，检查器就会报错，因为 A 的类型是 Type，而不是 A 自己。`,
    en: `The reference answer is now on the canvas: just the single block x inside the answer slot. Let's trace step by step why this solves the puzzle.

1. Read what the goal asks for: the bottom of the judgment card reads “? : A”, meaning the slot on the left of the colon needs a term of type A.
2. Check what the context supplies: at the top, introduced by Γ (Gamma, standing for the “context” of known assumptions), A : Type 0 tells us A is a type, and x : A gives us a ready-made term named x whose type is already A.
3. Put them together: because we already have an object of type A in hand, we don't need to build anything new. Dragging x from the given symbols on the left into the answer slot turns the judgment into x : A, which checks immediately.

Try clicking the x block on the canvas to inspect its type. Notice the key distinction: A is the name of the category (a type), while x is the concrete item belonging to it (a term). Putting A into the term slot would fail, because A has type Type, not type A.`
  },
  L1: {
    'zh-CN': `画布上展示的答案是 λx. x——这就是大名鼎鼎的“恒等函数（Identity Function）”。一步步来看它是怎么满足目标 A → A 的：

1. 为什么一定要用 λ？题目条件里只给了类型 A，一个 A 类型的项都没给，我们不可能无中生有。但目标类型 A → A（即 Π (x : A) → A）代表一台函数机器：“只要给我一个 A，我就还你一个 A。”用 λ 积木就能把“假设未来会收到的那个输入”先请进门来。
2. 参数类型从哪来？当你把 λ 放进目标为 A → A 的答案槽时，类型检查器会自动推导出这个参数 x 的类型就是 A，并在 λ 内部开放一个局部变量 x。
3. 函数体里填什么？既然我们已经拿到了输入 x : A，而机器又要求吐出一个 A 类型的结果，最直接的做法就是把收到的 x 原封不动地交出去！

于是就组成了 λx. x：“收到什么，就返回什么”。顺便留意作用域规则：这个 x 只在 λ 的函数体里面有效；如果你把 x 拖到 λ 外面，它立刻就会失效，因为离开机器内部就再也看不见这个局部参数了。`,
    en: `The answer on the canvas is λx. x—the famous “identity function”. Let's walk through how each piece satisfies the goal A → A:

1. Why start with λ? The context only declares the type A and gives us no elements of A. However, the goal A → A (short for Π (x : A) → A) asks for a function machine: “Give me an A, and I will return an A.” Putting a λ block in the answer slot creates that machine and gives us access to its future input.
2. Where does x get its type? Because the goal expects A → A, the type checker automatically knows that the parameter x bound by λ must have type A, and makes x available inside the λ body.
3. What goes in the body? Inside the body, we now have x : A in scope and need to return a term of type A—so we simply hand x straight back!

That produces λx. x: a function that returns whatever input it receives, working for any type A. Remember the scope boundary too: x only exists inside this λ's body; dragging x outside the λ makes it out of scope.`
  },
  L2: {
    'zh-CN': `参考答案写着 λy. x。仔细看：这个函数的参数叫 y，可函数体里返回的却是 x！为什么这样完全合法呢？我们拆开来看：

1. 先满足函数外形：目标类型是 B → A，它要求一台“吃进一个 B，吐出一个 A”的函数机器。所以最外层放一块 λ 积木，把新接收的参数命名为 y。根据目标类型，检查器自动确定 y : B。
2. 走进函数体找结果：进入 λ 的函数体后，当前目标变成了“交出一个类型为 A 的项”。此时我们手头其实有两个变量可用：
   • 刚收到的内层参数 y : B（类型不对，不是我们要的 A）；
   • 题目顶部外层条件早就给好的 x : A（一直都在视野里，而且类型正好是 A！）。
3. 选对变量放进去：函数完全有权忽略自己的参数 y，直接把外层可见的 x 返回出去，这就得到了常函数 λy. x（“不管你投给我什么 B，我永远只返回那个 x”）。

这道题想告诉你两件事：第一，作用域是可以嵌套的，内层函数体看得到外层变量；第二，判断一个变量能不能填进去，关键看它的“类型”是否匹配目标，而不是看它是不是最新引入的那个名字。`,
    en: `The completed answer is λy. x. Notice that the function takes a parameter named y, yet ignores it and returns x! Let's see why that works cleanly:

1. Match the function shape: the goal B → A asks for a machine that accepts a B and produces an A. Placing a λ block in the answer slot introduces the input y, and the goal determines that y : B.
2. Look around inside the body: inside the λ body, we now need to produce an A. Two variables are visible in scope here:
   • The inner parameter y : B (wrong type—we need an A, not a B);
   • The outer declaration x : A from the top context (still visible inside λ, and its type is A!).
3. Return the outer variable: a function is never forced to use its input. Returning x produces the constant function λy. x—“no matter which B you give me, I always return x.”

This illustrates two lessons at once: scopes nest (inner bodies can still reach outer declarations), and choosing the right variable is always about matching the required type, not just grabbing the newest variable.`
  },
  L3: {
    'zh-CN': `画布上的答案是应用表达式 f x。如果你曾经用过函数，这就像在写 f(x)，只是在类型论里习惯把括号省掉，用空格把函数和参数连起来。

让我们对照积木的两个插槽来读一遍：
1. 左边（函数位置）放 f：条件区告诉我们 f : A → B，也就是说 f 是一台“吃进 A、吐出 B”的机器，符合函数位置的要求。
2. 右边（参数位置）放 x：条件区告诉我们 x : A，这正是机器 f 说明书里指明要吃的原料类型！
3. 合起来的结果：通过“应用”积木把 x 喂给 f 后，整块 f x 产出的结果就自动拥有了类型 B，刚好命中题目的目标 B。

试试看把左右两个积木的含义记牢：函数永远在左，参数永远在右。假如不小心反过来把 x 放在左边、f 放在右边，类型检查器立刻就会拦住你，因为 x 的类型是 A，它只是一份普通原料，根本不是一台能接收参数的函数机器。`,
    en: `The reference answer on the canvas is the application f x. If you've seen functions in math or programming, you can read this just like f(x)—in type theory we simply write the function and its argument side by side.

Let's check both slots of the application block:
1. Left slot (function): holds f. From the context f : A → B, we know f is a function machine expecting an A and returning a B.
2. Right slot (argument): holds x. From x : A, we know x has the exact input type that f requires.
3. Combined result: applying f to x produces a term of type B, matching the goal B!

Keeping the two positions straight is essential: the function always goes on the left, and its argument goes on the right. If you swapped them and placed x on the left, the type checker would reject it immediately, because x has type A and is not a function.`
  },
  L4: {
    'zh-CN': `参考答案看起来像套了两层壳：(f x) y，通常简写成 f x y。为什么一定要按“先包 f x，再包 y”的顺序嵌套，而不是把 x 和 y 先拼在一起呢？我们一层一层剥开来看类型变化：

1. 第一层（内层应用 f x）：
   • 已知 f : A → B → C，也就是 A → (B → C)。
   • 当我们用内层应用积木把 x : A 喂给 f 时，消耗掉了第一个箭头 A → ...，于是 f x 的类型变成了 B → C！
   • 注意：此时 f x 本身变成了一台“等待输入 B、准备输出 C”的新函数机器。
2. 第二层（外层应用 (f x) y）：
   • 既然整块 f x 是一台类型 B → C 的函数机器，我们就可以把它放进外层应用积木左边的“函数位置”；
   • 然后把 y : B 放进外层应用积木右边的“参数位置”；
   • 喂入 y 后，剩下的箭头 B → C 也被消耗掉，最终得到类型 C！

你可以试着在画布上分别点选内层的 f x 和外层的 (f x) y，看看类型面板里它们各自的类型是不是从 B → C 一步步变成 C 的！这也是为什么不能先写 x y：因为 x 的类型只是 A，不是函数，根本吃不下 y。`,
    en: `The reference answer nests two application blocks: (f x) y, usually written f x y. Let's trace the type step by step to see why the nesting has to go in this order:

1. Inner application (f x):
   • We are given f : A → B → C, which groups to the right as A → (B → C).
   • Feeding x : A to f inside the inner application block uses up the first arrow, so the whole block f x now has type B → C.
   • That means f x is itself a brand-new function waiting for a B!
2. Outer application ((f x) y):
   • Because f x has function type B → C, it fits neatly into the left (function) slot of the outer application block.
   • We then place y : B into the right (argument) slot of the outer block, consuming the second arrow and leaving a final result of type C!

Click the inner f x block and then the outer application block on the canvas to watch the type change from B → C to C. And notice why we could never combine x and y first as x y: x has type A, not a function type, so it cannot take y as an argument.`
  },
  L5: {
    'zh-CN': `看看画布上的答案：只有一块应用积木，里面拼着 f x。比上一关还要简洁！为什么只用喂一个参数就大功告成了呢？

1. 读懂条件和目标：f 的类型是 A → B → C，按右结合展开就是 A → (B → C)。而本关的目标类型恰恰就是括号里的那半截：B → C！
2. 观察“部分应用”的威力：当你用应用积木把 x : A 喂给 f 时，f 吃掉了第一个参数 A，吐出来的返回值正好就是一个类型为 B → C 的函数！既然这已经完全符合目标要求，我们就不需要多此一举再去套一层 λ，也不用去找本来就不存在的 y。

在类型论和函数式编程中，把接收多个参数的函数拆成“一次接收一个参数、并交出等待下一个参数的函数”的技巧，叫作“柯里化（Currying）”；而像 f x 这样只传了一部分参数的写法，叫作“部分应用（Partial Application）”。这说明：一个应用表达式的结果，同样可以是一台正儿八经的函数！`,
    en: `Look at the completed answer: just a single application block forming f x—even simpler than the previous level! Why is one application already enough?

1. Match the goal to the arrows: f has type A → B → C, which means A → (B → C). Meanwhile, our goal is B → C—literally the second half of f's type!
2. Partial application in action: applying f to x : A satisfies the first input A and immediately returns a function of type B → C. Because that already matches the target type B → C, we don't need to invent a y or wrap everything in a λ.

Turning a multi-argument function into a chain of single-argument functions is called “currying”, and supplying only the first argument (as in f x) is called “partial application”. It shows that the result of applying a function doesn't have to be plain data—it can itself be another function ready for its next input!`
  },
  L6: {
    'zh-CN': `这关的答案简简单单，就是冒号右边的那个符号积木 B。回顾一下为什么不是再拼一次 f x，而是填 B：

1. 看清空槽站在冒号的哪一边：判断卡写成“Γ ⊢ f x : ?”。冒号左边（项的位置）已经被题目锁死为 f x 了；留空等待你填写的，是冒号右边（类型的位置）！也就是说，本题不是让你“构造项”，而是让你做“类型推断（Type Inference）”——回答“f x 这个表达式属于什么类型”。
2. 动手推算一遍：条件里给出 f : A → B（吃 A 吐 B）和 x : A（刚好是个 A）。因此，把 f 应用于 x 得到的表达式 f x，它的结果类型自然就是 B。
3. 把 B 填进类型空槽：从左侧条件区拖出类型符号 B，放到冒号右边，整个判断就成了合法的 f x : B。

这是一个特别重要的思维习惯：读每道题时，先瞄一眼空槽在冒号左边还是右边。在左边是在“造东西（写程序/写证明）”，在右边是在“报类型（写规格/写命题）”。类型自身也可以用符号积木来表示哦。`,
    en: `The answer here is simply the symbol block B in the slot to the right of the colon. Let's check why the right answer is B rather than building f x again:

1. Check which side of the colon is empty: the judgment reads “Γ ⊢ f x : ?”. The term f x on the left is already supplied and locked; the empty slot is on the right side of the colon, which is the TYPE position! So this puzzle asks you to perform “type inference”—figuring out what type the expression f x has.
2. Compute the type: from f : A → B and x : A, applying f (which takes an A and returns a B) to x produces a result of type B.
3. Submit the type: dragging the symbol B from the left into the type hole completes the true judgment f x : B.

Always notice which side of the colon is empty: the left side asks you to build a term (a program or proof), while the right side asks you to name a type (a specification or proposition)—and types can be placed directly as blocks too.`
  },
  L7: {
    'zh-CN': `画布上冒号右边的答案，是一块由 B 和 a 组成的应用积木：B a。为什么一个“类型”位置里也会出现“函数应用”呢？这正是依赖类型的精彩之处！

我们按步骤追踪一下类型检查器是怎么算的：
1. 先看函数 f 的接口：f : Π (x : A) → B x。和普通箭头 A → B 不同，这里的返回类型写着“B x”——它用到了输入变量 x 的名字！
2. 进行参数替换：当左侧给定的项把具体参数 a 传给 f（写成 f a）时，f 的返回类型也要同步把 x 替换成实际传入的参数 a，于是结果类型就变成了 B a。
3. 为什么不能只填一个单独的 B？看看条件区 B 的类型：B : A → Type。这说明单独的 B 还只是一台“吃进 A 才能产出类型”的类型族（函数），它自己并不是一个具体类型（Type 0）。只有用应用积木把 a 喂给 B，组成的 B a 才真正产出一个具体的类型！

选一下冒号右边的 B a 看看：题目左边的 f a 是项层面的应用，而右边填的 B a 则是类型层面的应用，两者配合得天衣无缝！`,
    en: `In the type slot on the right of the colon, the answer is the application block B a. Seeing a function application inside a TYPE slot might look surprising at first—that is the magic of dependent types!

Let's trace how the type checker computes it:
1. Read f's dependent type: f : Π (x : A) → B x. Unlike an ordinary arrow A → B, the return type B x mentions the input variable x.
2. Substitute the actual argument: in the given term f a, the function f is being applied to the specific argument a. Replacing x with a in the return type B x tells us that f a has type B a.
3. Why isn't bare B enough? Look at B's declaration: B : A → Type. B is a type family—a machine waiting for an A before it produces a type! Only when you apply B to a using an application block do you get the concrete type B a.

Compare both sides of the colon now: f a on the left is an application at the term level, and B a on the right is the matching application at the type level.`
  },
  L8: {
    'zh-CN': `答案槽里静静地躺着一颗五角星 ★——这就是单元类型 1 的全部秘密。

让我们把刚才学的“类型 vs 项”对应到这一关：
1. 冒号右边的 1 是“单元类型”的名字（好比一个只准装一颗星星的盒子）。
2. 冒号左边需要一个属于类型 1 的“项”。根据单元类型的引入规则 ★ : 1，五角星 ★ 就是单元类型唯一且标准的规范元素。
3. 从工具箱拖出 ★ 放进答案槽，判断就变成了 ★ : 1，检查直接通过！

顺便提示一下容易踩的小坑：工具箱里同时有“1”和“★”两块积木。千万别把“1”放进答案槽里——“1”是类型（盒子），它的类型是 Type 0，而不是 1；“★”才是真正住在里面的那个项（物品）。记住这组搭档，接下来两关马上就会用到它！`,
    en: `Sitting in the answer slot is a single star ★—the simplest data constructor in all of MLTT.

Let's connect the roles on both sides of the colon:
1. The 1 on the right side is the “unit type” itself (a category containing only one canonical object).
2. The empty slot on the left side asks for a term belonging to 1. By the unit introduction rule ★ : 1, the star ★ is that canonical element.
3. Dragging ★ into the answer slot gives the valid judgment ★ : 1.

Watch out for a common mix-up: the toolbox contains both 1 and ★. The block 1 is the type itself (which has type Type 0), whereas ★ is the element inside it (which has type 1). Remember this pair—the next two levels will show how to consume and compute with it!`
  },
  L9: {
    'zh-CN': `画布上的答案是 ind_unit u C c，由三层普通的函数应用积木嵌套而成。它就像把一个未知的单元值 u，安全地翻译成我们在 ★ 处早就准备好的答案 c。让我们从最内层开始，一步步向外读懂类型是如何变化的：

1. 第 1 层应用（ind_unit u）：把未知的单元值 u : 1 喂给函数 ind_unit。此时它变成了一台还在等待“类型族”和“基本情况”的半成品函数。
2. 第 2 层应用（(ind_unit u) C）：接着传入目标类型族 C : 1 → Type。它告诉 ind_unit：“对于任意单元值 x，我想要的最终类型是 C x”，于是剩下最后一个参数的类型就确定成了基本情况 C ★！
3. 第 3 层应用（((ind_unit u) C) c）：最后传入基本情况 c : C ★，所有参数齐全，整个表达式的结果类型就恰好变成了我们想要的 C u！

你也可以试着分别点选只套了一层或两层应用的内层积木，观察类型面板的变化——这就是为什么我们把消去子做成“柯里化函数”：它能像普通函数一样部分应用！还要记得：因为 u 还是一个未知变量，所以表达式不会直接化简成 c；只有当输入真正算成 ★ 时，才会触发下一步的计算规则。`,
    en: `The completed answer is ind_unit u C c, built by nesting three ordinary application blocks. It safely extends the base case c (which works at ★) to any arbitrary unit value u. Let's trace the types from the innermost application outward:

1. First application (ind_unit u): feeds the unknown variable u : 1 into ind_unit, leaving a function waiting for a type family and a base case.
2. Second application ((ind_unit u) C): feeds the motive family C : 1 → Type, telling ind_unit that for each unit value x we want a result of type C x—so the remaining input type specializes to C ★.
3. Third application (((ind_unit u) C) c): supplies the base case c : C ★, completing all three arguments and producing a term of type C u!

Try selecting the inner partial applications on the canvas to watch how the remaining function type updates at each step. Because u is still an abstract variable, the expression does not automatically simplify to c—that computation happens only when the first argument is the canonical element ★.`
  },
  L10: {
    'zh-CN': `画布上冻结好的应用骨架已经把最里层的 ind_unit 接好，三个空槽分别填入了 ★、C 和 c，组成 ind_unit ★ C c。

也许你会好奇：“条件区里明明已经现成放着 c : C ★ 了，目标也是 C ★，为什么这关要锁住一层应用骨架、偏偏让我们写成 ind_unit ★ C c 呢？”
原因就在“计算规则（Computation Rule）”！
当消去函数 ind_unit 的第一个参数不再是抽象变量 u，而是货真价实的规范元素 ★ 时，它就会触发计算并归约回基本情况：
ind_unit ★ C c ≡ c
也就是说，ind_unit ★ C c 和 c 不仅类型都是 C ★，而且它们在计算意义上是“定义相等（≡）”的！

留意一下这关的设计：不需要任何特殊的“消去子专用大卡片”，仅靠普通的 ind_unit 函数符号和三块函数应用积木，就能把“引入（★）遇到消去（ind_unit）”的计算规则清清楚楚地拼出来。`,
    en: `With the frozen application skeleton filled in, the canvas shows ind_unit ★ C c—built purely from the function symbol ind_unit and three ordinary application blocks with arguments ★, C, and c.

You might wonder: “Since c already has type C ★ and the goal is C ★, why did this level lock an ind_unit application skeleton here instead of letting me submit c directly?”
To demonstrate the unit type's “computation rule”!
Whenever the first argument to ind_unit is the canonical element ★ itself, the eliminator immediately reduces back to the base case:
ind_unit ★ C c ≡ c
That means ind_unit ★ C c and c both have type C ★ and are definitionally equal (≡) by computation.

Notice how clean the machinery is: instead of needing a dedicated multi-slot eliminator card, ordinary function application around ind_unit captures the entire interaction between introduction (★) and elimination.`
  },
  L11: {
    'zh-CN': `这关的答案非常干脆：一块 absurd 积木，里面接上条件区的假设 e，组成 absurd e。

让我们理清这背后的逻辑美感：
1. 空类型 0 没有任何构造函数，所以你永远不可能亲手捏出一个 0 类型的项。
2. 但本题的条件区给你提供了一个“反证假设” e : 0（就好像在反证法里，我们先假设推出了一条矛盾）。
3. 拿到 e : 0 后，把它放进 absurd 积木里，absurd 就会利用“空类型没有需要讨论的情况（0 个分支）”这条消去规则，直接变出目标位置所要求的任意类型 A 的项！

你可以试着点选答案槽里的 absurd e，看看它推断出的类型是不是已经自动变成了 A。记得分清两件事：absurd 负责“使用”一个已有的空类型假设 e，而不是“凭空造出”一个 0 类型的元素；如果没有条件区给你的 e : 0，任何人都填不出 absurd 的插槽哦。`,
    en: `The completed answer is short and crisp: absurd e.

Let's appreciate why this works:
1. Because the empty type 0 has no introduction rule, you can never construct an element of 0 from nothing.
2. However, the context supplies a hypothesis e : 0—much like assuming a contradiction in a proof by contradiction.
3. Passing e to the absurd block invokes empty elimination: since type 0 has zero possible constructors, there are zero cases to handle, so absurd e immediately produces a term of whatever target type A the judgment requests!

Click the absurd e block on the canvas and watch its checked type match A. Keep the boundary clear too: absurd consumes an existing contradiction e : 0 from your context; it can never create an element of 0 out of thin air.`
  },
  L12: {
    'zh-CN': `参考答案用配对积木 ⟨ , ⟩ 把 a 和 b 装在了一起：左槽放 a，右槽放 b，组成 ⟨a, b⟩。

对照一下目标类型 A × B，看看为什么顺序和积木都不能错：
1. 为什么用配对积木 ⟨ , ⟩ 而不用 Σ 积木？因为空槽在冒号左边（项的位置），我们要交出一份“打包好的实物”，而不是“打包盒的规格书（类型）”。Σ 积木是用来写类型 A × B 的，⟨ , ⟩ 才是用来造序对的！
2. 为什么 a 在左、b 在右？目标 A × B（即 Σ (_ : A) × B）明确规定第一部分必须具有类型 A，第二部分必须具有类型 B。条件里恰好给了 a : A 和 b : B，对号入座放进左右两格，类型检查就顺利通过了。

就像逻辑里的“且（合取）”一样：想要证明 A × B 成立，就必须把 A 的证据 a 和 B 的证据 b 一起打包呈上来。下一关我们就要把这样打包好的包裹拆开了！`,
    en: `The reference answer uses a pair block ⟨ , ⟩ with a on the left and b on the right, forming ⟨a, b⟩.

Let's check why both the choice of block and the order of its slots matter:
1. Why the pair block ⟨ , ⟩ instead of Σ? The empty slot is on the left of the colon, so we need a term (an actual pair), not a type specification! Σ builds the pair type A × B, whereas ⟨ , ⟩ constructs an element of that type.
2. Why a on the left and b on the right? The goal A × B specifies an A in the first position and a B in the second position. Matching a : A to the left slot and b : B to the right slot satisfies both requirements.

Just like logical conjunction (“A and B”), proving A × B means bundling together a proof of A and a proof of B. In the next level, we'll learn how to unpack a pair back into its pieces!`
  },
  L13: {
    'zh-CN': `这关的答案写成：λp. ind_sigma A B p (λ_. A) (λa. λb. a)。别看一长串应用套在一起，我们从外到内按 5 步拆开，每一块积木的用意都非常清楚：

1. 外层 λ 引入参数 p：目标是函数类型 (Σ x : A. B x) → A，所以先用 λ 接收传入的依赖对，命名为 p : Σ x : A. B x。
2. 传入包裹的规格（第 1、2 个实参 A 和 B）：把 ind_sigma 作为函数头，先用两层应用依次传入第一项类型 A 和第二项类型族 B，这样 ind_sigma 就知道待会儿要拆的包裹长什么样了（积木上的层级数字都保持默认的 0）。
3. 传入要拆的包裹（第 3 个实参 p）：把最外层 λ 收到的 p 传进去。
4. 传入目标族（第 4 个实参 λ_. A）：它是一个接收任意包裹、说明最终结果类型的函数。无论拆哪个包裹，本关都要返回类型 A，所以用一块普通的 λ 忽略参数、直接返回 A 即可。
5. 传入分支函数（第 5 个实参 λa. λb. a）：用两层普通、可编辑的 λ 积木依次接收拆包出来的第一项 a : A 和第二项 b : B a，然后把第一项 a 返回出去！

整段程序合起来，就用纯正的 λ 和函数应用实现了“第一投影函数 fst”，把任意依赖对的第一部分安全地取出来。你还可以试着点选前面只传了 1～4 个参数的应用前缀，看看部分应用是如何一步步收窄到目标类型 A 的！`,
    en: `The completed answer is λp. ind_sigma A B p (λ_. A) (λa. λb. a). Even though five applications are nested inside, each piece has a simple, clear role when we read from outside in:

1. Outer λ binds p: because the goal is the function type (Σ x : A. B x) → A, we start with λ to accept the incoming dependent pair as p : Σ x : A. B x.
2. Supply the pair's types (arguments 1 & 2: A and B): keeping the universe fields on ind_sigma at 0, we pass A and the family B first so ind_sigma knows the shape of the pair it is about to unpack.
3. Supply the pair itself (argument 3: p): pass in the p received by the outer λ.
4. Supply the motive (argument 4: λ_. A): a function stating what result type each unpacked pair should yield. Since we always want an A, an ordinary λ ignoring its input and returning A does the job.
5. Supply the branch (argument 5: λa. λb. a): built with two ordinary, editable λ blocks that receive the unpacked components a : A and b : B a in turn, and return the first component a!

Altogether, this defines the first projection fst using nothing beyond ordinary lambdas and applications. Try clicking shorter application prefixes on the canvas to inspect how partial application narrows the type step by step!`
  },
  L14: {
    'zh-CN': `对比一下上一关，本关的答案是 λp. ind_sigma A (λ_. B) p (λ_. B) (λa. λb. b)。整体骨架还是那一套，只做了两处关键调整：

1. 用常量族包装第 2 个实参（λ_. B）：和上一关不同，条件区里的 B 只是一个固定类型，不是 A → Type 的类型族。但 ind_sigma 的第 2 个参数仍然需要一个“给定第一项、返回第二项类型”的函数，所以我们用一块普通的 λ 构造出常量族 λ_. B（“不管第一项是谁，第二项的类型永远是 B”）。
2. 第 3 个实参传入外层 λ 收到的序对 p。
3. 修改第 4 个实参（目标族 λ_. B）：本关目标是 (A × B) → B，因此声明整个消去过程的结果类型也是 B。
4. 修改第 5 个实参（分支函数 λa. λb. b）：两层 λ 依次接收拆出来的 a : A 和 b : B 后，这次返回第二项 b！

仔细欣赏一下那两个长得一模一样的 λ_. B：第 2 个实参描述的是“序对包裹内部的第二格结构”，而第 4 个实参描述的是“整个消去函数最终想输出的目标类型”——一个管内部结构，一个管外部目标！通过普通 λ 和应用积木的组合，我们顺利定义出了“第二投影函数 snd”。`,
    en: `Compare this answer with the previous level: λp. ind_sigma A (λ_. B) p (λ_. B) (λa. λb. b) follows the exact same pattern, with two key updates:

1. Wrap B as a constant family for argument 2 (λ_. B): unlike the last level, B in the context is a plain type rather than a family A → Type. Because ind_sigma's second argument still expects a family taking the first component, we build the constant family λ_. B with an ordinary λ (“no matter what the first component is, the second component has type B”).
2. Argument 3 passes the pair p received by the outer λ.
3. Argument 4 (the motive λ_. B) states that the entire elimination returns a result of type B, matching our goal (A × B) → B.
4. Argument 5 (the branch λa. λb. b) uses two ordinary λs to receive a : A and b : B, and returns the second component b!

Even though the two λ_. B blocks look identical, they play distinct roles: argument 2 describes the pair's internal second-component type, while argument 4 describes the elimination's final output type. Together, ordinary lambdas and applications implement the second projection snd.`
  },
  L15: {
    'zh-CN': `画布上的答案只有一个干脆的积木：refl。它代表“自反性（Reflexivity）”，意思是“任何东西都天然等于它自己”。

为什么连参数都不用给 refl 填，直接拖进去就能证明 Id A a a 呢？
1. 双向类型检查的功劳：答案槽已经从题目目标得知当前要证明的是 Id A a a（类型是 A，等式左端是 a，右端也是 a），所以检查器在检验 refl 时，会自动去比对左右两端是不是定义相等！
2. 区分命题与证明：Id 积木用来写出“a 等于 a”这个命题（类型），而 refl 才是这个命题的证据（证明项）。本关目标已经把 Id A a a 写好放在冒号右边了，我们需要在冒号左边提交证明，所以选 refl 就对啦。

小预告：只要等式两边在“计算之后”能变成完全一样的表达式（比如 2 + 2 和 4 计算后都是 4），统统都可以只用一个 refl 直接证出来哦！`,
    en: `The reference answer is just a single block: refl (short for “reflexivity”—everything is equal to itself).

Why doesn't refl need any slots filled in to prove Id A a a?
1. Bidirectional checking handles it: the goal on the right of the colon already tells the checker that we are proving Id A a a (in type A, comparing a on the left with a on the right). When checking refl, the type checker automatically verifies that the two endpoints are equal!
2. Proposition vs. proof: the Id block constructs the equality proposition (a type), whereas refl constructs a proof of that proposition (a term). Because Id A a a is already fixed as the goal type, the term slot needs refl.

Fun fact: refl doesn't only work when both sides look identical character-for-character—whenever both sides compute to the same result (like 2 + 2 and 4), a single refl proves them equal too!`
  },
  L16: {
    'zh-CN': `答案槽里的积木写着 Type 0。让我们最后确认一遍宇宙层级的规则，为什么 Type 0 恰好是目标 Type 1 的合法答案：

1. 题目要求：冒号右边是 Type 1，这意味着冒号左边需要提交一个“住在第 1 层宇宙里的项”。
2. 宇宙积木的作用：拖出宇宙积木 Type，它上面的数字决定这是第几层宇宙。保持默认层级 0 时，它就代表第 0 层宇宙 Type 0——里面住着所有普通类型（像 1、0、A × B）。
3. 层级逐级上升：在 MLTT 的宇宙层级里，每一层宇宙本身都是上一层宇宙里的一个合法对象，即 Type 0 : Type 1、Type 1 : Type 2、Type 2 : Type 3……以此类推。

你可以试着把宇宙积木上的数字从 0 改成 1：你会发现它的类型立刻跟着跳到了 Type 2，也就不再符合本关的 Type 1 目标了。通过这套井然有序的层级阶梯，类型论既能把类型当成普通对象来操作，又完美避开了“自己包含自己”的逻辑悖论！`,
    en: `Inside the answer slot sits the universe block Type 0. Let's review why Type 0 satisfies the target Type 1:

1. Read the goal: the right side of the colon is Type 1, asking for a term that lives inside the level-1 universe.
2. Check the universe block: the number on the Type block selects its universe level. At its default level 0, the block represents Type 0—the universe containing ordinary types like 1, 0, and A × B.
3. Follow the hierarchy: in MLTT, each universe is an element of the next higher universe, giving Type 0 : Type 1, Type 1 : Type 2, and so on.

Try changing the block's level from 0 to 1 on the canvas and watch its checked type jump to Type 2 (which would no longer match Type 1). By stepping up one level at a time, MLTT lets us treat types as first-class terms without falling into self-referential paradoxes.`
  },
  R0: {
    'zh-CN': `画布上呈现的是一步完整搭建好的“函数应用推导图”。我们像读一张逻辑清单一样，从上往下走一遍它是如何通过检查的：

1. 顶部共同条件 Γ：声明了类型 A、B，函数 f : A → B，以及参数 x : A。这些都是本步推理共享的可用资源。
2. 横线上方的两个前提：第一格放了函数 f，第二格放了参数 x。注意顺序不能反——必须先给函数，再给参数。
3. 横线右侧的规则 Π-elim：代表“Π 类型的消去规则（也就是函数应用）”。它告诉检查器：请把第一个前提当作函数、第二个前提当作参数来组合。
4. 横线下方的结论 Γ ⊢ f x : B：在结论判断的项位置构造了 f x，冒号右边确认它的类型是 B。注意结论里显示“Γ ∅”，表示没有额外增加条件，直接继承顶部的共同条件即可。

总结一下：在普通关卡里，检查器在后台默默做掉了这些核对；而在推导卡里，你把“前提是谁、依据哪条规则、得出什么结论”全都明明白白地摆在了台面上！`,
    en: `The canvas now shows a complete deduction step for function application. Let's read the diagram from top to bottom to see how all its parts agree:

1. Shared context Γ at the top: declares A : Type, B : Type, f : A → B, and x : A as the resources available for this inference.
2. Two premises above the bar: the first slot holds the function f, and the second slot holds its argument x. Order matters here—function first, argument second.
3. Rule Π-elim beside the bar: names “Π-elimination” (function application). It tells the checker to match the first premise as a function of type A → B and the second premise as its A argument.
4. Conclusion Γ ⊢ f x : B below the bar: constructs the resulting application term f x and confirms its type is B. Notice that the conclusion shows Γ ∅ (no extra local context added), which means it automatically inherits the shared declarations at the top.

Whereas regular levels run this check behind the scenes, this inference card puts the premises, the rule, and the resulting conclusion right out in the open.`
  },
  R1: {
    'zh-CN': `和上一关 R0 相比，这一关的答案把横线上方的两个前提升级成了完整的紫色判断卡，展现了形式逻辑中最标准的推导写法：

1. 上方第一张前提判断：Γ ⊢ f : A → B。它不仅指出了要用 f，还明确检查了“在条件 Γ 下，f 确实具有函数类型 A → B”。
2. 上方第二张前提判断：Γ ⊢ x : A。它明确检查了“在同样的条件 Γ 下，x 确实具有参数类型 A”。
   • 小细节：这两张前提卡片内部都显示“Γ ∅”，表示它们完全共享顶部的条件 Γ，没有引入任何额外假设。
3. 横线与规则 Π-elim：把上述两张已经通过检验的前提判断连接起来，依据 Π-elim 规则，名正言顺地推出下方的结论判断 Γ ⊢ f x : B！

整张推导大卡片本身也可以被当成一个具有类型 B 的项来使用（它的计算行为和普通的应用积木 f x 完全一样）。学会读懂“单张判断（⊢）”和“前提推结论（横线）”这两层结构，你就真正看懂了类型论教材里那些推导规则的记号了！`,
    en: `Compared with R0, the answer here writes both premises above the bar as full purple judgment cards—the complete textbook notation for an inference rule:

1. First premise judgment: Γ ⊢ f : A → B. Rather than just naming f, it explicitly establishes that under context Γ, f has function type A → B.
2. Second premise judgment: Γ ⊢ x : A. Under that same context Γ, it establishes that x has argument type A.
   • Notice that both premise cards show Γ ∅ inside: they inherit the top shared context directly without adding new hypotheses.
3. Rule Π-elim and conclusion: combining these two checked premise judgments, Π-elim justifies the conclusion judgment Γ ⊢ f x : B below the bar!

Just like a regular f x block, this entire inference card produces a valid term of type B. Once you can read both levels—an individual judgment (⊢) and a rule step (the horizontal bar)—you can read the formal inference rules in any type theory textbook!`
  }
};
