(function (global) {
  'use strict';
  global.BLOCK_MESSAGES = {
    en: {
      'block.noVariables': '∅ no variables',
      'block.level': 'level',
      'block.given': 'Given',
      'block.varTooltip': 'Local variable. The dropdown only lists binders that are actually in scope.',
      'block.lamTooltip': 'Function. The name is visible only in the body (after the .).',
      'block.piTooltip': 'Dependent function type. x is visible only after →, not in the domain.',
      'block.sigmaTooltip': 'Dependent pair type.',
      'block.letTooltip': 'Local definition.',
      'block.givenTooltip': 'A variable from the level context (A, x, p, ...).',
      'block.binderTooltip': 'Hover: show a variable block; click: rename',
      'block.answerInferTooltip': 'Drag the inferred type into the hole after the term, then press Check.',
      'block.answerTooltip': 'Drag the final answer here, then press Check. Other blocks on the canvas are not checked and can be used as scratch.',
      'block.appTooltip': 'Apply a function to an argument.',
      'block.pairTooltip': 'Construct a pair.',
      'block.idTooltip': 'Equality type: two points of A.',
      'block.annotTooltip': 'Type annotation: write the judgment into the term.',
      'block.reflTooltip': 'Proof of definitional equality.',
      'block.holeTooltip': 'Hole: the expected type is recorded when checking.',
      'block.lemmaTooltip': 'A proven transparent definition.',
      'block.ifMessage': 'if %1 then %2 else %3',
      'block.lemmaMessage': 'lemma %1'
    },
    'zh-CN': {
      'block.noVariables': '∅ 没有变量',
      'block.level': '层',
      'block.given': '已知',
      'block.varTooltip': '局部变量。下拉菜单只列出当前作用域内的绑定变量。',
      'block.lamTooltip': '函数。名称只在函数体中（点号之后）可见。',
      'block.piTooltip': '依赖函数类型。x 只在 → 之后可见，在定义域中不可见。',
      'block.sigmaTooltip': '依赖对类型。',
      'block.letTooltip': '局部定义。',
      'block.givenTooltip': '关卡上下文中的变量（A、x、p 等）。',
      'block.binderTooltip': '悬停显示变量积木；点击重命名',
      'block.answerInferTooltip': '将推导出的类型拖入项之后的空位，然后点击检查。',
      'block.answerTooltip': '将最终答案拖到这里，然后点击检查。画布上的其他积木不会被检查，可用于草稿。',
      'block.appTooltip': '将函数应用于参数。',
      'block.pairTooltip': '构造一个序对。',
      'block.idTooltip': '等式类型：A 中两个点之间的等式。',
      'block.annotTooltip': '类型标注：将类型判断写入项中。',
      'block.reflTooltip': '定义相等的证明。',
      'block.holeTooltip': '空位：检查时会记录预期类型。',
      'block.lemmaTooltip': '已证明的透明定义。',
      'block.ifMessage': '如果 %1 那么 %2 否则 %3',
      'block.lemmaMessage': '引理 %1'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
