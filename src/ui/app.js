/* Game shell: Blockly workspace, levels, checking, hints, progress. */
import { createNotes } from './notes.js';
import { createWorkshop, wt } from './workshop.js';
import { makeTheme, toJson, createVariableTools } from './workspace-tools.js';

(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const MLTT = window.MLTT;
  const t = window.I18N.t;
  // Levels currently exposed: L0-L16 (local variables, lambda, application, inference, Pi, unit, empty, product, Sigma, Id, universe); the rest stay in levels.js.
  let LEVELS = window.LEVELS.levels.slice(0, 17).map(window.I18N.level);
  let statusRenderer = null;

  const STORE = 'mltt.progress.v1';
  const state = {
    index: 0,
    stars: {},
    hintUsed: 0,
    hintsShown: 0,
    level: null,
    busy: false,
    loading: false,
  };

  let workspace = null;
  let answerBlock = null;
  let notes = null;

  const workshop = createWorkshop({ getWorkspace: () => workspace, getLevel: () => state.level,
    ensureAnswer, binderTypesText, goalText, toJson });
  const { toolboxXml, checkConstruction, renderSymbols, renderSelection, refreshWorkshop, addDeclaration } = workshop;
  const { refreshVars, highlightBinderFor } = createVariableTools({ getWorkspace: () => workspace,
    getBusy: () => state.busy, setBusy: value => { state.busy = value; } });

  // ---------- Utilities ----------
  function renderLanguage() {
    document.title = 'MLTT ' + t('brand');
    $('.brand span').textContent = t('brand');
    for (const [id, key] of Object.entries({ checkBtn: 'check', hintBtn: 'hint', resetBtn: 'reset', winClose: 'stay' })) {
      $('#' + id).textContent = t(key);
    }
    for (const [id, key] of Object.entries({ prevBtn: 'previous', nextBtn2: 'next', stars: 'stars' })) {
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
  }

  function switchLanguage(locale) {
    if (locale === window.I18N.locale) return;
    // XML retains block IDs, positions, field values and binder references.
    // Keep this in memory so a storage-disabled browser can switch safely too.
    const xml = Blockly.Xml.workspaceToDom(workspace);
    if (notes) notes.beforeLevelChange();
    const view = { scale: workspace.scale, x: workspace.scrollX, y: workspace.scrollY };
    const previousStatus = statusRenderer;
    const overlayOpen = $('#overlay').classList.contains('show');
    state.loading = true;
    Blockly.Events.disable();
    try {
      window.I18N.setLocale(locale);
      LEVELS = window.LEVELS.levels.slice(0, 17).map(window.I18N.level);
      state.level = LEVELS[state.index];
      workspace.clear();
      workspace.updateToolbox(toolboxXml());
      Blockly.Xml.domToWorkspace(xml, workspace);
      answerBlock = ensureAnswer();
      workspace.setScale(view.scale);
      workspace.scroll(view.x, view.y);
      renderLanguage();
      renderPanel();
      refreshVars();
      refreshWorkshop();
      if (notes) notes.loadLevel(state.level);
      if (previousStatus) setStatus(previousStatus.html, previousStatus.kind);
      if (overlayOpen) showWin(state.stars[state.level.id] || 0, blockCount(answerBlock.getInputTargetBlock('TERM')));
      Blockly.svgResize(workspace);
      if (notes) notes.refresh();
    } finally {
      Blockly.Events.enable();
      state.loading = false;
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (state.index >= LEVELS.length) state.index = 0;
  }
  function saveProgress() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ index: state.index, stars: state.stars }));
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
    renderStars();
    renderHints();
  }

  function renderStars() {
    const n = state.stars[state.level.id] || 0;
    $('#stars').textContent = '★'.repeat(n) + '☆'.repeat(3 - n);
  }

  function renderHints() {
    const lv = state.level;
    const box = $('#hintBox');
    box.innerHTML = '';
    for (let i = 0; i < state.hintsShown; i++) {
      const li = document.createElement('li');
      li.textContent = lv.hints[i];
      box.appendChild(li);
    }
    box.classList.toggle('show', state.hintsShown > 0);
    $('#hintBtn').disabled = state.hintsShown >= lv.hints.length;
  }

  function setStatus(html, kind) {
    statusRenderer = { html, kind };
    if (typeof html === 'function') html = html();
    const el = $('#status');
    el.className = 'status ' + (kind || '');
    el.innerHTML = html;
  }

  function loadLevel(i) {
    if (notes) notes.beforeLevelChange();
    state.loading = true;
    state.index = (i + LEVELS.length) % LEVELS.length;
    state.level = LEVELS[state.index];
    state.hintUsed = 0;
    state.hintsShown = 0;

    workspace.clear();
    answerBlock = null;
    window.GAME_SYMBOLS = [];
    workshop.reset();
    // Read by tt_given init (toolbox blocks are instantiated in updateToolbox).
    let ctx0 = [];
    try { ctx0 = MLTT.buildCtx(state.level.givens); } catch (e) { ctx0 = []; }
    window.GAME_GIVENS = state.level.givens.map((g, i) => {
      let t = '?';
      try { t = MLTT.show(ctx0.slice(0, i), g.ty); } catch (e) { t = '?'; }
      return { label: g.name + ' : ' + t, name: g.name };
    });
    // Local variables supplied by the answer block (L3 has f and x; levels without them are empty).
    const binders = state.level.answerBinders || [];
    let ctxB = [];
    try { ctxB = MLTT.buildCtx(state.level.givens); } catch (e) { ctxB = []; }
    window.GAME_ANSWER_BINDERS = binders.map((b) => {
      let tyText = '?';
      try { tyText = MLTT.show(ctxB, b.ty); } catch (e) { /* ignore */ }
      try {
        MLTT.sortOf(ctxB, b.ty);
        ctxB.push({ name: b.name, ty: MLTT.evalTm(MLTT.envOf(ctxB), b.ty) });
      } catch (e) { /* ignore */ }
      return { name: b.name, tyText };
    });
    window.GAME_HAS_BINDER = binders.length > 0;
    window.GAME_ANSWER_CTX = givensList();
    window.GAME_INFER = !!state.level.inferTerm;
    window.GAME_INFER_TERM = '';
    if (window.GAME_INFER) {
      try { window.GAME_INFER_TERM = MLTT.show(ctxWithBinder(), state.level.inferTerm); }
      catch (e) { window.GAME_INFER_TERM = '?'; }
    }
    workspace.updateToolbox(toolboxXml());
    try { workspace.scroll(0, 0); } catch (e) { /* ignore */ }
    answerBlock = ensureAnswer();
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
  }

  // ---------- Answer slot ----------
  /** Type text for each answer-slot local variable, in declaration order (later ones may depend on earlier ones). */
  function binderTypesText() {
    const lv = state.level;
    const binders = lv.answerBinders || [];
    let ctx = [];
    try { ctx = MLTT.buildCtx(lv.givens); } catch (e) { ctx = []; }
    return binders.map((b) => {
      let t = '?';
      try { t = MLTT.show(ctx, b.ty); } catch (e) { /* ignore */ }
      try {
        MLTT.sortOf(ctx, b.ty);
        ctx.push({ name: b.name, ty: MLTT.evalTm(MLTT.envOf(ctx), b.ty) });
      } catch (e) { /* ignore */ }
      return t;
    });
  }

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

  /** Write "knowns, f : ..., x : ... |- answer-slot : goal" onto the answer block. */
  function setAnswerLabels(block, setName) {
    if (!block) return;
    try {
      const lv = state.level;
      const binders = lv.answerBinders || [];
      givensList().forEach((text, i) => {
        const cf = 'CTX' + i;
        if (block.getField(cf) && block.getFieldValue(cf) !== text) {
          block.setFieldValue(text, cf);
        }
      });
      const types = binderTypesText();
      binders.forEach((b, i) => {
        const nf = 'BNAME' + i;
        const tf = 'BTYPE' + i;
        if (!block.getField(nf)) return;
        if (setName && block.getFieldValue(nf) !== b.name) block.setFieldValue(b.name, nf);
        if (block.getFieldValue(tf) !== types[i]) block.setFieldValue(types[i], tf);
      });
      const goal = goalText();
      const goalField = block.getField('GOAL');
      if (goalField && block.getFieldValue('GOAL') !== goal) block.setFieldValue(goal, 'GOAL');
      const inferField = block.getField('INFERTERM');
      if (inferField) {
        const text = window.GAME_INFER_TERM || '';
        if (block.getFieldValue('INFERTERM') !== text) block.setFieldValue(text, 'INFERTERM');
      }
    } catch (e) { /* older API */ }
  }

  /** The canvas always has one preferred "answer" block; recreate it if deleted. */
  function ensureAnswer() {
    if (!workspace) return null;
    const list = workspace.getBlocksByType('tt_answer', false);
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        list[i].setWarningText(t('duplicate'));
        list[i].setColour('#5b6475');
      }
    }
    if (list.length) {
      setAnswerLabels(list[0], false);
      return list[0];
    }
    const b = workspace.newBlock('tt_answer');
    try { b.initSvg(); } catch (e) { /* Blockly 11 initializes automatically */ }
    b.render();
    b.moveBy(80, 80);
    setAnswerLabels(b, true);
    return b;
  }

  function centerOnAnswer() {
    if (!workspace || !answerBlock) return;
    try { workspace.centerOnBlock(answerBlock.id); } catch (e) { /* ignore */ }
    if (notes) notes.focusTutorial();
  }

  function answerTerm() {
    const ans = ensureAnswer();
    if (!ans) return { error: t('missing') };
    return { answer: ans, term: ans.getInputTargetBlock('TERM') };
  }

  function blockCount(b) {
    let n = 1;
    for (const inp of b.inputList) {
      if (inp.connection) {
        const t = inp.connection.targetBlock();
        if (t) n += blockCount(t);
      }
    }
    return n;
  }

  // ---------- Checking ----------
  function doCheck(showOverlay) {
    refreshVars();
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
    const term = slot.term;
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
        setStatus(() => esc(wt('dependent') + r.assumptions.map(a => a.name).join(', ') + wt('experiment')), 'ok');
        return;
      }
      const n = blockCount(term);
      const lv = state.level;
      let stars = 1;
      if (n <= lv.par && state.hintUsed === 0) stars = 3;
      else if (n <= lv.par + 2 && state.hintUsed <= 1) stars = 2;
      state.stars[lv.id] = Math.max(state.stars[lv.id] || 0, stars);
      saveProgress();
      renderStars();
      setStatus(() => esc(t('correct')) + '<span class="meta">' + esc(t('counts', { count: n, par: lv.par })) +
        esc(state.hintUsed ? t('hintsUsed', { count: state.hintUsed }) : t('noHints')) + '</span>', 'ok');
      if (showOverlay) showWin(stars, n);
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
  function showWin(stars, n) {
    const lv = state.level;
    $('#winStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('#winText').innerHTML = esc(t('passed', { title: lv.title, count: n })) + '<br><span class="mono">' +
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
      theme: makeTheme(),
      grid: { spacing: 26, length: 3, colour: '#1d2430', snap: false },
      zoom: { controls: true, wheel: true, startScale: 1, minScale: 0.35, maxScale: 1.6 },
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
      media: window.BLOCKLY_MEDIA,
    });

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
    $('#restoreTutorial').addEventListener('click', () => notes.restoreTutorial());
    $('#clearNotes').addEventListener('click', () => {
      if (confirm(wt('clearNotesConfirm'))) notes.clearUserNotes();
    });

    $('#checkBtn').addEventListener('click', () => doCheck(true));
    $('#hintBtn').addEventListener('click', () => {
      const lv = state.level;
      if (state.hintsShown < lv.hints.length) {
        state.hintsShown++;
        state.hintUsed++;
        renderHints();
      }
    });
    $('#resetBtn').addEventListener('click', () => {
      if (confirm(t('clear'))) loadLevel(state.index);
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
      // The term in the slot changed; re-render the answer block (large terms can overflow the border).
      if (answerBlock) { try { answerBlock.render(); } catch (e) { /* ignore */ } }
      if (notes) notes.refresh();
      const slot = answerTerm();
      const term = slot.term;
      if (term) {
        // Keep feedback in sync even after a previously correct answer changes.
        const r = workshop.lastResult;
        if (r.ok && r.assumptions && r.assumptions.length) setStatus(() => esc(wt('dependent') + r.assumptions.map(a => a.name).join(', ') + wt('experiment')), 'ok');
        else if (r.ok) setStatus(() => t('looksRight'), 'ok');
        else if (r.error) setStatus(() => esc(window.I18N.error(r.error)), 'warn');
        else setStatus(() => esc(t('holes', { count: (r.holes || []).length })), 'warn');
      } else {
        setStatus(() => t(state.level.inferTerm ? 'inferIdle' : 'idle'), 'idle');
      }
    }, 160);

    workspace.addChangeListener((e) => {
      if (e.type === Blockly.Events.SELECTED && !state.loading) { renderSymbols(); renderSelection(); highlightBinderFor(e.newElementId); }
      if (state.loading || e.isUiEvent) return;
      if (e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE ||
        e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_DELETE) {
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
      getLevel: () => state.level, getAnswer: () => answerBlock });
    loadLevel(state.index);
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
    addDeclaration,
    get notes() { return notes; },
  };
})();
