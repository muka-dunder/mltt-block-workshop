/* Game shell: Blockly workspace, levels, checking, progress. */
import { createNotes } from './notes/notes.js';
import { APP_VERSION, versionedStorageKey } from './version.js';
import { installPointerZoom } from './workspace/pointer-zoom.js';
import { installCompactShelf } from './workspace/compact-shelf.js';
import { installControlLayer } from './workspace/control-layer.js';
import { createWorkshop, wt } from './workspace/workshop.js';
import { makeTheme, toJson, createVariableTools } from './workspace/workspace-tools.js';
import { createCustomMode, configureLevelGlobals } from './problems/custom-mode.js';
import { createSharing } from './sharing/share.js';
import { ensurePresetProblem } from './problems/preset-problems.js';
import { createAnswerPreview } from './problems/solutions.js';
import { createSeriesNavigation } from './navigation/series-navigation.js';
import { createCardLibrary } from './cards/card-library.js';
import { createCardEditor } from './cards/card-editor.js';

(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const MLTT = window.MLTT;
  const t = window.I18N.t;
  // Stable IDs retain direct links; navigation presents curated series.
  const exposedLevels = () => window.LEVELS.levels.map(window.I18N.level);
  let LEVELS = exposedLevels();
  let statusRenderer = null;
  let statusTimer = null;

  const STORE = versionedStorageKey('progress');
  const state = {
    index: 0,
    level: null,
    busy: false,
    loading: false,
    mode: 'level',
    checkingRequested: false,
  };

  let workspace = null;
  let answerBlock = null;
  let notes = null;
  let compactShelf = null;
  let custom = null, sharing = null;
  let answerPreview = null;
  let cardEditor = null;
  const cards = createCardLibrary({ inspect: record => cardEditor.inspect(record),
    edit: record => cardEditor.open(record),
    requestDelete: record => deleteCard(record),
    onRemove: ids => {
      answerPreview?.removeCardReferences(ids);
      custom?.removeCardReferences(ids);
      cardEditor?.removeCardReferences(ids);
    },
    onChange: () => { refreshWorkshop(); sharing?.scheduleSync(); } });
  const navigation = createSeriesNavigation({ getLevels: () => LEVELS, getIndex: () => state.index, loadLevel });

  const workshop = createWorkshop({ getWorkspace: () => workspace, getLevel: () => state.level,
    ensureAnswer, goalText, toJson, cards, openCardEditor: kind => cardEditor.open(null, kind) });
  const { toolboxXml, checkConstruction, renderSelection, refreshWorkshop } = workshop;
  const { refreshVars, highlightBinderFor, remapCreatedBindings } = createVariableTools({ getWorkspace: () => workspace,
    getBusy: () => state.busy, setBusy: value => { state.busy = value; } });

  // ---------- Utilities ----------
  function deleteCard(record) {
    const deleted = cards.remove(record.id);
    setStatus(() => window.I18N.locale === 'zh-CN'
      ? '已删除卡片及画布引用。' + (deleted.size > 1 ? '相关版本和依赖它的玩家卡片也已清理。' : '')
      : 'Card and canvas references deleted.' + (deleted.size > 1 ? ' Related revisions and dependent player cards were also removed.' : ''), 'ok');
  }
  function renderLanguage() {
    document.title = 'MLTT ' + t('brand') + ' · v' + APP_VERSION;
    $('.brand span').textContent = t('brand') + ' · v' + APP_VERSION;
    for (const [id, key] of Object.entries({ checkBtn: 'check', viewAnswerBtn: 'viewAnswer', resetBtn: 'reset', winClose: 'stay' })) {
      $('#' + id).textContent = t(key);
    }
    for (const [id, key] of Object.entries({ prevBtn: 'previous', nextBtn2: 'next' })) {
      $('#' + id).title = t(key);
    }
    $('#levelSelect').setAttribute('aria-label', t('selectLevel'));
    $('#languageSelect').setAttribute('aria-label', t('language'));
    $('#languageSelect').value = window.I18N.locale;
    navigation.refresh();
    $('#nextBtn').textContent = navigation.nextIndex() !== null ? t('nextAction') : t('stay');
    workshop.renderLanguage();
    if (notes) notes.setLocale();
    if (custom) custom.renderUI();
    if (sharing) sharing.setLocale();
    answerPreview?.setLocale();
    compactShelf?.setLocale();
  }

  function switchLanguage(locale) {
    if (locale === window.I18N.locale) return;
    const serialized = Blockly.serialization.workspaces.save(workspace);
    if (notes) notes.beforeLevelChange();
    const view = { scale: workspace.scale, x: workspace.scrollX, y: workspace.scrollY };
    const previousStatus = statusRenderer;
    const overlayOpen = $('#overlay').classList.contains('show');
    state.loading = true;
    Blockly.Events.disable();
    try {
      window.I18N.setLocale(locale);
      LEVELS = exposedLevels();
      state.level = custom?.active ? custom.level() : LEVELS[state.index];
      if (!custom?.active) configureLevelGlobals(state.level, givensList(), ctxWithBinder());
      window.BlockFreeze.withChanges(workspace, () => workspace.clear());
      workspace.updateToolbox(toolboxXml());
      Blockly.serialization.workspaces.load(serialized, workspace);
      for (const block of workspace.getAllBlocks(false).reverse()) block.render();
      answerBlock = ensureAnswer();
      workspace.setScale(view.scale);
      workspace.scroll(view.x, view.y);
      renderLanguage();
      renderPanel();
      refreshVars();
      refreshWorkshop();
      if (notes) notes.loadLevel(state.level);
      if (previousStatus) setStatus(previousStatus.html, previousStatus.kind);
      if (overlayOpen && answerBlock?.getInputTargetBlock('TERM')) showWin();
      Blockly.svgResize(workspace);
      if (notes) notes.refresh();
    } finally {
      Blockly.Events.enable();
      state.loading = false;
    }
    sharing?.scheduleSync();
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE);
      const saved = raw && JSON.parse(raw);
      const index = saved?.levelId ? LEVELS.findIndex(level => level.id === saved.levelId) : saved?.index;
      if (Number.isInteger(index) && index >= 0) state.index = index;
    } catch (e) { /* ignore */ }
    if (state.index >= LEVELS.length) state.index = 0;
  }
  function saveProgress() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ index: state.index, levelId: state.level.id }));
    } catch (e) { /* ignore */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function debounce(fn, ms) {
    let t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // ---------- Panel / header ----------
  function renderPanel() {
    const lv = state.level;
    $('#levelStory').textContent = lv.story;
    if (custom) custom.renderUI();
    navigation.setCustom(state.mode === 'custom');
    renderBranchLinks();
  }

  function renderBranchLinks() {
    const zh = window.I18N.locale === 'zh-CN', level = state.level;
    const names = { functions: zh ? '函数工坊' : 'Function workshop', dependent: zh ? '依赖类型' : 'Dependent types' };
    for (const id of ['branchBtn', 'winBranchBtn']) {
      const button = $('#' + id), branch = level.recommendedBranch;
      button.hidden = state.mode === 'custom' || !names[branch];
      button.textContent = (zh ? '深入：' : 'Explore: ') + (names[branch] || '');
    }
    $('#returnJourneyBtn').hidden = state.mode === 'custom' || !['functions', 'dependent'].includes(level.series);
    $('#returnJourneyBtn').textContent = zh ? '返回主线' : 'Return to journey';
  }

  function enterSeries(series) {
    $('#overlay').classList.remove('show');
    $('#seriesSelect').value = series;
    $('#seriesSelect').dispatchEvent(new Event('change'));
  }

  function setStatus(html, kind) {
    const render = html;
    if (typeof html === 'function') html = html();
    const el = $('#status');
    if (!el.hidden && statusRenderer?.kind === kind && el.innerHTML === html) return;
    clearTimeout(statusTimer);
    statusRenderer = { html: render, kind };
    el.className = 'status ' + (kind || '');
    el.hidden = kind === 'idle' || !html;
    el.innerHTML = el.hidden ? '' : html;
    if (!el.hidden) statusTimer = setTimeout(() => {
      el.hidden = true; el.innerHTML = ''; statusRenderer = null;
    }, ['warn', 'err'].includes(kind) ? 8000 : 4000);
  }

  function loadLevel(i) {
    answerPreview?.reset();
    Blockly.Events.disable();
    try {
      if (notes) notes.beforeLevelChange();
      state.loading = true;
      state.checkingRequested = false;
      state.index = (i + LEVELS.length) % LEVELS.length;
      state.level = LEVELS[state.index];

      window.BlockFreeze.withChanges(workspace, () => workspace.clear());
      answerBlock = null;
      window.GAME_SYMBOLS = [];
      workshop.reset();
      configureLevelGlobals(state.level, givensList(), ctxWithBinder());
      workspace.updateToolbox(toolboxXml());
      try { workspace.scroll(0, 0); } catch (e) { /* ignore */ }
      answerBlock = ensureAnswer();
      refreshVars();
      if (notes) notes.loadLevel(state.level);
      refreshWorkshop();
      renderPanel();
      setStatus(() => state.level.inferTerm
        ? t('inferIdle')
        : t('idle'), 'idle');
      navigation.refresh();
      saveProgress();
      state.loading = false;
      Blockly.svgResize(workspace);
      centerOnAnswer();
    } finally { Blockly.Events.enable(); }
    sharing?.scheduleSync({ pristine: !notes?.notes.some(note => !note.tutorial) });
  }

  // ---------- Answer slot ----------
  /** Given context (hides universes such as A : Type), one item per line. */
  function givensList() {
    const lv = state.level;
    let ctx = [];
    try { ctx = MLTT.buildCtx(lv.givens); } catch (e) { ctx = []; }
    const parts = [];
    lv.givens.forEach((g, i) => {
      if (ctx[i] && ctx[i].ty && ctx[i].ty.t === 'U') return;
      let t = '?';
      try { t = MLTT.show(ctx.slice(0, i), g.ty); } catch (e) { t = '?'; }
      parts.push(g.name + ' : ' + t);
    });
    return parts;
  }

  /** Level context plus answer-slot local variables (values match checkLevel). */
  function ctxWithBinder() {
    const lv = state.level;
    let ctx = [];
    try { ctx = MLTT.buildCtx(lv.givens); } catch (e) { ctx = []; }
    for (const b of (lv.answerBinders || [])) {
      try {
        MLTT.sortOf(ctx, b.ty);
        ctx.push({ name: b.name, ty: MLTT.evalTm(MLTT.envOf(ctx), b.ty) });
      } catch (e) { /* ignore */ }
    }
    return ctx;
  }

  function goalText() {
    try { return MLTT.show(ctxWithBinder(), state.level.goal); } catch (e) { return '?'; }
  }

  /** Every preset uses the same checking container as the custom canvas. */
  function ensureAnswer() {
    if (!workspace) return null;
    if (custom?.active) return custom.selectedProblem();
    const list = workspace.getBlocksByType('tt_problem', false);
    if (list.length > 1) {
      for (const duplicate of list.slice(1)) {
        duplicate.setWarningText(t('duplicate'));
        duplicate.setColour('#5b6475');
      }
    }
    let problem = list[0];
    if (!problem) {
      problem = workspace.newBlock('tt_problem');
      problem.initSvg(); problem.render(); problem.moveBy(80, 80);
    }
    return ensurePresetProblem(workspace, state.level, problem);
  }

  function centerOnAnswer() {
    if (!workspace || !answerBlock) return;
    if (state.level.starterBlock) {
      for (const block of answerBlock.getDescendants(false).reverse()) block.render();
    }
    try { workspace.centerOnBlock(answerBlock.id); } catch (e) { /* ignore */ }
    if (notes) {
      notes.focusTutorial();
      const centered = answerBlock;
      requestAnimationFrame(() => {
        if (answerBlock === centered && !state.loading) notes.focusTutorial();
      });
    }
  }

  function answerTerm() {
    const ans = ensureAnswer();
    if (!ans) return { error: t('missing') };
    return { answer: ans, term: ans.getInputTargetBlock('TERM') };
  }

  // ---------- Checking ----------
  function doCheck(showOverlay) {
    state.checkingRequested = true;
    refreshVars();
    if (custom?.active) return custom.check();
    const slot = answerTerm();
    if (slot.error) {
      setStatus(() => esc(t('missing')), 'warn');
      return;
    }
    if (!slot.term) {
      const tops = workspace.getTopBlocks(false).filter((b) => !!b.outputConnection);
      setStatus(() => state.level.inferTerm
        ? t('emptyType')
        : (tops.length
          ? t('emptyCanvas')
          : t('empty')), 'warn');
      return;
    }
    let r;
    try {
      // Start from the answer block itself so its local variables are in scope.
      r = checkConstruction();
    } catch (e) {
      setStatus(() => esc(t('internal', { message: window.I18N.error(e) })), 'err');
      return;
    }
    if (r.ok) {
      if (r.assumptions && r.assumptions.length) {
        setStatus(() => esc(wt('dependent') + r.assumptions.map(a => a.name).join(', ')), 'ok');
        return;
      }
      setStatus(() => esc(t('correct')), 'ok');
      if (showOverlay) showWin();
      return;
    }
    if (r.holes) {
      setStatus(() => esc(t('holes', { count: r.holes.length })), 'warn');
      return;
    }
    const e = r.error || {};
    setStatus(() => '<b>' + esc(e.code || 'E_ERROR') + '</b> ' + esc(window.I18N.error(e) || t('failed')) +
      (e.src ? '<span class="meta">' + esc(t('highlighted')) + '</span>' : ''), 'err');
    if (e.src && workspace) {
      try { workspace.highlightBlock(e.src); } catch (err) { /* ignore */ }
    }
  }

  // ---------- Win ----------
  function showWin() {
    const lv = state.level;
    $('#winText').innerHTML = esc(t('correct')) + '<br><span class="mono">' +
      esc(lv.solutionText) + '</span>';
    $('#overlay').classList.add('show');
    $('#nextBtn').textContent = navigation.nextIndex() !== null ? t('nextAction') : t('stay');
    renderBranchLinks();
  }

  // ---------- Initialization ----------
  function init() {
    if (typeof Blockly === 'undefined') {
      $('#blocklyDiv').textContent = t('fatal');
      return;
    }
    loadProgress();
    state.level = LEVELS[state.index];
    navigation.init();
    renderLanguage();

    workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolboxXml(),
      renderer: 'thrasos',
      plugins: { connectionChecker: 'mltt_freeze_checker' },
      theme: makeTheme(),
      grid: { spacing: 26, length: 3, colour: '#1d2430', snap: false },
      zoom: { controls: true, wheel: true, startScale: 1, minScale: 0.35, maxScale: 1.6 },
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: false },
      sounds: false,
      media: window.BLOCKLY_MEDIA,
    });
    installPointerZoom(workspace);
    installControlLayer(workspace, $('#blocklyDiv'));
    compactShelf = installCompactShelf(workspace, { onChange: () => notes?.refresh() });

    // lexical-variables flydown system (hover a local variable to pop out a getter block).
    if (window.LexicalVariablesPlugin) {
      try { window.LexicalVariablesPlugin.init(workspace); }
      catch (e) { console.warn('LexicalVariablesPlugin.init failed', e); }
    }

    $('#languageSelect').addEventListener('change', (e) => switchLanguage(e.target.value));
    workshop.bindControls();
    $('#addNote').addEventListener('click', () => notes.add());
    $('#checkBtn').addEventListener('click', () => doCheck(true));
    $('#resetBtn').addEventListener('click', () => {
      if (confirm(t('clear'))) custom.active ? custom.reset() : loadLevel(state.index);
    });
    $('#prevBtn').addEventListener('click', () => navigation.move(-1));
    $('#nextBtn2').addEventListener('click', () => navigation.move(1));
    for (const id of ['branchBtn', 'winBranchBtn']) $('#' + id).addEventListener('click', () => enterSeries(state.level.recommendedBranch));
    $('#returnJourneyBtn').addEventListener('click', () => enterSeries('journey'));
    $('#winClose').addEventListener('click', () => $('#overlay').classList.remove('show'));
    $('#nextBtn').addEventListener('click', () => {
      $('#overlay').classList.remove('show');
      navigation.move(1);
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('.notes-layer')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCheck(true); }
    });

    const scheduleRefresh = debounce(() => {
      if (state.loading) return;
      refreshVars();
      refreshWorkshop();
      if (custom?.active) { custom.scheduleSave(); return; }
      // The term in the slot changed; re-render the answer block (large terms can overflow the border).
      if (answerBlock) { try { answerBlock.render(); } catch (e) { /* ignore */ } }
      if (notes) notes.refresh();
      if (!state.checkingRequested) return;
      const slot = answerTerm();
      const term = slot.term;
      if (term) {
        // Keep feedback in sync even after a previously correct answer changes.
        const r = workshop.lastResult;
        if (r.ok && r.assumptions && r.assumptions.length) setStatus(() => esc(wt('dependent') + r.assumptions.map(a => a.name).join(', ')), 'ok');
        else if (r.ok) setStatus(() => t('looksRight'), 'ok');
        else if (r.error) setStatus(() => esc(window.I18N.error(r.error)), 'warn');
        else setStatus(() => esc(t('holes', { count: (r.holes || []).length })), 'warn');
      } else {
        setStatus(() => t(state.level.inferTerm ? 'inferIdle' : 'idle'), 'idle');
      }
    }, 160);

    workspace.addChangeListener((e) => {
      if (e.type === Blockly.Events.SELECTED && !state.loading) { renderSelection(); highlightBinderFor(e.newElementId); }
      if (state.loading || e.isUiEvent) return;
      if (e.type === Blockly.Events.BLOCK_CREATE) remapCreatedBindings(e.ids);
      if (custom?.active) custom.scheduleSave();
      if (e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE ||
        e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_DELETE) {
        sharing?.scheduleSync();
        scheduleRefresh();
        // Clear old error highlights
        try { workspace.highlightBlock(null); } catch (err) {}
      }
      if (e.type === Blockly.Events.SELECTED) {
        highlightBinderFor(e.newElementId);
      }
    });

    window.addEventListener('resize', () => { try { Blockly.svgResize(workspace); } catch (e) {} });
    new ResizeObserver(() => Blockly.svgResize(workspace)).observe($('#blocklyDiv'));

    notes = createNotes({ workspace, host: $('#blocklyDiv'), locale: () => window.I18N.locale,
      getLevel: () => state.level, getAnswer: () => answerBlock,
      getAnswerMode: () => !!answerPreview?.active,
      onChange: () => { if (!state.loading) sharing?.scheduleSync(); } });
    loadLevel(state.index);
    cardEditor = createCardEditor({ Blockly, theme: workspace.getTheme(), toJson,
      validate: record => cards.validate(record), onSave: record => cards.save(record),
      onDelete: deleteCard,
      getInspectionCards: declaration => cards.exportUsed(declaration),
      getInspectionDeclarations: declaration => cards.declarations(declaration),
      getCards: () => cards.list().map(card => ({ ...card, blockType: 'tt_card' })) });
    custom = createCustomMode({ workspace, state, notes: () => notes, levels: () => LEVELS, loadLevel, toJson,
      cards,
      refresh: () => { answerBlock = ensureAnswer(); refreshVars(); refreshWorkshop(); renderLanguage(); renderPanel(); },
      status: (message, kind) => setStatus(() => esc(message), kind),
      onChange: () => { if (!state.loading) sharing?.scheduleSync(); },
      beforeModeChange: () => !answerPreview?.active || answerPreview.restore(),
      getAnswerState: () => answerPreview?.exportState() || null,
      onRenderUI: () => { navigation.setCustom(state.mode === 'custom'); renderBranchLinks(); },
      onAnswerState: value => answerPreview?.importState(value) });
    custom.init();
    sharing = createSharing({ exportSession: () => custom.exportSession(), importSession: payload => custom.importSession(payload),
      button: $('#shareBtn'), locale: () => window.I18N.locale, status: (message, kind) => setStatus(() => esc(message), kind) });
    answerPreview = createAnswerPreview({ getWorkspace: () => workspace, getLevel: () => state.level, cards,
      locale: () => window.I18N.locale, status: (message, kind) => setStatus(() => esc(message), kind),
      exportSession: () => custom.exportSession(), importSession: payload => custom.importSession(payload),
      refresh: () => {
        answerBlock = ensureAnswer(); refreshVars(); refreshWorkshop(); renderLanguage(); renderPanel();
        notes.setLocale();
        if (answerPreview.active) notes.restoreTutorial(); else notes.refresh();
        sharing.scheduleSync();
      } });
    $('#viewAnswerBtn').addEventListener('click', () => answerPreview.show());
    void sharing.restoreFromUrl();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Debug/test entry points
  window.__mltt = {
    get cards() { return cards; },
    get cardEditor() { return cardEditor; },
    refreshVars: () => refreshVars(),
    check: () => doCheck(false),
    get state() { return state; },
    get workspace() { return workspace; },
    switchLanguage,
    refreshWorkshop,
    get notes() { return notes; },
    get custom() { return custom; },
    get answerPreview() { return answerPreview; },
    exportSession: () => custom.exportSession(),
    importSession: payload => custom.importSession(payload),
  };
})();
