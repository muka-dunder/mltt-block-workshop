/* Game shell: Blockly workspace, levels, checking, progress. */
import { createNotes } from './notes/notes.js';
import { installPointerZoom } from './workspace/pointer-zoom.js';
import { createWorkshop, wt } from './workspace/workshop.js';
import { makeTheme, toJson, createVariableTools } from './workspace/workspace-tools.js';
import { createCustomMode, configureLevelGlobals } from './problems/custom-mode.js';
import { createSharing } from './sharing/share.js';
import { ensurePresetProblem } from './problems/preset-problems.js';
import { createAnswerPreview } from './problems/solutions.js';

(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const MLTT = window.MLTT;
  const t = window.I18N.t;
  // Keep the existing sequence, then offer the inference-rule example.
  const exposedLevels = () => window.LEVELS.levels.filter((lv, i) => i < 17 || lv.id === 'R0' || lv.id === 'R1').map(window.I18N.level);
  let LEVELS = exposedLevels();
  let statusRenderer = null;

  const STORE = 'mltt.progress.v1';
  const state = {
    index: 0,
    level: null,
    busy: false,
    loading: false,
    mode: 'level',
  };

  let workspace = null;
  let answerBlock = null;
  let notes = null;
  let custom = null, sharing = null;
  let answerPreview = null;

  const workshop = createWorkshop({ getWorkspace: () => workspace, getLevel: () => state.level,
    ensureAnswer, goalText, toJson });
  const { toolboxXml, checkConstruction, renderSelection, refreshWorkshop } = workshop;
  const { refreshVars, highlightBinderFor, remapCreatedBindings } = createVariableTools({ getWorkspace: () => workspace,
    getBusy: () => state.busy, setBusy: value => { state.busy = value; } });

  // ---------- Utilities ----------
  function renderLanguage() {
    document.title = 'MLTT ' + t('brand');
    $('.brand span').textContent = t('brand');
    for (const [id, key] of Object.entries({ checkBtn: 'check', viewAnswerBtn: 'viewAnswer', resetBtn: 'reset', winClose: 'stay' })) {
      $('#' + id).textContent = t(key);
    }
    for (const [id, key] of Object.entries({ prevBtn: 'previous', nextBtn2: 'next' })) {
      $('#' + id).title = t(key);
    }
    $('#levelSelect').setAttribute('aria-label', t('selectLevel'));
    $('#languageSelect').setAttribute('aria-label', t('language'));
    $('#languageSelect').value = window.I18N.locale;
    $('#nextBtn').textContent = state.index + 1 < LEVELS.length ? t('nextAction') : t('back');
    for (const option of $('#levelSelect').options) {
      const lv = LEVELS[Number(option.value)];
      option.textContent = lv.id + ' ' + lv.title;
    }
    workshop.renderLanguage();
    if (notes) notes.setLocale();
    if (custom) custom.renderUI();
    if (sharing) sharing.setLocale();
    answerPreview?.setLocale();
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
      const index = raw && JSON.parse(raw).index;
      if (Number.isInteger(index) && index >= 0) state.index = index;
    } catch (e) { /* ignore */ }
    if (state.index >= LEVELS.length) state.index = 0;
  }
  function saveProgress() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ index: state.index }));
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
    $('#levelTitle').textContent = lv.id + ' · ' + lv.title;
    $('#levelTag').textContent = lv.tag;
    $('#levelStory').textContent = lv.story;
    if (custom) custom.renderUI();
  }

  function setStatus(html, kind) {
    statusRenderer = { html, kind };
    if (typeof html === 'function') html = html();
    const el = $('#status');
    el.className = 'status ' + (kind || '');
    el.innerHTML = html;
  }

  function loadLevel(i) {
    answerPreview?.reset();
    Blockly.Events.disable();
    try {
      if (notes) notes.beforeLevelChange();
      state.loading = true;
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
      $('#levelSelect').value = String(state.index);
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
    $('#nextBtn').textContent = state.index + 1 < LEVELS.length ? t('nextAction') : t('back');
  }

  // ---------- Initialization ----------
  function init() {
    if (typeof Blockly === 'undefined') {
      $('#blocklyDiv').textContent = t('fatal');
      return;
    }
    renderLanguage();
    loadProgress();
    state.level = LEVELS[state.index];

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

    // lexical-variables flydown system (hover a local variable to pop out a getter block).
    if (window.LexicalVariablesPlugin) {
      try { window.LexicalVariablesPlugin.init(workspace); }
      catch (e) { console.warn('LexicalVariablesPlugin.init failed', e); }
    }

    // Level dropdown
    const sel = $('#levelSelect');
    LEVELS.forEach((lv, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = lv.id + ' ' + lv.title;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => loadLevel(parseInt(sel.value, 10)));
    if (LEVELS.length <= 1) {
      const nav = document.querySelector('.nav');
      if (nav) nav.style.display = 'none';
    }

    $('#languageSelect').addEventListener('change', (e) => switchLanguage(e.target.value));
    workshop.bindControls();
    $('#addNote').addEventListener('click', () => notes.add());
    $('#checkBtn').addEventListener('click', () => doCheck(true));
    $('#resetBtn').addEventListener('click', () => {
      if (confirm(t('clear'))) custom.active ? custom.reset() : loadLevel(state.index);
    });
    $('#prevBtn').addEventListener('click', () => loadLevel(state.index - 1));
    $('#nextBtn2').addEventListener('click', () => loadLevel(state.index + 1));
    $('#winClose').addEventListener('click', () => $('#overlay').classList.remove('show'));
    $('#nextBtn').addEventListener('click', () => {
      $('#overlay').classList.remove('show');
      loadLevel(state.index + 1);
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
    custom = createCustomMode({ workspace, state, notes: () => notes, levels: () => LEVELS, loadLevel, toJson,
      refresh: () => { answerBlock = ensureAnswer(); refreshVars(); refreshWorkshop(); renderLanguage(); renderPanel(); },
      status: (message, kind) => setStatus(() => esc(message), kind),
      onChange: () => { if (!state.loading) sharing?.scheduleSync(); },
      beforeModeChange: () => !answerPreview?.active || answerPreview.restore(),
      getAnswerState: () => answerPreview?.exportState() || null,
      onAnswerState: value => answerPreview?.importState(value) });
    custom.init();
    sharing = createSharing({ exportSession: () => custom.exportSession(), importSession: payload => custom.importSession(payload),
      button: $('#shareBtn'), locale: () => window.I18N.locale, status: (message, kind) => setStatus(() => esc(message), kind) });
    answerPreview = createAnswerPreview({ getWorkspace: () => workspace, getLevel: () => state.level,
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
