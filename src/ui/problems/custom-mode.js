import './custom-mode.css';

const STORAGE = 'mltt.custom.workspace.v1';
const MODE = 'mltt.workspace.mode.v1';
const LEVEL_STORAGE = 'mltt.level.workspace.v1';

export function configureLevelGlobals(level, contextLines, inferContext) {
  const M = window.MLTT;
  let ctx = [];
  try { ctx = M.buildCtx(level.givens); } catch (_) { /* Display incomplete context as unknown. */ }
  window.GAME_GIVENS = level.givens.map((g, i) => {
    let type = '?';
    try { type = M.show(ctx.slice(0, i), g.ty); } catch (_) { /* Incomplete display. */ }
    return { label: g.name + ' : ' + type, name: g.name };
  });
  window.GAME_ANSWER_BINDERS = (level.answerBinders || []).map(b => {
    let tyText = '?';
    try { tyText = M.show(ctx, b.ty); } catch (_) { /* Incomplete display. */ }
    try { M.sortOf(ctx, b.ty); ctx.push({ name: b.name, ty: M.evalTm(M.envOf(ctx), b.ty) }); } catch (_) { /* Incomplete context. */ }
    return { name: b.name, tyText };
  });
  Object.assign(window, { GAME_HAS_BINDER: window.GAME_ANSWER_BINDERS.length > 0,
    GAME_ROOT_RULE: false, GAME_ANSWER_CTX: contextLines,
    GAME_PROBLEM_PRESET: { id: level.id, title: level.id + ' · ' + level.title },
    GAME_INFER: !!level.inferTerm, GAME_INFER_TERM: '' });
  if (level.inferTerm) {
    try { window.GAME_INFER_TERM = M.show(inferContext, level.inferTerm); } catch (_) { window.GAME_INFER_TERM = '?'; }
  }
}

