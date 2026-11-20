/* Block library, named declarations, and symbol inspection. */
const workshopMessages = {
  'zh-CN': {
    workshopTitle: '构造工作坊', symbolsTitle: '可用符号', symbolHelp: '左侧可以直接拖取；点击这里的符号也能创建引用。局部变量须放回自己的作用域。',
    declarationsTitle: '自己的声明', declarationHelp: '填写名称，把类型和定义体拖进声明积木。声明仅在本关生效；切关或重置会清空。', selectionTitle: '类型反馈',
    addAssumption: '+ 假设', addDefinition: '+ 定义', addAxiom: '+ 公理', search: '输入名字查找符号', common: '积木：本关常用 ▾', all: '积木：全部 ▾',
    known: '已知符号', local: '局部变量', own: '自定义', select: '选择一个积木，查看它的类型。', pending: '尚未完成', valid: '已检查',
    dependent: '类型正确；使用额外假设：', experiment: '。这是实验结果，不计关卡星数。', definition: '定义', assumption: '假设', axiom: '公理',
    selected: '当前目标：', cannotInfer: '这个构造需要目标类型；把它放进答案或类型标注积木后检查。',
    notesTitle: '画布注释', addNote: '+ 注释', restoreTutorial: '恢复关卡解说', clearNotes: '清空我的笔记', notesHelp: '注释可以拖动、折叠和附着到积木。你的笔记会自动保存，重置答案也会保留。', clearNotesConfirm: '清空本关的个人笔记？关卡解说会保留。'
  },
  en: {
    workshopTitle: 'Construction workshop', symbolsTitle: 'Available symbols', symbolHelp: 'Drag from the left, or click a symbol here to create a reference. Local variables belong inside their scope.',
    declarationsTitle: 'Your declarations', declarationHelp: 'Name a declaration and attach its type and definition. Declarations belong to this level; switching or resetting clears them.', selectionTitle: 'Type feedback',
    addAssumption: '+ Assumption', addDefinition: '+ Definition', addAxiom: '+ Axiom', search: 'Find a symbol by name', common: 'Blocks: suggested ▾', all: 'Blocks: all ▾',
    known: 'Given symbols', local: 'Local variables', own: 'Custom', select: 'Select a block to inspect its type.', pending: 'Incomplete', valid: 'Checked',
    dependent: 'Type correct; uses extra assumptions: ', experiment: '. Experimental result; no level stars awarded.', definition: 'Definition', assumption: 'Assumption', axiom: 'Axiom',
    selected: 'Current goal: ', cannotInfer: 'This construction needs an expected type. Put it in the answer or a type annotation and check it.',
    notesTitle: 'Canvas notes', addNote: '+ Note', restoreTutorial: 'Restore explanations', clearNotes: 'Clear my notes', notesHelp: 'Move, collapse, or attach notes to blocks. Your notes are saved automatically and survive answer resets.', clearNotesConfirm: 'Clear your notes for this level? Tutorial explanations will stay.'
  }
};
export const wt = (key) => workshopMessages[window.I18N.locale][key];

