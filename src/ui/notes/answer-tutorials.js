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
    'zh-CN': `答案是 ind_unit u C c，由三次普通函数应用组成。

从最内层读起：ind_unit 接收 u : 1，得到等待类型族和基本情况的函数；再传入 C : 1 → Type，剩余参数的类型成为 C ★；最后传入 c : C ★，得到 C u。

这说明归纳子可以像其他函数一样部分应用。每一步都可以选择整块应用查看类型，观察还缺哪些参数。因为 u 是变量，表达式不会直接化简成 c；只有输入计算为 ★ 时，才会触发基本情况的计算规则。`,
    en: `The answer is ind_unit u C c, built from three ordinary applications. Read from the innermost application outward: ind_unit receives u : 1, then the family C : 1 → Type, then c : C ★. The completed result has type C u.

Each prefix is also a valid partial application. Selecting it shows which arguments remain. Since u is a variable, this term does not simply compute to c; that computation occurs when the input is the canonical element ★.`
  },
  L10: {
    'zh-CN': `答案是 ind_unit ★ C c。冻结的结构只包含函数符号 ind_unit 和普通应用积木，三个参数分别是 ★、C、c。

先传入 ★，再传入类型族 C，最后传入基本情况 c。单元类型的计算规则给出：ind_unit ★ C c ≡ c。因此整个应用和 c 都具有类型 C ★，计算结果也相同。

这一关要求保留 ind_unit 的实际使用，是为了观察引入与消去如何配合。原先需要专用卡片表达的步骤，现在完全由普通函数应用完成。`,
    en: `The answer is ind_unit ★ C c. The frozen structure contains the ind_unit function symbol and ordinary application blocks; its arguments are ★, C, and c.

After those three applications, the unit computation rule gives ind_unit ★ C c ≡ c. Both expressions have type C ★ and compute to the same result. This level retains the actual use of ind_unit so you can observe how introduction and elimination work together, entirely through ordinary function application.`
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
    'zh-CN': `答案是 λp. ind_sigma A B p (λ_. A) (λa. λb. a)。函数符号后面的五个参数都通过普通应用积木传入。

外层 λ 引入依赖对 p。A 与类型族 B 先告诉 ind_sigma 这个依赖对的组成类型，随后传入 p。

第四个参数 λ_. A 是目标族：无论收到哪个包裹，都希望结果属于 A。第五个参数 λa. λb. a 是分支函数：它依次收到第一项 a : A 和第二项 b : B a，返回 a。

因此整个函数把 Σ (x : A) × B x 映射到 A，实现第一投影 fst。a、b 都由可编辑的普通 λ 绑定，没有专用卡片中的隐藏变量。只传入前几个参数时，剩余部分仍是一个等待参数的函数。`,
    en: `The answer is λp. ind_sigma A B p (λ_. A) (λa. λb. a). All five arguments after the function symbol use ordinary application blocks.

The outer lambda introduces p. The first two arguments, A and B, specify the dependent pair's component types; the third supplies p. The fourth argument λ_. A is the motive: every pair should yield an A. The fifth, λa. λb. a, receives a : A and b : B a and returns a.

The result maps Σ (x : A) × B x to A, implementing fst. Both branch variables are introduced by ordinary editable lambdas. Any application prefix remains a function waiting for its remaining arguments.`
  },
  L14: {
    'zh-CN': `答案是 λp. ind_sigma A (λ_. B) p (λ_. B) (λa. λb. b)。

第一个参数 A 指定第一项的类型。第二个参数 λ_. B 指定第二项的类型族：这里 B 不依赖第一项，所以是常量族。第三个参数 p 是要拆开的序对。

第四个参数 λ_. B 是目标族，说明整个消去过程的结果类型也固定为 B。第五个参数 λa. λb. b 接收拆出的两项，返回第二项 b。

两个 λ_. B 的外观相同，但第二个实参描述包裹的内部结构，第四个实参描述消去后的目标。所有 λ 和应用都是通用积木；这个函数因此实现了 A × B 到 B 的第二投影 snd。`,
    en: `The answer is λp. ind_sigma A (λ_. B) p (λ_. B) (λa. λb. b).

A specifies the first component's type. The second argument λ_. B is the constant family specifying the second component's type, and p supplies the pair. The fourth argument λ_. B is the motive, fixing the entire elimination result to B. The last argument λa. λb. b receives the components and returns the second one.

Although the two constant families look alike, the second argument describes the pair's structure while the fourth describes the elimination's goal. Ordinary lambdas and applications implement the second projection snd from A × B to B.`
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
4. 横线下方的结论 Γ ⊢ f x : B：在结论判断的项位置构造了 f x，冒号右边确认它的类型是 B。注意结论里 Γ 旁边的可选条件槽是留空的，这表示直接继承顶部的共同条件，不用再重写一遍。

总结一下：在普通关卡里，检查器在后台默默做掉了这些核对；而在推导卡里，你把“前提是谁、依据哪条规则、得出什么结论”全都明明白白地摆在了台面上！`,
    en: `The canvas now shows a complete deduction step for function application. Let's read the diagram from top to bottom to see how all its parts agree:

1. Shared context Γ at the top: declares A : Type, B : Type, f : A → B, and x : A as the resources available for this inference.
2. Two premises above the bar: the first slot holds the function f, and the second slot holds its argument x. Order matters here—function first, argument second.
3. Rule Π-elim beside the bar: names “Π-elimination” (function application). It tells the checker to match the first premise as a function of type A → B and the second premise as its A argument.
4. Conclusion Γ ⊢ f x : B below the bar: constructs the resulting application term f x and confirms its type is B. Notice that the optional context slot beside Γ in the conclusion stays empty, which means it automatically inherits the shared declarations at the top.

Whereas regular levels run this check behind the scenes, this inference card puts the premises, the rule, and the resulting conclusion right out in the open.`
  },
  R1: {
    'zh-CN': `和上一关 R0 相比，这一关的答案把横线上方的两个前提升级成了完整的紫色判断卡，展现了形式逻辑中最标准的推导写法：

1. 上方第一张前提判断：Γ ⊢ f : A → B。它不仅指出了要用 f，还明确检查了“在条件 Γ 下，f 确实具有函数类型 A → B”。
2. 上方第二张前提判断：Γ ⊢ x : A。它明确检查了“在同样的条件 Γ 下，x 确实具有参数类型 A”。
   • 小细节：这两张前提卡片内部 Γ 旁边的附加条件槽都是空的，表示它们完全共享顶部的条件 Γ，没有引入任何额外假设。
3. 横线与规则 Π-elim：把上述两张已经通过检验的前提判断连接起来，依据 Π-elim 规则，名正言顺地推出下方的结论判断 Γ ⊢ f x : B！

整张推导大卡片本身也可以被当成一个具有类型 B 的项来使用（它的计算行为和普通的应用积木 f x 完全一样）。学会读懂“单张判断（⊢）”和“前提推结论（横线）”这两层结构，你就真正看懂了类型论教材里那些推导规则的记号了！`,
    en: `Compared with R0, the answer here writes both premises above the bar as full purple judgment cards—the complete textbook notation for an inference rule:

1. First premise judgment: Γ ⊢ f : A → B. Rather than just naming f, it explicitly establishes that under context Γ, f has function type A → B.
2. Second premise judgment: Γ ⊢ x : A. Under that same context Γ, it establishes that x has argument type A.
   • Notice that the optional extra-context slots beside Γ inside these premise cards are left empty: they inherit the top shared context directly without adding new hypotheses.
3. Rule Π-elim and conclusion: combining these two checked premise judgments, Π-elim justifies the conclusion judgment Γ ⊢ f x : B below the bar!

Just like a regular f x block, this entire inference card produces a valid term of type B. Once you can read both levels—an individual judgment (⊢) and a rule step (the horizontal bar)—you can read the formal inference rules in any type theory textbook!`
  }
};
