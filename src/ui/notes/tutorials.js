// Problem guides explain notation and the task without assembling its solution.
export const TUTORIALS = {
  L0: {
    'zh-CN': `冒号表示“具有这个类型”。条件 A : Type 说明 A 是一个类型；x : A 说明名为 x 的项属于 A。条件区里的声明提供可用名字，下面的判断则描述本题需要检查的内容。

符号 ⊢ 可以读成“在这些条件下”。它后面的冒号把项和类型分开：左边是需要构造的项，右边是已经给定的目标类型 A。本关的空槽位于项的位置，所以应当提交一个具有类型 A 的构造。

左侧的符号积木是对声明的引用。类型名与项名各有自己的角色，名字是否可用还取决于所在作用域。读题时先辨认声明区、待填写的位置和目标类型，再考虑它们之间的关系。`,
    en: `A colon means “has type”. A : Type declares a type named A, while x : A declares a term belonging to A. The context makes names available; the judgment below describes what must be checked.

Read ⊢ as “under these conditions”. The colon after it separates the term from its type. Here the term position is empty and the required type A is already supplied, so the task is to construct a term of A.

Symbol blocks refer to declarations. A type name and a term name play different roles, and their availability depends on scope. Identify the context, the empty position, and its target type before constructing an answer.`
  },
  L1: {
    'zh-CN': `Π (x : A) → A 表示一个函数类型：输入是 A 类型的项，输出也应当具有类型 A。这里返回类型没有依赖输入的具体值，所以也可以简写为 A → A。条件中只声明了类型 A。

λ 表示函数构造。它绑定的名字代表未来收到的参数，这个名字的作用域只覆盖函数体；函数外面的表达式无法直接使用它。目标类型会帮助检查器确定函数输入的类型。

本关需要填写冒号左边的项，使整个判断具有给定的函数类型。留意“类型描述函数的接口”和“项提供函数的实现”这两个角色。作用域中出现的新名字，只能在绑定它的构造内部引用。`,
    en: `Π (x : A) → A describes a function taking an A and returning an A. Since this result type does not depend on the particular input value, it can also be written A → A. The context supplies the type A.

A λ block constructs a function and binds a name for its future argument. That name is available only in its body. The expected function type tells the checker the argument's type.

Fill the term position with a construction having the given function type. The type describes the interface, while the term implements it. Any newly bound name must remain inside the construction that makes it available.`
  },
  L2: {
    'zh-CN': `条件中有类型 A、B，以及 x : A。目标 Π (y : B) → A，也就是 B → A，要求一个接受 B 类型输入、返回 A 类型结果的函数。外层条件和函数内部新引入的名字属于不同的作用域层次。

λ 的参数名表示该函数收到的输入。函数体既可以使用它自己的参数，也可以使用仍然可见的外层声明。判断一个名字能否放进空槽时，需要同时看它的类型和它的声明位置。

本关的空槽要求整个函数，而函数体随后还会有自己的类型要求。参数类型和结果类型可以不同；函数也没有必须使用每一个可用名字的要求。先把目标的输入与输出读清楚，再检查可用声明能提供哪些类型。`,
    en: `The context supplies types A and B and a term x : A. The goal Π (y : B) → A, or B → A, asks for a function taking a B and producing an A. Outer declarations and a new function parameter occupy different scope levels.

A λ parameter names the input received by that function. Its body may use its own parameter and any outer declarations still in scope. A reference must have both a suitable type and a visible declaration.

The empty slot asks for the entire function, whose body will have its own expected type. Input and output types may differ, and a function need not use every available name.`
  },
  L3: {
    'zh-CN': `条件 f : A → B 描述一个函数，它需要 A 类型的输入，返回 B 类型的结果；x : A 描述一个已有的项。目标判断的项位置留空，冒号右边固定为类型 B。

应用积木有函数和参数两个位置。函数位置中的表达式必须具有函数类型，参数位置中的表达式必须符合那个函数的输入要求。检查器根据函数的返回类型确定一次应用产生的类型。

本关关注函数应用这条规则，以及声明中的输入类型如何约束可接入的积木。两个位置的作用不同，画布上相邻放置积木也不会自动形成应用。读清楚函数接口、参数类型和目标要求后，再选择要构造的表达式。`,
    en: `The declaration f : A → B describes a function requiring an A and returning a B; x : A describes an available term. The goal leaves its term empty and fixes its type to B.

An application block has separate function and argument inputs. The function expression must have a function type, and the argument must meet its input requirement. The checker determines the application's type from the function's result type.

This task concerns the application rule and the constraints imposed by the declared input type. The two positions have different roles. Merely placing blocks beside one another does not construct an application.`
  },
  L4: {
    'zh-CN': `条件中有 f : A → B → C、x : A 和 y : B，目标类型为 C。箭头按右边结合，因此 A → B → C 的结构是 A → (B → C)：一个函数的返回值也可以是另一个函数。

一次应用积木只处理一个参数。读取较长函数类型时，应当区分当前输入要求与这一层之后剩下的返回类型。应用表达式又可以放进别的应用积木，形成有层次的结构。

本关需要构造一个最终具有 C 类型的项。各个空槽都受当前所在函数类型约束，参数的排列也必须符合接口。关注每一层表达式的类型变化，而不只看名字是否都已经出现在画布上。`,
    en: `The context has f : A → B → C, x : A, and y : B, and the goal is C. Arrows group to the right: A → B → C has structure A → (B → C), so a function may return another function.

One application block handles one argument. Distinguish the input needed at the current stage from the return type that remains afterward. Applications can be nested inside other applications.

Construct a term whose final type is C. Every slot is constrained by the function type at that stage, including argument order. Follow the type changes through the structure rather than merely checking that all names appear on the canvas.`
  },
  L5: {
    'zh-CN': `条件仍然包含 f : A → B → C 和 x : A，但本关目标是 B → C。目标本身是函数类型，因此答案中的项也可以是一个等待后续输入的函数值。

箭头 A → B → C 按 A → (B → C) 读取。函数应用可以返回普通数据，也可以返回函数；λ 则是显式构造函数的语法。需要哪种构造，应当由现有声明与目标类型共同决定。

读题时特别留意结果需要到哪一个阶段。目标中的 B → C 描述完整的返回接口，不能把它当成尚未完成的题面。检查器关心提交项的类型是否符合这个接口，而没有要求每个函数都必须接收完它可能接受的所有参数。`,
    en: `The context still supplies f : A → B → C and x : A, but the goal is B → C. Since the goal is a function type, an answer may itself be a function waiting for another input.

Read the arrows as A → (B → C). Application can return data or a function, while λ explicitly constructs functions. The available declarations and the target type determine which construction fits.

Pay attention to the stage requested by the goal. B → C is a complete result interface, not unfinished problem text. Checking asks whether the submitted term fits that interface; it does not require every possible function argument to be supplied.`
  },
  L6: {
    'zh-CN': `本关已经给出了项 f x，空槽在冒号右边。这里需要推断已有项的类型，而不是重新构造项。条件中声明了类型 A、B，以及函数 f : A → B 和参数 x : A。

在判断 Γ ⊢ t : T 中，t 代表项，T 代表它的类型，Γ 代表可用声明。平常的构造题固定 T、要求填写 t；这次固定的是 t，需要填写 T。类型本身同样可以通过引用积木表示。

阅读应用项时，核对函数接受的输入类型和参数的实际类型，再根据函数接口分析结果。留意类型空槽的角色：填入的内容必须是一个良构的类型，并且恰好说明给定项的类型。`,
    en: `The term f x is already supplied, and the empty slot is to the right of the colon. Infer the type of that term rather than constructing the term again. The context declares A, B, f : A → B, and x : A.

In Γ ⊢ t : T, t is a term, T is its type, and Γ is the available context. Construction tasks fix T and ask for t; this task fixes t and asks for T. Types can also be represented by reference blocks.

Read the function's input requirement and the argument's actual type before analyzing its result. The type slot needs a well-formed type that describes exactly the supplied term.`
  },
  L7: {
    'zh-CN': `题目已经给出项 f a，需要填写它的类型。这里 B : A → Type 是类型族：它接收一个 A 类型的值，得到一个类型。函数 f 的类型写成 Π (x : A) → B x，返回类型中引用了输入 x。

这样的 Π 是依赖函数类型，结果类型会随实际参数发生替换。普通 A → B 的返回类型与输入值无关；本关要注意返回类型里的变量来自哪个绑定，以及函数实际收到了哪个参数。

空槽处在冒号右侧，所以目标是构造一个类型表达式。类型族尚未接收参数时，与它在某个具体参数处产生的类型，扮演的角色不同。根据给定应用和依赖函数接口，说明这个具体结果应当属于什么类型。`,
    en: `The fixed term is f a, and you must provide its type. B : A → Type is a type family: it takes an A value and produces a type. The function has type Π (x : A) → B x, whose result mentions its input x.

This is a dependent function type. Applying it substitutes the actual argument into the result type. Track which binder owns each occurrence and which argument the function actually receives.

The hole is a type position. A family still waiting for an argument and the type it produces at a particular argument have different roles. Use the given dependent interface to describe the result's concrete type.`
  },
  L8: {
    'zh-CN': `本关目标中的 1 表示单元类型，它用来描述一个无需携带额外信息的结果。类型名称 1 与属于它的元素是两个不同角色：判断中冒号右边写类型，左边需要写那个类型的项。

单元类型有自己的引入规则，工具箱提供了相应的类型积木和元素积木。阅读符号时，先确认你正在讨论一种类型，还是一个属于它的值。把类型本身放进项的位置，也仍然需要接受类型检查。

本关没有额外声明需要处理，重点是认识单元类型和规范元素之间的关系。请构造一个具有类型 1 的项，让整个判断成立。以后还会遇到对单元值进行消去，以及观察消去过程怎样计算的题目。`,
    en: `The goal 1 names the unit type, used for a result carrying no additional information. The type and its elements have different roles: the judgment puts the type after the colon and requires a term before it.

Unit has an introduction rule, and the library provides both its type block and its canonical-element block. Identify whether a symbol denotes a type or a value belonging to it. A type placed in a term position still undergoes type checking.

There are no extra declarations to process here. Construct a term of unit and make the judgment valid. Later tasks examine elimination of unit values and its computation rule.`
  },
  L9: {
    'zh-CN': `共同条件包括 u : 1、类型族 C : 1 → Type，以及 c : C ★。目标是 C u。C 后面的参数决定当前讨论的是哪一个结果类型，所以 C ★ 和 C u 的写法值得分别留意。

单元类型的消去规则描述怎样处理一个任意的单元值。unitrec 积木的几个位置分别对应被处理的值、结果类型族和规范元素处的基本情况。类型族说明结果随输入怎样变化，基本情况提供其中一个指定位置的结果。

本关需要一个具有 C u 类型的项。u 是当前作用域中的变量，不能只因为它属于单元类型，就把所有出现的 u 都当成已经发生了规范元素处的计算。结合消去规则的接口来理解每个空槽所要求的内容。`,
    en: `The context gives u : 1, a family C : 1 → Type, and c : C ★. The goal is C u. The argument of C determines which result type is being discussed, so distinguish C ★ from C u.

Unit elimination describes how to handle an arbitrary unit value. A unitrec block accepts the value being handled, a result family, and a base case at the canonical element. The family describes the varying result type; the base case provides the result at a specified input.

Construct a term of C u. Since u is a variable, do not assume that computation at the canonical element has already occurred everywhere u appears.`
  },
  L10: {
    'zh-CN': `这关讨论单元消去子的计算。条件中有类型族 C : 1 → Type 和基本情况 c : C ★，目标同样写成 C ★。画布已经放好了被冻结的 unitrec 骨架，要填写它内部的空槽。

unitrec 的接口区分被处理的单元值、结果类型族和基本情况。符号 ★ 表示单元类型的规范元素；计算规则描述消去子在遇到规范元素时怎样归约。符号 ≡ 用来表达这种计算产生的定义相等。

本关关注的是完整消去表达式及其计算行为，因此需要保留题目给定的骨架。核对每个输入位置的角色，以及基本情况的类型和目标类型之间的关系。完成后，检查器会根据普通的类型规则与计算规则验证整个构造。`,
    en: `This task examines computation of unit elimination. The context has C : 1 → Type and c : C ★, and the goal is C ★. A frozen unitrec skeleton is already on the canvas; complete its internal slots.

The interface distinguishes the unit value, the result family, and the base case. ★ denotes the canonical unit element. A computation rule describes how an eliminator reduces when it receives that element, and ≡ expresses definitional equality by computation.

Keep the supplied skeleton and identify the role of every input. Relate the base case's type to the target. The completed construction is checked using the ordinary typing and computation rules.`
  },
  L11: {
    'zh-CN': `0 表示空类型，它没有用来构造元素的引入规则。题目已经把 e : 0 放进共同条件，另外给定类型 A，要求在这个作用域下构造一个具有类型 A 的项。

空类型的消去规则用于处理一个不可能发生的情况。absurd 积木需要一个空类型的项作为输入，结果则由当前目标类型确定。这里要区分“使用一个题目已经声明的假设”和“构造一个新的假设”：可用声明是题目的组成部分。

请留意空类型 0、假设 e 与目标 A 各自的角色。消去规则说明怎样利用已有的空类型项，而不会替你凭空添加一个这样的项。整张判断仍然要求提交内容满足给定的目标类型。`,
    en: `The type 0 is empty and has no element-introduction rule. The context already includes e : 0 and a type A. Construct a term of A under those declarations.

Empty elimination handles an impossible case. An absurd block requires a term of the empty type, and the expected result type comes from its goal. Distinguish using a supplied hypothesis from inventing an additional hypothesis: the available declarations are part of this problem.

Keep the roles of the type 0, the hypothesis e, and the target A separate. The eliminator explains how to use an existing empty-type term; it does not introduce that term from nothing.`
  },
  L12: {
    'zh-CN': `目标 Σ (x : A) × B 也可以写作 A × B，表示一个序对的类型。第一部分具有类型 A，第二部分具有类型 B；这里第二部分的类型没有用到第一部分的具体值。

共同条件中给了 a : A 和 b : B。Σ 是依赖对的类型构造，配对积木则用来构造属于这种类型的项。类型描述各成员的要求，项提供实际成员，两个位置的顺序体现了这个结构。

本关需要填写一个具有目标积类型的项。请分别核对两个成员应当满足的类型，并区分“构造序对的类型”和“构造一个序对”。后面的题目会使用消去规则，把对中的成员交给一个步骤来处理。`,
    en: `The goal Σ (x : A) × B can also be written A × B. It is the type of an ordered pair with an A component followed by a B component. Here the second component's type does not depend on the first value.

The context gives a : A and b : B. Σ constructs a pair type, while a pair block constructs an element of such a type. The type specifies the member requirements, and the term supplies actual members in that order.

Fill the term slot with a construction of the required product type. Distinguish constructing the pair's type from constructing a pair itself.`
  },
  L13: {
    'zh-CN': `目标 (Σ x : A. B x) → A 描述一个函数：接收一个依赖对，结果类型为 A。B : A → Type 是类型族，因此对中第二成员的类型依赖第一成员的值。

sigma_ind 是依赖对的消去子。它接收要处理的对、描述结果类型的目标族，以及处理成员的步骤。积木已经为目标族绑定了一个对变量，也为步骤绑定了成员名字；这些名字只在各自对应的输入槽内可用。

本关要构造整个函数，而非提交一个现成的对。关注函数的外层输入、消去子的目标族与步骤中的局部成员分别属于哪一层作用域。目标族给出每种输入需要的结果类型，步骤则必须在拆开成员后满足那个要求。`,
    en: `The goal (Σ x : A. B x) → A describes a function receiving a dependent pair and returning an A. The family B : A → Type makes the second member's type depend on the first member's value.

sigma_ind is the dependent-pair eliminator. It takes the pair, a motive describing the result type, and a step handling its members. The block binds a pair variable in the motive and member variables in the step; their scopes are separate.

Construct the whole function. Track the outer input, motive binder, and step members carefully. The motive specifies the required result at each input, and the step must meet that requirement after unpacking the members.`
  },
  L14: {
    'zh-CN': `目标 (A × B) → B 描述一个接收序对、返回 B 类型结果的函数。本关的积类型中，第二成员的类型 B 与第一成员的具体值无关，因此它属于依赖对的一种简单情形。

sigma_ind 把对交给一个处理步骤，同时用目标族说明整个消去过程需要什么结果类型。积木里的目标族槽和步骤槽带有各自的局部名字，不能把其中的引用随意移动到另一层作用域。

请构造满足目标接口的函数，并区分整个函数收到的对与步骤中可用的成员。目标族是类型层面的说明，处理步骤是项层面的构造；二者需要配合。前一关的目标与本关不同，所以应当重新读取这次要求的结果类型。`,
    en: `The goal (A × B) → B asks for a function receiving a pair and returning a B. The second member's type B does not depend on the first value, so this product is a simple case of dependent pairs.

sigma_ind passes a pair to a handling step and uses a motive to specify the required result type. The motive and step inputs bind their own local names. References cannot be moved freely between those scopes.

Construct a function matching the target interface. Distinguish its entire input pair from members available within the step. The motive specifies a type, while the step constructs a term meeting it.`
  },
  L15: {
    'zh-CN': `Id A a a 是一个恒等类型，表达类型 A 中两个指定项相等。Id 后面先给出两项所属的类型，再给出等式的左端与右端。本题两端的写法相同。

在类型论里，一个相等命题也由类型表示，填入该类型中的项就是提供相应的证明。refl 表示自反性；它的检查涉及两端在计算意义上是否定义相等，而不仅仅是比较屏幕上的字符。

本关的空槽位于证明项的位置，目标类型已经包含了需要证明的等式。注意区分等式两端的项、它们共同的类型，以及证明本身的类型。阅读这些角色有助于理解后续更一般的相等与传输规则。`,
    en: `Id A a a is an identity type expressing equality of two specified terms of A. After Id come their common type, the left endpoint, and the right endpoint. In this problem the endpoints have the same written form.

Equality propositions are represented by types, and a term of that type supplies a proof. refl denotes reflexivity; checking it involves definitional equality by computation, not merely matching characters on screen.

The empty position is for a proof term. Distinguish the endpoints, their common type, and the type of the proof itself. These roles prepare for more general equality and transport rules.`
  },
  L16: {
    'zh-CN': `Type n 表示第 n 层宇宙，用来容纳某一层的类型。类型本身也可以作为项来讨论，因此一个宇宙仍然需要有自己的类型；这里通过向更高一层移动来描述这种关系。

本关冒号右侧的目标是 Type 1，左侧需要提交一个具有这个类型的项。宇宙积木上的数字决定它表示哪一层，改变层级也会改变检查器推断出的类型。

请区分“正在构造的宇宙”与“它所属的宇宙”。判断中的冒号仍然表示具有类型，层级编号也参与类型检查。这个结构让类型论可以讨论类型和类型族，而不把所有层级混在同一个类型里。`,
    en: `Type n is the universe at level n, used to contain types at that level. Types can themselves be discussed as terms, so a universe also needs a type. This relationship moves to a higher universe level.

The target after the colon is Type 1. Submit a term having that type. The number on a universe block determines which level it denotes; changing it also changes the type inferred by the checker.

Distinguish the universe being constructed from the universe to which it belongs. The colon still expresses typing, and the level numbers matter to checking. Universes allow type theory to discuss types and type families.`
  },
  R0: {
    'zh-CN': `这张卡用横线表示一条推理规则的应用。顶部的共同条件声明可用的名字和类型，横线上方放前提，横线右侧选择规则，下面放结论。前提列表可以增删，但所选规则会限制合法的数量和类型。

共同条件中有 f : A → B 与 x : A，结论需要一个 B 类型的项。Γ 表示这一步共享的可用声明；前提则是本次规则真正使用的判断或项。声明提供资源，规则说明怎样由前提得到结论。

本关需要补全前提、规则与结论。Π-elim 是函数应用的规则名称。填写时分别辨认函数接口、参数要求和结论类型；检查器也会核对下方写出的结论是否确实由所选规则产生。`,
    en: `The bar represents an application of an inference rule. The shared context declares available names and types. Premises go above the bar, the rule beside it, and the conclusion below it. A list can change size, but the chosen rule constrains its valid count and types.

The context has f : A → B and x : A, and the conclusion needs a B. Γ denotes shared declarations; premises are the judgments or terms used by this particular step.

Complete the premises, rule, and conclusion. Π-elim names function application. Identify the function interface, argument requirement, and conclusion type; checking also verifies that the rule actually yields the submitted conclusion.`
  },
  R1: {
    'zh-CN': `本关在横线推导中嵌入了紫色判断卡。每张判断的结构是 Γ ⊢ 项 : 类型：条件提供可用声明，项是要检查的构造，冒号右侧说明它应当具有的类型。内层 Γ 可以沿用外层的共同条件。

横线上方两张判断分别要求函数类型与参数类型，横线下方的判断要求最终结果类型。共同条件与前提承担不同任务：条件让名字可用，前提判断说明这些资源怎样满足当前推理步骤的要求。

请补全每个判断中的项、横线旁的规则和下方结论。大横线连接前提与结论，⊢ 则属于单个判断内部。阅读时先分清这两层结构，再检查各处的类型与作用域是否一致。`,
    en: `This level nests purple judgment cards inside an inference. Each judgment has form Γ ⊢ term : type. Its context supplies declarations, its term is a construction to check, and the type states the requirement. An inner Γ can inherit the outer shared context.

The premises require a function type and an argument type, while the judgment below the bar requires the final result type. Conditions make names available; premise judgments establish how those resources meet this inference's requirements.

Complete the terms, rule, and conclusion. The bar connects premises to a conclusion, while ⊢ belongs inside one judgment. Keep these two structural levels, their types, and their scopes distinct.`
  }
};
