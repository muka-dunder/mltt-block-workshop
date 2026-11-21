/* Block library and selection feedback. */
import { refreshRuleCards } from './rule-feedback.js';

const workshopMessages = {
  'zh-CN': {
    workshopTitle: '构造工作坊', selectionTitle: '类型反馈',
    common: '积木：本关常用', all: '积木：全部', libraryLabel: '积木范围',
    known: '已知符号', local: '局部变量', select: '选择一个积木，查看它的类型。', pending: '尚未完成', answerTitle: '题目', locateAnswer: '定位题目',
    dependent: '类型正确；使用额外假设：', selected: '当前目标：', cannotInfer: '这个构造需要目标类型；把它放进答案或类型标注积木后检查。',
    notesTitle: '画布注释', addNote: '+ 注释', notesHelp: '注释可以拖动、折叠和附着到积木。你的笔记会自动保存，重置答案也会保留。', },
  en: {
    workshopTitle: 'Construction workshop', selectionTitle: 'Type feedback',
    common: 'Blocks: suggested', all: 'Blocks: all', libraryLabel: 'Block library',
    known: 'Given symbols', local: 'Local variables', select: 'Select a block to inspect its type.', pending: 'Incomplete', answerTitle: 'Problems', locateAnswer: 'Locate problem',
    dependent: 'Type correct; uses extra assumptions: ', selected: 'Current goal: ', cannotInfer: 'This construction needs an expected type. Put it in the answer or a type annotation and check it.',
    notesTitle: 'Canvas notes', addNote: '+ Note', notesHelp: 'Move, collapse, or attach notes to blocks. Your notes are saved automatically and survive answer resets.', }
};
export const wt = (key) => workshopMessages[window.I18N.locale][key];

