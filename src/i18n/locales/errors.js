/* Error messages stay separate from the locale-independent checker. */
(function (global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  global.MLTT_ERRORS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const en = {
    declarationName: 'Enter a symbol name without spaces or colons',
    declarationDuplicate: 'Symbol name is already used: {name}',
    declarationKind: 'Unknown declaration kind',
    declarationId: 'Declaration needs a unique ID',
    declarationMissing: 'Declaration has been removed or is unavailable: {id}',
    declarationCircular: 'Circular declaration: {name}',
    declarationIncomplete: 'Complete the type and definition before using this declaration',
    internalApply: 'Attempted to apply a non-function',
    internalFst: 'fst applied to a non-pair',
    internalSnd: 'snd applied to a non-pair',
    undefinedLemma: 'Undefined lemma {name}',
    holeEmpty: 'Hole has no content yet',
    unknownTerm: 'Unknown term {term}',
    unknownValue: 'Unknown value {value}',
    unknownSpine: 'Unknown spine {spine}',
    freeVariable: 'Free variable out of bounds (scope resolution error)',
    notFunction: 'Not a function, cannot apply: {type}',
    fstNotPair: 'fst needs a pair, but got: {type}',
    sndNotPair: 'snd needs a pair, but got: {type}',
    reflNeedsType: 'refl needs to know which equality it proves (put it in a goal or add an annotation)',
    lambdaNeedsType: 'λ needs an expected type to be checked (put it in a typed position)',
    ifNeedsType: 'if needs an expected type to check both branches',
    absurdNeedsType: 'absurd needs an expected type',
    holeNeedsType: 'Hole needs an expected type',
    sigmaIndNotPair: 'sigma_ind needs a Sigma value, but got: {type}',
    notType: 'Cannot tell whether this is a type: {type}',
    lambdaGoal: 'λ needs a function type, but the goal is: {type}',
    lambdaParameter: 'λ parameter type is {actual}, but {expected} is required',
    pairGoal: 'A pair needs a Σ type, but the goal is: {type}',
    reflGoal: 'refl can only prove an equality, but the goal is: {type}',
    reflSides: 'refl can only prove definitional equality; the left side is {left} and the right side is {right}',
    annotationType: 'Annotation type is {actual}, but {expected} is required',
    typeMismatch: 'Expected {expected} here, but got {actual}',
    inferredMismatch: 'Inferred type is {expected}, but you gave {actual}',
    noBlock: 'No block here yet',
    emptySlot: 'A slot is still empty',
    variableScope: 'Variable "{name}" is not in scope',
    givenScope: 'This given is not in the current level context',
    emptyAnswer: 'The "answer" slot is still empty',
    unknownBlock: 'Unknown block type {type}',
    requiredBlock: 'This level requires the {name} block'
  };
  const zhCN = {
    declarationName: '请填写符号名称，名称中不能有空格或冒号。',
    declarationDuplicate: '符号名称已被使用：{name}',
    declarationKind: '无法识别的声明种类。',
    declarationId: '每个声明都需要独立的标识。',
    declarationMissing: '声明已被删除或当前不可用：{id}',
    declarationCircular: '声明相互循环引用：{name}',
    declarationIncomplete: '请先补全这个声明的类型和定义体。',
    internalApply: '尝试调用非函数的值',
    internalFst: 'fst 的参数不是序对',
    internalSnd: 'snd 的参数不是序对',
    undefinedLemma: '未定义的引理 {name}',
    holeEmpty: '占位符还没有内容',
    unknownTerm: '未知项 {term}',
    unknownValue: '未知值 {value}',
    unknownSpine: '未知消去操作 {spine}',
    freeVariable: '自由变量超出范围（作用域解析错误）',
    notFunction: '无法应用非函数类型：{type}',
    fstNotPair: 'fst 需要序对，实际得到：{type}',
    sndNotPair: 'snd 需要序对，实际得到：{type}',
    reflNeedsType: 'refl 需要知道要证明哪个等式（将它放入目标中或添加类型标注）',
    lambdaNeedsType: '检查 λ 需要预期类型（将它放在有类型的位置）',
    ifNeedsType: 'if 需要预期类型来检查两个分支',
    absurdNeedsType: 'absurd 需要预期类型',
    holeNeedsType: '占位符需要预期类型',
    sigmaIndNotPair: 'sigma_ind 需要 Σ 类型的值，实际得到：{type}',
    notType: '无法判断这是否为类型：{type}',
    lambdaGoal: 'λ 需要函数类型，但目标是：{type}',
    lambdaParameter: 'λ 参数类型是 {actual}，需要的是 {expected}',
    pairGoal: '序对需要 Σ 类型，但目标是：{type}',
    reflGoal: 'refl 只能证明等式，但目标是：{type}',
    reflSides: 'refl 只能证明定义相等；左侧是 {left}，右侧是 {right}',
    annotationType: '标注的类型是 {actual}，需要的是 {expected}',
    typeMismatch: '此处需要 {expected}，实际得到 {actual}',
    inferredMismatch: '推导出的类型是 {expected}，你给出的是 {actual}',
    noBlock: '这里还没有积木',
    emptySlot: '还有空槽',
    variableScope: '变量“{name}”不在作用域内',
    givenScope: '这个已知条件不在当前关卡的上下文中',
    emptyAnswer: '“答案”槽还是空的',
    unknownBlock: '未知积木类型 {type}',
    requiredBlock: '本关需要使用 {name} 积木'
  };
  const dictionaries = { en, 'zh-CN': zhCN };
  function format(error, locale) {
    const dictionary = dictionaries[locale];
    const template = error && dictionary && Object.prototype.hasOwnProperty.call(dictionary, error.messageKey)
      ? dictionary[error.messageKey] : null;
    if (!template) return error && error.message;
    const params = error.messageParams || {};
    return template.replace(/\{([^{}]+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match);
  }
  return { en, 'zh-CN': zhCN, format };
});