export function createWorkshop({ getWorkspace, getLevel, ensureAnswer, binderTypesText, goalText, toJson }) {
  const $ = s => document.querySelector(s);
  const MLTT = window.MLTT;
  const t = window.I18N.t;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let allBlocks = false;
  let toolboxSignature = '';
  let lastWorkshopResult = null;

  // ---------- Toolbox ----------
  const GROUPS = [
    { name: 'Types', colour: '#5b8def', types: ['tt_pi', 'tt_sigma', 'tt_id', 'tt_nat', 'tt_bool', 'tt_empty', 'tt_unit', 'tt_U'] },
    { name: 'Terms', colour: '#4f9d76', types: ['tt_lam', 'tt_var', 'tt_app', 'tt_pair', 'tt_zero', 'tt_suc', 'tt_true', 'tt_false', 'tt_star', 'tt_refl', 'tt_let', 'tt_annot', 'tt_hole'] },
    { name: 'Eliminators', colour: '#c47a3d', types: ['tt_natrec', 'tt_unitrec', 'tt_sigma_ind', 'tt_J', 'tt_if', 'tt_absurd'] },
    { name: 'Lemmas', colour: '#7b6ee0', types: ['tt_lemma'] },
  ];

  function parseXml(str) {
    if (Blockly.utils && Blockly.utils.xml && Blockly.utils.xml.textToDom) {
      return Blockly.utils.xml.textToDom(str);
    }
    return new DOMParser().parseFromString(str, 'text/xml').documentElement;
  }

  function localBinderSymbols() {
    if (!getWorkspace()) return [];
    const symbols = [];
    const labels = { tt_lam: 'λ', tt_pi: 'Π', tt_sigma: 'Σ', tt_natrec: 'natrec', tt_sigma_ind: 'Σ-ind', tt_J: 'J', tt_let: 'let' };
    for (const block of getWorkspace().getAllBlocks(false)) {
      if (block.type === 'tt_answer') continue;
      for (const uid of new Set(Object.values(block.ttBinds || {}).flat())) {
        const field = block.ttNameFields && block.ttNameFields[uid];
        if (!field) continue;
        const name = block.getFieldValue(field);
        symbols.push({ name, owner: labels[block.type] || block.type, uid,
          type: wt('local'), blockType: 'tt_var', field: 'REF', value: window.LBM.encodeRef(uid, name) });
      }
    }
    return symbols;
  }

  function toolboxXml() {
    const pal = new Set(getLevel().palette);
    let xml = '<xml>';
    xml += '<label text="' + esc(wt('known')) + '"></label>';
    getLevel().givens.forEach((g, i) => { xml += '<block type="tt_given"><field name="IDX">' + i + '</field></block>'; });
    const ans = getWorkspace() && getWorkspace().getBlocksByType('tt_answer', false)[0];
    (getLevel().answerBinders || []).forEach((b, i) => {
      const uid = ans && ans.ttBinds.TERM[i];
      const name = ans ? ans.getFieldValue('BNAME' + i) : b.name;
      xml += '<block type="tt_var"><field name="REF">' + esc(window.LBM.encodeRef(uid || '', name)) + '</field></block>';
    });
    for (const symbol of window.GAME_SYMBOLS || []) {
      xml += '<block type="tt_symbol"><field name="REF">' + esc(symbol.id) + '</field></block>';
    }
    const locals = localBinderSymbols();
    if (locals.length) xml += '<label text="' + esc(wt('local')) + '"></label>';
    for (const symbol of locals) {
      xml += '<label text="' + esc(symbol.owner + ' · ' + symbol.name) + '"></label>';
      xml += '<block type="tt_var"><field name="REF">' + esc(symbol.value) + '</field></block>';
    }
    for (const g of GROUPS) {
      const types = g.types.filter((t) => t !== 'tt_var' && (allBlocks || pal.has(t)));
      if (!types.length) continue;
      xml += '<label text="' + esc(t(g.name)) + '"></label>';
      for (const t of types) {
        xml += '<block type="' + t + '">';
        if (t === 'tt_lemma') xml += '<field name="NAME">add</field>';
        xml += '</block>';
      }
    }
    xml += '</xml>';
    return parseXml(xml);
  }

  // ---------- Declarations and symbols ----------
  function declarationJson() {
    return getWorkspace().getTopBlocks(false).filter(b => b.type === 'tt_declare').map(toJson);
  }

  function checkConstruction() {
    const ans = ensureAnswer();
    return MLTT.checkWorkshop(getLevel(), toJson(ans), declarationJson());
  }

  function createReference(symbol) {
    const b = getWorkspace().newBlock(symbol.blockType);
    b.setFieldValue(symbol.value, symbol.field);
    b.initSvg();
    b.render();
    const metrics = getWorkspace().getMetrics();
    b.moveBy((metrics.viewLeft + 35) / getWorkspace().scale, (metrics.viewTop + 45) / getWorkspace().scale);
    getWorkspace().centerOnBlock(b.id);
    b.select();
  }

  function availableSymbols() {
    const symbols = getLevel().givens.map((g, i) => ({ name: g.name, type: ((window.GAME_GIVENS[i] || {}).label || '').slice(g.name.length + 3),
      blockType: 'tt_given', field: 'IDX', value: String(i) }));
    const ans = ensureAnswer();
    (getLevel().answerBinders || []).forEach((b, i) => symbols.push({ name: ans.getFieldValue('BNAME' + i),
      type: binderTypesText()[i], blockType: 'tt_var', field: 'REF', value: window.LBM.encodeRef(ans.ttBinds.TERM[i], ans.getFieldValue('BNAME' + i)) }));
    symbols.push(...localBinderSymbols().map(s => ({ ...s, type: s.type + ' · ' + s.owner })));
    for (const d of window.GAME_SYMBOLS || []) {
      const checked = lastWorkshopResult && (lastWorkshopResult.declarations || []).find(x => x.id === d.id);
      symbols.push({ name: d.name, type: checked ? checked.typeText : wt('pending'), blockType: 'tt_symbol', field: 'REF', value: d.id });
    }
    return symbols;
  }

  function renderSymbols() {
    const query = $('#symbolSearch').value.trim().toLowerCase();
    $('#symbolList').replaceChildren();
    for (const symbol of availableSymbols().filter(s => s.name.toLowerCase().includes(query))) {
      const button = document.createElement('button');
      button.type = 'button';
      const name = document.createElement('span'); name.className = 'name'; name.textContent = symbol.name;
      const type = document.createElement('span'); type.className = 'type'; type.textContent = ' : ' + symbol.type;
      button.append(name, type);
      button.addEventListener('click', () => createReference(symbol));
      $('#symbolList').append(button);
    }
  }

  function renderSelection() {
    const selected = Blockly.getSelected();
    const el = $('#selectionInfo');
    if (!selected || selected.workspace !== getWorkspace()) { el.textContent = wt('select'); return; }
    if (MLTT.inspectWorkshop) {
      const r = MLTT.inspectWorkshop(getLevel(), toJson(ensureAnswer()), declarationJson(), selected.id, toJson(selected));
      if (r.selectedType) { el.textContent = r.selectedType; return; }
      if (r.selectedError) { el.textContent = window.I18N.error(r.selectedError); return; }
    }
    el.textContent = wt('selected') + goalText() + '\n' + wt('cannotInfer');
  }

  function refreshWorkshop() {
    window.GAME_SYMBOLS = getWorkspace().getTopBlocks(false).filter(b => b.type === 'tt_declare').map(b => ({ id: b.id, name: b.getFieldValue('NAME') }));
    lastWorkshopResult = checkConstruction();
    const signature = JSON.stringify([allBlocks, window.I18N.locale, window.GAME_SYMBOLS, localBinderSymbols(),
      getWorkspace().getBlocksByType('tt_answer', false).map(b => ((b.ttBinds && b.ttBinds.TERM) || []).map(uid => [uid, b.getFieldValue(b.ttNameFields[uid])]))]);
    if (signature !== toolboxSignature) {
      toolboxSignature = signature;
      getWorkspace().updateToolbox(toolboxXml());
    }
    for (const b of getWorkspace().getBlocksByType('tt_symbol', false)) {
      const field = b.getField('REF');
      if (field) field.forceRerender();
    }
    $('#declarationList').replaceChildren();
    for (const d of window.GAME_SYMBOLS) {
      const row = document.createElement('div');
      const checked = (lastWorkshopResult.declarations || []).find(x => x.id === d.id);
      row.textContent = d.name + ' · ' + (checked ? wt('valid') + ' : ' + checked.typeText : wt('pending'));
      $('#declarationList').append(row);
    }
    if (lastWorkshopResult.phase === 'declaration' && lastWorkshopResult.error) {
      const row = document.createElement('p');
      row.textContent = window.I18N.error(lastWorkshopResult.error);
      $('#declarationList').append(row);
    }
    renderSymbols();
    renderSelection();
  }

  function addDeclaration(kind) {
    const used = new Set(availableSymbols().map(s => s.name));
    const name = window.LBM.nextBinderName(kind === 'definition' ? 'myFunction' : 'a', used);
    const b = getWorkspace().newBlock('tt_declare');
    b.setFieldValue(kind, 'KIND');
    b.setFieldValue(name, 'NAME');
    b.initSvg(); b.render();
    const count = getWorkspace().getBlocksByType('tt_declare', false).length;
    b.moveBy(120, 180 + count * 85);
    getWorkspace().centerOnBlock(b.id); b.select();
    refreshWorkshop();
  }


  function renderLanguage() {
    document.querySelectorAll('[data-workshop-text]').forEach(el => { el.textContent = wt(el.dataset.workshopText); });
    $('#symbolSearch').placeholder = wt('search');
    $('#libraryToggle').textContent = wt(allBlocks ? 'all' : 'common');
  }

  function bindControls() {
    $('#libraryToggle').addEventListener('click', () => {
      allBlocks = !allBlocks;
      $('#libraryToggle').textContent = wt(allBlocks ? 'all' : 'common');
      refreshWorkshop();
    });
    $('#symbolSearch').addEventListener('input', renderSymbols);
    $('#addAssumption').addEventListener('click', () => addDeclaration('assumption'));
    $('#addDefinition').addEventListener('click', () => addDeclaration('definition'));
    $('#addAxiom').addEventListener('click', () => addDeclaration('axiom'));
  }

  return { toolboxXml, checkConstruction, renderSymbols, renderSelection, refreshWorkshop, addDeclaration, renderLanguage, bindControls,
    reset() { lastWorkshopResult = null; },
    get lastResult() { return lastWorkshopResult; }
  };
}