export function createWorkshop({ getWorkspace, getLevel, ensureAnswer, goalText, toJson }) {
  const $ = s => document.querySelector(s);
  const MLTT = window.MLTT;
  const t = window.I18N.t;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let allBlocks = false;
  let toolboxSignature = '';
  let lastWorkshopResult = null;

  // ---------- Toolbox ----------
  const GROUPS = [
    { name: 'Rules', colour: '#5894aa', types: ['tt_binding', 'tt_rule_app', 'tt_judgment', 'tt_rule_pi_elim', 'tt_rule_theorem'] },
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
    const labels = { tt_binding: window.I18N.locale === 'zh-CN' ? '条件' : 'Context', tt_lam: 'λ', tt_pi: 'Π', tt_sigma: 'Σ', tt_natrec: 'natrec', tt_sigma_ind: 'Σ-ind', tt_J: 'J', tt_let: 'let' };
    for (const block of getWorkspace().getAllBlocks(false)) {
      if (['tt_answer', 'tt_problem'].includes(block.type) || block.ttContextDisplay) continue;
      for (const uid of new Set(Object.values(block.ttBinds || {}).flat())) {
        const field = block.ttNameFields && block.ttNameFields[uid];
        if (!field) continue;
        const name = block.getFieldValue(field);
        symbols.push({ name, owner: labels[block.type] || block.type, uid, kind: block.type,
          type: wt('local'), blockType: 'tt_var', field: 'REF', value: window.LBM.encodeRef(uid, name) });
      }
    }
    return symbols;
  }

  function toolboxXml() {
    const pal = new Set(getLevel().palette);
    let xml = '<xml>';
    xml += '<label text="' + esc(wt('answerTitle')) + '"></label>';
    xml += getLevel().custom ? '<block type="tt_problem"></block>'
      : '<button text="' + esc(wt('locateAnswer')) + '" callbackKey="OPEN_PROBLEM"></button>';
    xml += '<label text="' + esc(wt('known')) + '"></label>';
    const symbols = localBinderSymbols();
    for (const symbol of symbols.filter(symbol => symbol.kind === 'tt_binding')) {
      xml += '<block type="tt_var"><field name="REF">' + esc(symbol.value) + '</field></block>';
    }
    for (const symbol of window.GAME_SYMBOLS || []) {
      xml += '<block type="tt_symbol"><field name="REF">' + esc(symbol.id) + '</field></block>';
    }
    const locals = symbols.filter(symbol => symbol.kind !== 'tt_binding');
    if (locals.length) xml += '<label text="' + esc(wt('local')) + '"></label>';
    for (const symbol of locals) {
      xml += '<label text="' + esc(symbol.owner + ' · ' + symbol.name) + '"></label>';
      xml += '<block type="tt_var"><field name="REF">' + esc(symbol.value) + '</field></block>';
    }
    for (const g of GROUPS) {
      const types = g.types.filter((t) => (t !== 'tt_var' || getLevel().custom || allBlocks) && (getLevel().custom || allBlocks || pal.has(t) || t === 'tt_binding'
        || ((t === 'tt_rule_pi_elim' || t === 'tt_rule_theorem') && (pal.has('tt_rule_app') || pal.has('tt_rule_judgments')))));
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
    if (getLevel().custom && ans) return MLTT.checkCustomProblem(toJson(ans), declarationJson());
    if (!ans) return MLTT.checkWorkshop({ givens: [], goal: MLTT.UNIT },
      { type: 'tt_answer', inputs: { TERM: { type: 'tt_hole', id: 'custom-inspection' } } }, declarationJson());
    return MLTT.checkWorkshop(getLevel(), toJson(ans), declarationJson());
  }

  function renderSelection() {
    const selected = Blockly.getSelected();
    const el = $('#selectionInfo');
    if (!selected || selected.workspace !== getWorkspace()) { el.textContent = wt('select'); return; }
    if (getLevel().custom && selected.type === 'tt_problem') {
      const r = MLTT.checkCustomProblem(toJson(selected), declarationJson());
      el.textContent = r.goalV ? MLTT.showVal(r.ctx, r.goalV) : r.error ? window.I18N.error(r.error) : wt('pending');
      return;
    }
    if (MLTT.inspectWorkshop) {
      const ans = ensureAnswer();
      const level = getLevel().custom ? { givens: [], goal: MLTT.UNIT } : getLevel();
      const root = ans && !getLevel().custom ? toJson(ans) : { type: 'tt_answer', inputs: { TERM: { type: 'tt_hole', id: 'inspect-empty' } } };
      const r = MLTT.inspectWorkshop(level, root, declarationJson(), selected.id, toJson(selected));
      if (r.selectedType) { el.textContent = r.selectedType; return; }
      if (r.selectedError) { el.textContent = window.I18N.error(r.selectedError); return; }
    }
    el.textContent = wt('selected') + goalText() + '\n' + wt('cannotInfer');
  }

  function refreshWorkshop() {
    window.GAME_SYMBOLS = getWorkspace().getTopBlocks(false).filter(b => b.type === 'tt_declare').map(b => ({ id: b.id, name: b.getFieldValue('NAME') }));
    lastWorkshopResult = checkConstruction();
    const signature = JSON.stringify([getLevel().id, allBlocks, window.I18N.locale, window.GAME_SYMBOLS, localBinderSymbols(),
      getWorkspace().getAllBlocks(false).filter(b => ['tt_problem', 'tt_answer'].includes(b.type))
        .map(b => ((b.ttBinds && b.ttBinds.TERM) || []).map(uid => [uid, b.getFieldValue(b.ttNameFields[uid])]))]);
    if (signature !== toolboxSignature) {
      toolboxSignature = signature;
      getWorkspace().updateToolbox(toolboxXml());
    }
    for (const b of getWorkspace().getBlocksByType('tt_symbol', false)) {
      const field = b.getField('REF');
      if (field) field.forceRerender();
    }
    const ans = ensureAnswer();
    if (ans) refreshRuleCards(getWorkspace(), getLevel(), ans, declarationJson(), toJson);
    renderSelection();
  }

  function renderLanguage() {
    document.querySelectorAll('[data-workshop-text]').forEach(el => { el.textContent = wt(el.dataset.workshopText); });
    const library = $('#librarySelect');
    for (const option of library.options) option.textContent = wt(option.value);
    library.setAttribute('aria-label', wt('libraryLabel'));
    library.value = getLevel()?.custom || allBlocks ? 'all' : 'common';
    library.disabled = !!getLevel()?.custom;

  }

  function bindControls() {
    getWorkspace().registerButtonCallback('OPEN_PROBLEM', () => {
      const answer = ensureAnswer();
      if (!answer) return;
      getWorkspace().centerOnBlock(answer.id);
      requestAnimationFrame(() => { if (answer.workspace) Blockly.common.setSelected(answer); });
    });
    $('#librarySelect').addEventListener('change', event => {
      allBlocks = event.target.value === 'all';
      refreshWorkshop();
    });
  }

  return { toolboxXml, checkConstruction, renderSelection, refreshWorkshop, renderLanguage, bindControls,
    reset() { lastWorkshopResult = null; },
    get lastResult() { return lastWorkshopResult; }
  };
}
