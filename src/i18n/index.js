/* Small, synchronous locale service. Browser assets are provided by the npm build. */
(function (global) {
  'use strict';
  const en = {
    check: 'Check', viewAnswer: 'View answer', hint: 'Hint', reset: 'Reset', previous: 'Previous level', next: 'Next level',
    selectLevel: 'Select level', language: 'Language', stars: 'Stars for this level', stay: 'Stay here',
    nextAction: 'Next level →', back: 'Back to level 1', brand: 'Block Workshop',
    Types: 'Types', Terms: 'Terms', Eliminators: 'Eliminators', Lemmas: 'Lemmas', Given: 'Given', Rules: 'Inference rules',
    idle: 'Drag blocks from the left onto the canvas and put the term into the answer slot; other blocks can be scratch.',
    inferIdle: 'Read the fixed term in the requirement, submit its type below, then press Check.',
    variable: 'Variable {name}: bound at {binder}', scope: 'Variable "{name}" is out of scope: drag it back inside its binder',
    duplicate: 'Duplicate answer slot: only the first one is checked', missing: 'Cannot find the "answer" block on the canvas: press Reset to restore it.',
    emptyType: 'The submission slot is still empty: submit the type of the term in the requirement.',
    emptyCanvas: 'The submission slot is still empty: drag your construction into the problem container.',
    empty: 'The "answer" slot is still empty: drag an expression in from the left.',
    internal: 'Internal error: {message}', failed: 'Check failed', highlighted: '(highlighted the failing block)',
    correct: '✓ Correct type.', counts: '{count} blocks · target {par} blocks · ',
    hintsUsed: 'used {count} hints', noHints: 'no hints', holes: 'There are {count} holes left to fill.',
    passed: '"{title}" passed · {count} blocks', clear: 'Clear all blocks in this level?',
    looksRight: '✓ Looks right. Press Check to confirm.', fatal: 'Blockly failed to load. Please reload the page.'
  };
  const zh = {
    check: '检查', viewAnswer: '查看答案', hint: '提示', reset: '重置', previous: '上一关', next: '下一关',
    selectLevel: '选择关卡', language: '语言', stars: '本关星数', stay: '留在本关',
    nextAction: '下一关 →', back: '返回第一关', brand: '积木工坊',
    Types: '类型', Terms: '项', Eliminators: '消去子', Lemmas: '引理', Given: '已知', Rules: '推导规则',
    idle: '从左侧拖入积木，将构造的项放入答案槽；其余积木可以用来打草稿。',
    inferIdle: '阅读判断卡中给出的项，将推导出的类型填入冒号右侧，再点击“检查”。',
    variable: '变量 {name}：绑定于 {binder}', scope: '变量“{name}”超出作用域：请拖回绑定它的积木内部',
    duplicate: '答案槽重复：只检查第一个答案槽', missing: '找不到答案积木，请点击“重置”恢复。',
    emptyType: '提交槽还是空的：请在“提交内容”中放入要求里给定项的类型。',
    emptyCanvas: '提交槽还是空的：请将画布上的构造拖入检查容器的“提交内容”。',
    empty: '答案槽还是空的：请从左侧拖入一个表达式。',
    internal: '内部错误：{message}', failed: '检查失败', highlighted: '（已高亮出错的积木）',
    correct: '✓ 类型正确。', counts: '{count} 块积木 · 目标 {par} 块 · ',
    hintsUsed: '使用了 {count} 条提示', noHints: '未使用提示', holes: '还有 {count} 处空槽需要填写。',
    passed: '“{title}”通过 · {count} 块积木', clear: '清空本关的所有积木？',
    looksRight: '✓ 看起来正确，点击“检查”确认。', fatal: 'Blockly 加载失败，请刷新页面重试。'
  };
  const dictionaries = { en, 'zh-CN': zh };
  for (const locale of Object.keys(dictionaries)) Object.assign(dictionaries[locale], (global.BLOCK_MESSAGES || {})[locale]);
  let locale = 'en';
  try { locale = localStorage.getItem('mltt.locale') || (/^zh\b/i.test(navigator.language) ? 'zh-CN' : 'en'); } catch (_) { /* storage may be disabled */ }
  if (!dictionaries[locale]) locale = 'en';
  function t(key, params = {}) {
    const template = dictionaries[locale][key] || en[key] || key;
    return template.replace(/\{(\w+)\}/g, (match, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match);
  }
  function setLocale(value) {
    if (!dictionaries[value]) throw new Error('Unsupported locale: ' + value);
    locale = value;
    try { localStorage.setItem('mltt.locale', value); } catch (_) { /* switching works without storage */ }
    document.documentElement.lang = locale;
    if (global.Blockly) Object.assign(global.Blockly.Msg, global.BLOCKLY_MESSAGES[locale]);
  }
  global.I18N = {
    t, setLocale, get locale() { return locale; },
    level(lv) {
      if (locale !== 'zh-CN') return lv;
      const localized = Object.assign({}, lv, global.LEVELS_ZH_CN[lv.id]);
      for (const key of ['title', 'tag', 'story']) if (lv[key + 'Zh']) localized[key] = lv[key + 'Zh'];
      return localized;
    },
    error(e) { return global.MLTT_ERRORS.format(e, locale); }
  };
  setLocale(locale);
})(window);
