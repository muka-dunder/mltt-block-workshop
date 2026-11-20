// Explanations for the levels currently available in the workshop.
export const TUTORIALS = {
  L0: {
    'zh-CN': `读题时，冒号表示“具有这个类型”。x : A 告诉你，已经有一个叫 x 的项，它的类型是 A。⊢ 后面的空槽要放答案，右侧的 : A 要求答案也具有类型 A。

从左侧的已知符号里拖出 x，把它接到答案槽里，再点击“检查”。这关直接使用题目给出的条件就够了，无须创建新假设。

A 是类型的名字，x 是这个类型里的一个项，两者用途不同。引用 x 会保留它与题目中声明的关联；以后同样可以通过引用来使用函数、类型和局部变量。`,
    en: `A colon means “has type”. The declaration x : A gives you a term named x whose type is A. The slot after ⊢ holds your answer; the : A on its right requires an answer of type A.

Drag x from the given symbols on the left into the answer slot, then press Check. The supplied context already contains everything you need, so no new assumption is needed.

A names a type, while x names a term of that type. A reference to x remains linked to its declaration. The same reference mechanism will let you use functions, types, and local variables in later levels.`
  },
  L1: {
    'zh-CN': `目标 A → A 表示：接收一个 A 类型的输入，返回一个 A 类型的结果。题目暂时没有给你 A 类型的值；要获得输入，就需要构造一个函数。

把 λ 积木放进答案槽。它会引入局部变量 x，左侧随即出现对应的 x 积木。把这个 x 拖进 λ 的函数体，得到 λx. x，然后检查。

这个函数把收到的输入原样返回，因此无论 A 是什么类型都能成立。x 的可用范围是这个 λ 的函数体；把它放到函数外面时，系统会指出它超出了作用域。`,
    en: `The goal A → A asks for a function that accepts an input of type A and returns a result of type A. No particular A has been supplied as a value; constructing a function gives you access to its input.

Put a λ block in the answer slot. It introduces the local variable x, whose reference appears on the left. Drag that x into the body of λ to build λx. x, then check it.

This function returns its input unchanged, so it works for any type A. Its x is available inside this λ's body. Moving the reference outside that body makes it out of scope.`
  },
  L2: {
    'zh-CN': `题目已经给了 x : A，目标却是 B → A：现在要构造一个接收 B、返回 A 的函数。你可以在函数内部继续使用外层给出的 x。

先把 λ 放进答案槽，把新输入命名为 y。它的类型由目标确定为 B。接着从已知符号拖出外层的 x，放进函数体，构成 λy. x。

函数的输入可以暂时用不上。这里每次收到一个 B，都会返回已有的那个 A。留意变量的来源：y 属于新函数，x 属于题目的外层条件；返回值必须符合目标中的 A。`,
    en: `You already have x : A, and the goal is B → A: build a function that receives a B and returns an A. The outer x remains available inside the new function.

Put λ in the answer slot and name its input y. The goal gives y type B. Drag the supplied outer x into the function body to build λy. x.

A function is allowed to leave its input unused. This one receives a B each time and returns the A you already had. Keep track of where variables come from: y belongs to the new function, and x comes from the outer context. The returned term must have type A.`
  },
  L3: {
    'zh-CN': `已知 f : A → B 和 x : A。函数 f 能把一个 A 变成一个 B，而目标正好要求构造一个 B。把合适的参数交给函数，就能得到需要的结果。

拖出应用积木，放进答案槽。应用积木有两个位置：左边放函数 f，右边放参数 x。完成的表达式是 f x，读作“把 f 应用于 x”。

应用时，参数的类型必须符合函数的输入要求。这里 x 具有类型 A，所以 f x 的类型是 B。函数与参数的顺序很重要；把 x 放在函数位置，就无法按这个规则进行检查。`,
    en: `You have f : A → B and x : A. The function f turns an A into a B, exactly the type requested by the goal. Giving the function a suitable argument produces the required result.

Place an application block in the answer slot. Put the function f in its left slot and the argument x in its right slot. The resulting expression f x reads “apply f to x”.

The argument's type must match the function's input type. Since x has type A, f x has type B. The order matters: placing x in the function slot does not provide the function required by application.`
  },
  L4: {
    'zh-CN': `f : A → B → C 表示分两次接收参数：先给它一个 A，会得到一个 B → C 的函数；再给这个函数一个 B，才能得到目标 C。

需要嵌套两个应用积木。内层放 f 和 x，先组成 f x；把整个内层应用放到外层的函数位置，再把 y 放到外层的参数位置，得到 (f x) y。

通常把它简写成 f x y，应用按左边先结合。不要把 x 和 y 先拼成 x y：x 只有类型 A，题目没有给它函数类型。沿着每一步的输入、输出类型看，嵌套顺序就清楚了。`,
    en: `The type f : A → B → C describes two successive inputs. Giving f an A produces a function of type B → C; giving that function a B produces the requested C.

Nest two application blocks. The inner one contains f and x, forming f x. Put that entire application in the outer function slot, with y in the outer argument slot. This builds (f x) y.

We usually shorten this to f x y, with application grouping to the left. Do not first combine x and y as x y: x only has type A, and no function type for x was supplied. Follow each step's input and output types to determine the nesting.`
  },
  L5: {
    'zh-CN': `这次仍有 f : A → B → C 和 x : A，但目标变成了 B → C。题目要的结果本身就是函数，因此只需要完成 f 的第一次应用。

把一个应用积木放进答案槽，函数位置放 f，参数位置放 x，得到 f x。检查时，它的类型已经是 B → C；这里无须再引入一个 B 类型的参数。

这叫部分应用：先交出一部分参数，留下的计算成为另一个函数。箭头 A → B → C 按右边结合，可以看成 A → (B → C)。因此 f x 是一个完整的函数值，也能作为完整答案提交。`,
    en: `You still have f : A → B → C and x : A, but the goal is now B → C. The requested result is itself a function, so completing only the first application of f is enough.

Put an application block in the answer slot, with f as the function and x as the argument. The expression f x already has type B → C. There is no need to introduce a B argument here.

This is partial application: supplying some arguments leaves a function for the remaining inputs. Arrows group to the right, so A → B → C means A → (B → C). Thus f x is a complete function value and can be submitted as a complete answer.`
  },
  L6: {
    'zh-CN': `本关换了填写内容：题目已经固定了项 f x，空槽位于它后面的冒号之后，要你写出这个项的类型。先看已知条件 f : A → B、x : A。

f 收到 A 类型的参数 x，返回值的类型就是 B。从左侧找到符号 B，直接把它放进类型空槽，再点击“检查”。这关提交的是 B 这个类型。

类型自身也能通过符号积木来引用。读题时先看空槽的位置：平常是在构造一个给定类型的项，这里则是在说明已有的项具有什么类型。目标中的 f x 已经给好，空槽中再搭一次 f x 会填错内容。`,
    en: `The slot has a different role in this level. The term f x is already fixed, and the hole after its colon asks for that term's type. Start with the supplied declarations f : A → B and x : A.

Applying f to its A argument x produces a result of type B. Find the symbol B on the left, place it directly in the type slot, and press Check. Your submission is the type B.

Types can themselves be referenced using symbol blocks. Look at the slot's position when reading a problem: most levels ask you to construct a term of a given type; this one asks you to describe an existing term's type. The fixed f x is already provided, so building f x again in the hole fills the wrong role.`
  },
  L7: {
    'zh-CN': `这里也要填写已有项 f a 的类型。现在 f : (x : A) → B x，其中 B : A → Type 是类型族：输入不同的 A 类型值，得到的结果类型也可以跟着变化。

把 f 的参数 x 换成实际传入的 a，结果类型就得到 B a。拖出应用积木，函数位置放类型族 B，参数位置放 a，把组成的 B a 接到类型空槽。

这正是依赖函数的用法：返回类型可以引用输入的值。单独的 B 仍然是一个等待参数的类型族；本题需要的是它在 a 处给出的具体类型 B a。留意这里应用的是 B，题目中的 f a 已经固定好了。`,
    en: `Again, submit the type of a fixed term, this time f a. Now f : (x : A) → B x, where B : A → Type is a type family: its resulting type may change with its A input.

Replace the parameter x with the actual argument a to obtain the result type B a. Use an application block with the type family B in the function slot and a in the argument slot, then put B a in the type hole.

This is dependent application: the output type may refer to the input value. B alone is still a family waiting for an argument; this problem needs its type at a, namely B a. The application you construct uses B. The term f a is already fixed in the problem.`
  },
  L8: {
    'zh-CN': `目标中的 1 表示单元类型。它的引入规则给出一个规范元素 ★，并规定 ★ : 1。本关要你使用这个规则，构造一个属于单元类型的项。

从左侧拖出 ★，放进答案槽，再检查即可。工具箱中的 1 用来表示单元类型本身，★ 则是要提交的元素；读冒号两边，可以看出它们各自扮演的角色。

单元类型适合表达“这里有一个结果，但无需携带额外信息”。先记住这组关系：1 是类型，★ 是它的规范元素。后面的关卡会继续使用这个类型，学习怎样处理一个已知的单元类型值。`,
    en: `The goal 1 names the unit type. Its introduction rule provides a canonical element ★ and states ★ : 1. This level asks you to use that rule to construct a term belonging to unit.

Drag ★ from the left into the answer slot and check it. The 1 block represents the unit type itself, while ★ is the element to submit. Reading the two sides of the colon helps distinguish their roles.

Unit is useful when a result exists but carries no additional information. Remember the relationship: 1 is a type, and ★ is its canonical element. The following levels will keep using this type to show how to handle an already supplied unit value.`
  },
  L9: {
    'zh-CN': `已知 u : 1、类型族 C : 1 → Type，以及 c : C ★。目标是 C u：需要根据单元值 u，得到类型族在 u 处要求的结果。这就是单元类型的消去规则。

把 unitrec 放进答案槽。它的 u 槽放 u，C 槽放类型族 C，c 槽放基本情况 c，得到 unitrec u C c。积木会把“在 ★ 时怎么办”推广为“处理任意 u : 1”。

c 的类型写着 C ★，而目标写着 C u；u 还是一个变量，检查器不会直接把它改写成 ★。unitrec 明确提供了这一步依赖消去，所以能够得到所需的 C u。这里直接传入整个类型族 C。`,
    en: `You have u : 1, a type family C : 1 → Type, and c : C ★. The goal C u asks for the result required by that family at u. The unit elimination rule supplies it.

Place unitrec in the answer slot. Fill its u slot with u, its C slot with the family C, and its c slot with the base case c. This builds unitrec u C c, extending “what to do at ★” to any u : 1.

The type of c is written C ★, while the goal is C u. Since u is still a variable, the checker does not simply rewrite it to ★. The eliminator explicitly provides the dependent elimination step needed to obtain C u. Pass the entire family C into the C slot.`
  },
  L10: {
    'zh-CN': `这关观察单元消去子的计算过程。已知 c : C ★，目标也是 C ★；本关特别要求使用 unitrec，展示消去子遇到规范元素 ★ 时怎样计算。

把 unitrec 接到答案槽：u 槽放 ★，C 槽放类型族 C，c 槽放 c，构成 unitrec ★ C c。这里把上一关的未知单元值 u，换成了明确的 ★。

计算规则规定 unitrec ★ C c ≡ c，所以这个表达式会归约成基本情况 c。符号 ≡ 表示计算后定义相等。单独提交 c 虽然具有目标类型，本关仍会提示你使用 unitrec，才能把这条计算规则展示出来。`,
    en: `This level examines the computation of unit elimination. You have c : C ★, and the goal is also C ★. The level specifically requires unitrec to demonstrate how the eliminator computes on the canonical element ★.

Put unitrec in the answer slot: use ★ in the u slot, the family C in the C slot, and c in the c slot. The result is unitrec ★ C c. The unknown u from the previous level has become the explicit element ★.

The computation rule is unitrec ★ C c ≡ c, so the expression reduces to its base case. The symbol ≡ means definitional equality by computation. Although c alone has the goal type, this level still requires the unitrec block to demonstrate that rule.`
  },
  L11: {
    'zh-CN': `0 表示空类型，它没有构造元素的引入规则。题目把 e : 0 作为一个已有假设交给你，目标是任意类型 A；现在要学习怎样使用这个特殊的假设。

把 absurd 积木放进答案槽，再把 e 接到它的输入位置，得到 absurd e。空类型的消去规则允许从一个 e : 0 构造任意目标类型的项，目标槽会告诉它本次需要 A。

可以把这理解为处理一个不可能发生的分支：空类型没有需要逐一考虑的构造情况，因此这里也没有分支要填。你使用的是题目给定的 e；这条规则本身不会凭空创建一个空类型元素。`,
    en: `The type 0 is empty: it has no introduction rule for constructing elements. The problem supplies e : 0 as a hypothesis and asks for an arbitrary type A. You are learning how to use that special hypothesis.

Put an absurd block in the answer slot and connect e to its input, forming absurd e. Empty elimination allows a term of any target type to be constructed from e : 0. The answer slot tells it that the current target is A.

Think of this as handling an impossible branch. Empty has no constructor cases to consider, so there are no branches to fill in. You are using the supplied e; the elimination rule itself does not create an element of the empty type from nothing.`
  },
  L12: {
    'zh-CN': `目标 A × B 要求一个序对：第一部分具有类型 A，第二部分具有类型 B。题目已经给了 a : A 和 b : B，正好可以分别提供这两个部分。

把配对积木放进答案槽，左槽放 a，右槽放 b，组成 ⟨a, b⟩。序对会把两个项保存到一个结果里，它们在各自位置上都要满足对应的类型要求。

这个积类型也能写成第二部分不依赖第一部分的 Σ 类型。顺序体现了类型结构：A × B 的第一项要符合 A，第二项要符合 B。后面会进一步学习如何拆开一对，并使用拆出的两个成员。`,
    en: `The goal A × B asks for an ordered pair whose first component has type A and whose second has type B. The supplied a : A and b : B provide exactly those two components.

Put a pair block in the answer slot, with a in its left slot and b in its right slot, forming ⟨a, b⟩. A pair stores two terms in one result, and each component must satisfy the type required by its position.

This product is also a Σ-type whose second component does not depend on the first. Order reflects the type structure: the first component of A × B must fit A, and the second must fit B. The next levels show how to unpack a pair and use its components.`
  },
  L13: {
    'zh-CN': `目标 (Σ x : A. B x) → A 要求一个函数：接收依赖对，取出第一部分。对中的第二部分类型会依赖第一部分，但本关只需要返回那个 A。

先放 λ，把输入命名为 p；函数体放 sigma_ind。它的 p = 槽放外层 p，“目标族 λ _ ▸”后的空槽放 A，表示结果类型始终是 A。“归纳步骤 λ a λ b ▸”后的空槽放该步骤绑定的 a。

sigma_ind 把 p 按序对拆开，让步骤中可用 a : A、b : B a。积木已经带好了目标族和步骤的 λ，直接在它们后面填表达式即可。完成后相当于定义了 fst，返回每个依赖对的第一部分。`,
    en: `The goal (Σ x : A. B x) → A asks for a function that receives a dependent pair and returns its first component. The second component's type depends on the first, but this level only needs the A component.

Start with λ and name its input p. Put sigma_ind in its body. Fill the p = slot with outer p. Put A after “motive λ _ ▸”, making the result type constantly A. After “step λ a λ b ▸”, put the a bound by that step.

The eliminator unpacks p so that the step has a : A and b : B a. The block already supplies the motive and step lambdas; fill their expression slots directly. The completed function defines fst, returning the first component of each dependent pair.`
  },
  L14: {
    'zh-CN': `目标 (A × B) → B 要求从序对取出第二部分。这里的 B 是固定类型，序对的第二成员不依赖第一成员，所以拆开后可以直接把它作为结果返回。

先用 λ 引入 p，在函数体里放 sigma_ind。p = 槽放外层 p；“目标族 λ _ ▸”后的空槽填 B；“归纳步骤 λ a λ b ▸”后的空槽填这一步绑定的 b。完整结构与上一关相同，返回成员换成了第二个。

目标族说明整个消去过程要得到什么类型，步骤说明拿到成员后怎样构造结果。这里步骤中的 a : A、b : B，因此返回 b 正好满足 B。使用步骤自己的局部变量，并把它留在对应步骤的作用域里。`,
    en: `The goal (A × B) → B asks you to extract a pair's second component. Here B is a fixed type, independent of the first component, so the second member can be returned directly after unpacking.

Introduce p with λ and put sigma_ind in its body. Fill p = with outer p, put B after “motive λ _ ▸”, and put the step's own b after “step λ a λ b ▸”. The structure matches the previous level, but returns the second member.

The motive states the result type of the elimination, and the step explains how to produce that result from the members. Here the step has a : A and b : B, so b fits the target B. Use the variable bound by this step and keep its reference inside that step's scope.`
  },
  L15: {
    'zh-CN': `Id A a a 是一个恒等类型，表达“A 中的 a 与它自己相等”。本关要在答案槽中放入这个类型的证明。相等两边都是同一个项，正好可以使用自反性。

从左侧拖出 refl，直接放进答案槽，再点击检查。refl 会从目标槽得知正在证明哪个类型、哪两个端点的相等，所以这里无须给它另填参数。

Id 积木用于构造相等命题的类型，refl 用于构造自反相等的证明。检查器还会计算表达式：当两端经过计算得到定义相等的结果时，也可以用 refl。当前这关从最直接的 a 与 a 开始。`,
    en: `Id A a a is an identity type expressing that a in A equals itself. The answer slot asks for a proof of this type. Both endpoints are the same term, so reflexivity applies immediately.

Drag refl from the left directly into the answer slot, then check it. The goal tells refl which type and endpoints are involved, so no additional parameter slots need to be filled here.

The Id block constructs the type of an equality statement; refl constructs a reflexivity proof. The checker also computes expressions: refl can be used when the endpoints become definitionally equal by computation. This level starts with the simplest case, a compared with a itself.`
  },
  L16: {
    'zh-CN': `类型也可以作为项来使用。Type 0 是一个宇宙，用来容纳这一层的类型；它自身又具有更高一层的类型 Type 1。目标正是要求提供一个具有类型 Type 1 的项。

拖出宇宙积木 Type，把层级选为 0，再放进答案槽。检查的关系是 Type 0 : Type 1。积木默认层级就是 0，可以先确认数字后直接提交。

宇宙按层级逐层上升：Type 1 又属于 Type 2，以此类推。留意当前正在构造哪一层的项；如果把积木层级改成 1，它的类型也会随之升到 Type 2。通过宇宙，我们可以在表达式中继续讨论和构造类型。`,
    en: `Types can also be used as terms. Type 0 is a universe containing types at that level, and it itself has the higher type Type 1. The goal asks you to provide a term whose type is Type 1.

Drag out a universe block, set its level to 0, and put it in the answer slot. The checked relationship is Type 0 : Type 1. The block defaults to level 0, so confirm the number and submit it.

Universes continue upward: Type 1 has type Type 2, and so on. Keep track of which level's term you are building. Changing the block's level to 1 changes its type to Type 2. Universes let expressions discuss and construct types themselves.`
  }
};