export function createCustomMode({ workspace, state, notes, levels, loadLevel, refresh, status, toJson, onChange,
  beforeModeChange, getAnswerState, onAnswerState }) {
  const zh = () => window.I18N.locale === 'zh-CN';
  const words = (cn, en) => zh() ? cn : en;
  let active = false, levelSession = null, timer = null;
  const customLevel = () => ({ id: 'custom', custom: true, givens: [], answerBinders: [], palette: [],
    title: words('自定义模式', 'Custom mode'), tag: words('自由构造', 'Free construction'),
    story: words('从空白画布开始。从左侧拖出题目卡；把要检查的卡片放进题目的提交入口。多道题时，先选中要检查的题目。',
      'Start with a blank canvas. Drag problem cards from the left. Place the card to check in the problem’s submission slot. Select a problem when there are several.') });

  function selectedProblem() {
    let block = Blockly.getSelected();
    if (block?.workspace !== workspace || workspace.getBlockById(block.id) !== block) block = null;
    for (; block; block = block.getParent()) if (block.type === 'tt_problem') return block;
    const problems = workspace.getBlocksByType('tt_problem', false);
    return problems.length === 1 ? problems[0] : null;
  }

  function exportSession() {
    return { version: 1, mode: active ? 'custom' : 'level', levelId: active ? 'custom' : state.level.id,
      workspace: Blockly.serialization.workspaces.save(workspace), notes: notes().exportState(),
      view: { scale: workspace.scale, x: workspace.scrollX, y: workspace.scrollY },
      ...(getAnswerState?.() ? { answerState: getAnswerState() } : {}) };
  }

  function save() {
    if (!active || state.loading) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(exportSession())); } catch (_) { /* Keep the current canvas usable without storage. */ }
  }
  function scheduleSave() {
    if (!active || state.loading) return;
    onChange?.();
    clearTimeout(timer); timer = setTimeout(save, 180);
  }
  function setModePreference() {
    try { localStorage.setItem(MODE, active ? 'custom' : 'level'); } catch (_) { /* Storage may be disabled. */ }
  }

  function renderUI() {
    const select = document.querySelector('#modeSelect');
    select.value = active ? 'custom' : 'level';
    select.options[0].textContent = words('关卡模式', 'Levels');
    select.options[1].textContent = words('自定义模式', 'Custom');
    select.setAttribute('aria-label', words('画布模式', 'Canvas mode'));
    document.body.classList.toggle('custom-mode', active);
    const levelSelect = document.querySelector('#levelSelect');
    levelSelect.disabled = active;
    levels().forEach((level, i) => {
      levelSelect.options[i].textContent = active && i === levelSelect.selectedIndex
        ? words('自由画布', 'Free canvas') : level.id + ' ' + level.title;
    });
    document.querySelector('#prevBtn').disabled = active;
    document.querySelector('#nextBtn2').disabled = active;
    document.querySelector('#viewAnswerBtn').disabled = active;
    if (active) {
      document.querySelector('#levelTitle').textContent = words('自由画布', 'Free canvas');
      document.querySelector('#levelTag').textContent = words('自由构造', 'Free construction');
      document.querySelector('#levelStory').textContent = customLevel().story;
    }
    document.querySelector('#levelTitle').title = document.querySelector('#levelTitle').textContent;
    levelSelect.title = levelSelect.selectedOptions[0]?.textContent || '';
  }

  function prepareCustom() {
    notes().beforeLevelChange();
    active = true; state.mode = 'custom'; state.level = customLevel(); state.loading = true;
    Object.assign(window, { GAME_GIVENS: [], GAME_ANSWER_BINDERS: [], GAME_HAS_BINDER: false,
      GAME_ROOT_RULE: false, GAME_PROBLEM_PRESET: null, GAME_ANSWER_CTX: [], GAME_INFER: false, GAME_INFER_TERM: '', GAME_SYMBOLS: [] });
    Blockly.Events.disable();
    try { window.BlockFreeze.withChanges(workspace, () => workspace.clear()); } finally { Blockly.Events.enable(); }
    notes().loadLevel(state.level);
    document.querySelector('#overlay').classList.remove('show');
  }
  function restoreCanvas(payload, restoreNotes) {
    state.loading = true;
    try {
      Blockly.Events.disable();
      window.BlockFreeze.withChanges(workspace, () => workspace.clear());
      Blockly.serialization.workspaces.load(payload.workspace, workspace);
      if (restoreNotes && Array.isArray(payload.notes)) notes().importState(payload.notes);
    } finally { Blockly.Events.enable(); state.loading = false; }
    refresh(); renderUI(); Blockly.svgResize(workspace);
    if (payload.view) {
      workspace.setScale(payload.view.scale);
      workspace.scroll(payload.view.x, payload.view.y);
    }
    notes().refresh();
  }

  function setMode(mode) {
    if ((mode === 'custom') === active) return;
    if (beforeModeChange?.() === false) return;
    clearTimeout(timer);
    if (mode === 'custom') {
      levelSession = exportSession();
      try { localStorage.setItem(LEVEL_STORAGE, JSON.stringify(levelSession)); } catch (_) { /* Retain the in-memory copy. */ }
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(STORAGE) || 'null'); if (saved) validate(saved); } catch (_) { saved = null; }
      prepareCustom();
      restoreCanvas(saved || { workspace: {} }, false);
      status(words('空白画布已准备好。从左侧拖出题目卡，然后放入要检查的内容。', 'The canvas is ready. Drag a problem card from the left, then put the content to check inside.'), 'idle');
    } else {
      save(); active = false; state.mode = 'level';
      const previous = levelSession;
      const index = previous ? levels().findIndex(lv => lv.id === previous.levelId) : state.index;
      loadLevel(index < 0 ? 0 : index);
      onAnswerState?.(previous?.answerState || null);
      if (previous) restoreCanvas(previous, false);
      renderUI();
    }
    setModePreference();
    onChange?.();
  }

  function validate(payload) {
    if (!payload || payload.version !== 1 || !['custom', 'level'].includes(payload.mode)) throw new Error(words('无法识别的画布版本或模式。', 'Unsupported canvas version or mode.'));
    if (payload.mode === 'level' && !levels().some(lv => lv.id === payload.levelId)) throw new Error(words('找不到这个关卡。', 'Unknown level.'));
    if (payload.answerState !== undefined) {
      const original = payload.answerState?.originalWork;
      if (payload.mode !== 'level' || !original || original.mode !== 'level' || original.levelId !== payload.levelId ||
          original.answerState !== undefined || !original.workspace) {
        throw new Error(words('原作答数据无效。', 'Invalid saved work.'));
      }
      validate(original);
    }
    if (payload.mode === 'level' && !payload.workspace) return;
    if (!payload.workspace || typeof payload.workspace !== 'object' || Array.isArray(payload.workspace)) throw new Error(words('画布数据损坏。', 'Invalid workspace data.'));
    if (JSON.stringify(payload).length > 2000000) throw new Error(words('画布数据太大。', 'Workspace data is too large.'));
    if (payload.view && (![payload.view.scale, payload.view.x, payload.view.y].every(Number.isFinite) || payload.view.scale < 0.35 || payload.view.scale > 1.6)) throw new Error(words('画布缩放或位置无效。', 'Invalid workspace viewport.'));
    const ids = new Set(); let count = 0;
    function block(value, depth) {
      if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 100 || ++count > 2000 || !Object.hasOwn(Blockly.Blocks, value.type)) throw new Error(words('积木数据无效，或包含不支持的积木。', 'Invalid or unsupported block data.'));
      if (value.id !== undefined && (typeof value.id !== 'string' || ids.has(value.id))) throw new Error(words('积木标识重复或无效。', 'Duplicate or invalid block ID.'));
      if (value.id) ids.add(value.id);
      if ((value.x !== undefined && !Number.isFinite(value.x)) || (value.y !== undefined && !Number.isFinite(value.y))) throw new Error(words('积木位置无效。', 'Invalid block position.'));
      if (value.fields?.KIND && !['definition', 'assumption', 'axiom'].includes(value.fields.KIND)) throw new Error(words('声明种类无效。', 'Invalid declaration kind.'));
      if (value.extraState?.layout && !['auto', 'inline', 'stacked'].includes(value.extraState.layout)) throw new Error(words('判断卡布局无效。', 'Invalid judgment layout.'));
      const inputs = value.inputs || {};
      if (typeof inputs !== 'object' || Array.isArray(inputs)) throw new Error(words('积木连接无效。', 'Invalid block connection.'));
      for (const connection of [...Object.values(inputs), ...(value.next ? [value.next] : [])]) {
        if (!connection || typeof connection !== 'object' || Array.isArray(connection) || (!connection.block && !connection.shadow)) throw new Error(words('积木连接无效。', 'Invalid block connection.'));
        if (connection.block) block(connection.block, depth + 1);
        if (connection.shadow) block(connection.shadow, depth + 1);
      }
    }
    if (payload.workspace.blocks !== undefined && (!payload.workspace.blocks || typeof payload.workspace.blocks !== 'object' || !Array.isArray(payload.workspace.blocks.blocks))) throw new Error(words('画布数据损坏。', 'Invalid workspace data.'));
    const roots = payload.workspace.blocks?.blocks || [];
    if (!Array.isArray(roots)) throw new Error(words('画布数据损坏。', 'Invalid workspace data.'));
    roots.forEach(root => block(root, 0));
  }

  function applySession(payload, restoreNotes = true) {
    if (active) save();
    if (payload.mode === 'custom') {
      if (!active) levelSession = exportSession();
      prepareCustom();
    }
    else {
      notes().beforeLevelChange(); active = false; state.mode = 'level';
      loadLevel(levels().findIndex(lv => lv.id === payload.levelId));
    }
    onAnswerState?.(payload.answerState || null);
    if (payload.workspace) restoreCanvas(payload, restoreNotes);
    else { refresh(); renderUI(); }
    setModePreference(); save();
  }
  function importSession(payload) {
    validate(payload);
    const backup = exportSession();
    try { applySession(payload); }
    catch (error) { applySession(backup); throw error; }
  }
  function check() {
    const problem = selectedProblem();
    if (!problem) {
      status(words(workspace.getBlocksByType('tt_problem', false).length ? '请先选中要检查的题目卡。' : '先从左侧拖出题目卡，再把要检查的内容放进去。',
        workspace.getBlocksByType('tt_problem', false).length ? 'Select the problem you want to check.' : 'Drag a problem card from the left and place the content to check inside it.'), 'warn');
      return;
    }
    const declarations = workspace.getTopBlocks(false).filter(b => b.type === 'tt_declare').map(toJson);
    const result = window.MLTT.checkCustomProblem(toJson(problem), declarations);
    if (result.ok) {
      const dependencies = (result.assumptions || []).map(a => a.name);
      status(words('✓ 类型正确。', '✓ Correct type.') + (dependencies.length ? words(' 使用的假设：', ' Assumptions: ') + dependencies.join(', ') : ''), 'ok');
    } else if (result.error) status(window.I18N.error(result.error), 'warn');
    else status(words('还有空槽需要填写。', 'There are holes left to fill.'), 'warn');
    return result;
  }
  function reset() {
    prepareCustom(); restoreCanvas({ workspace: {} }, false); save();
  }
  function init() {
    document.querySelector('#modeSelect').addEventListener('change', e => setMode(e.target.value));
    renderUI();
    try {
      if (localStorage.getItem(MODE) === 'custom') {
        const previous = JSON.parse(localStorage.getItem(LEVEL_STORAGE) || 'null');
        if (previous) validate(previous);
        setMode('custom');
        if (previous) { levelSession = previous; localStorage.setItem(LEVEL_STORAGE, JSON.stringify(previous)); }
      }
    } catch (_) { /* Storage may be disabled or contain an older session. */ }
  }
  return { init, setMode, renderUI, check, reset, selectedProblem, exportSession, importSession, scheduleSave,
    level: customLevel, get active() { return active; } };
}
