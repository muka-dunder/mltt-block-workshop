/* Game shell: Blockly workspace, levels, checking, hints, progress. */
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
  let allBlocks = false;
  let toolboxSignature = '';
  let lastWorkshopResult = null;

  const workshopMessages = {
    'zh-CN': {
      workshopTitle: '构造工作坊', symbolsTitle: '可用符号', symbolHelp: '左侧可以直接拖取；点击这里的符号也能创建引用。局部变量须放回自己的作用域。',
      declarationsTitle: '自己的声明', declarationHelp: '填写名称，把类型和定义体拖进声明积木。声明仅在本关生效；切关或重置会清空。', selectionTitle: '类型反馈',
      addAssumption: '+ 假设', addDefinition: '+ 定义', addAxiom: '+ 公理', search: '输入名字查找符号', common: '积木：本关常用 ▾', all: '积木：全部 ▾',
      known: '已知符号', local: '局部变量', own: '自定义', select: '选择一个积木，查看它的类型。', pending: '尚未完成', valid: '已检查',
      dependent: '类型正确；使用额外假设：', experiment: '。这是实验结果，不计关卡星数。', definition: '定义', assumption: '假设', axiom: '公理',
      selected: '当前目标：', cannotInfer: '这个构造需要目标类型；把它放进答案或类型标注积木后检查。'
    },
    en: {
      workshopTitle: 'Construction workshop', symbolsTitle: 'Available symbols', symbolHelp: 'Drag from the left, or click a symbol here to create a reference. Local variables belong inside their scope.',
      declarationsTitle: 'Your declarations', declarationHelp: 'Name a declaration and attach its type and definition. Declarations belong to this level; switching or resetting clears them.', selectionTitle: 'Type feedback',
      addAssumption: '+ Assumption', addDefinition: '+ Definition', addAxiom: '+ Axiom', search: 'Find a symbol by name', common: 'Blocks: suggested ▾', all: 'Blocks: all ▾',
      known: 'Given symbols', local: 'Local variables', own: 'Custom', select: 'Select a block to inspect its type.', pending: 'Incomplete', valid: 'Checked',
      dependent: 'Type correct; uses extra assumptions: ', experiment: '. Experimental result; no level stars awarded.', definition: 'Definition', assumption: 'Assumption', axiom: 'Axiom',
      selected: 'Current goal: ', cannotInfer: 'This construction needs an expected type. Put it in the answer or a type annotation and check it.'
    }
  };
  const wt = (key) => workshopMessages[window.I18N.locale][key];

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
    document.querySelectorAll('[data-workshop-text]').forEach(el => { el.textContent = wt(el.dataset.workshopText); });
    $('#symbolSearch').placeholder = wt('search');
    $('#libraryToggle').textContent = wt(allBlocks ? 'all' : 'common');
  }

  function switchLanguage(locale) {
    if (locale === window.I18N.locale) return;
    // XML retains block IDs, positions, field values and binder references.
    // Keep this in memory so a storage-disabled browser can switch safely too.
    const xml = Blockly.Xml.workspaceToDom(workspace);
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
      if (previousStatus) setStatus(previousStatus.html, previousStatus.kind);
      if (overlayOpen) showWin(state.stars[state.level.id] || 0, blockCount(answerBlock.getInputTargetBlock('TERM')));
      Blockly.svgResize(workspace);
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

  // ---------- Theme ----------
  function makeTheme() {
    const base = (Blockly.Themes && Blockly.Themes.Classic) || undefined;
    return Blockly.Theme.defineTheme('mlttDark', {
      base,
      componentStyles: {
        workspaceBackgroundColour: '#0f1218',
        toolboxBackgroundColour: '#151a23',
        toolboxForegroundColour: '#dfe6f0',
        flyoutBackgroundColour: '#1a202b',
        flyoutForegroundColour: '#dfe6f0',
        flyoutOpacity: 1,
        scrollbarColour: '#39445a',
        scrollbarOpacity: 0.7,
        insertionMarkerColour: '#8fd0a8',
        insertionMarkerOpacity: 0.4,
        cursorColour: '#8fd0a8',
      },
      fontStyle: { family: 'ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif', size: 14 },
    });
  }

  // ---------- Blocks -> JSON ----------
  function toJson(b) {
    const j = { type: b.type, id: b.id, fields: {}, inputs: {} };
    if (b.ttBinds) { j.binds = b.ttBinds; j.names = {}; }
    for (const inp of b.inputList) {
      for (const f of inp.fieldRow) if (f.name) j.fields[f.name] = f.getValue();
      if (inp.connection) {
        const t = inp.connection.targetBlock();
        if (t) j.inputs[inp.name] = toJson(t);
      }
    }
    if (b.ttBinds && b.ttNameFields) {
      for (const uids of Object.values(b.ttBinds)) {
        for (const uid of uids) {
          const fname = b.ttNameFields[uid];
          j.names[uid] = fname ? (b.getFieldValue(fname) || 'x') : 'x';
        }
      }
    }
    return j;
  }

  // ---------- Local variable validation ----------
  /** Binders avoid outer names by default; rename automatically on conflict. */
  function refreshBinderNames() {
    for (const b of workspace.getAllBlocks(false)) {
      if (!b.ttBinds || !b.ttNameFields) continue;
      const outer = window.LBM.bindersInScope(b);
      if (!outer.length) continue;
      const used = new Set(outer.map((o) => o.name));
      for (const uids of Object.values(b.ttBinds)) {
        for (const uid of uids) {
          const fname = b.ttNameFields[uid];
          if (!fname || !b.getField(fname)) continue;
          const cur = b.getFieldValue(fname);
          if (!used.has(cur)) { used.add(cur); continue; }
          const fresh = window.LBM.nextBinderName(cur, used);
          used.add(fresh);
          b.setFieldValue(fresh, fname);
        }
      }
    }
  }

  function refreshVars() {
    if (!workspace || state.busy) return;
    state.busy = true;
    try {
      refreshBinderNames();
      for (const b of workspace.getBlocksByType('tt_var', false)) {
        const f = b.getField('REF');
        if (!f) continue;
        let ref = window.LBM.decodeRef(f.getValue());
        const list = window.LBM.bindersInScope(b);
        // Empty reference: bind by saved name when possible, otherwise to the nearest binder.
        if (!ref.uid && list.length) {
          const target = (ref.name && list.find((x) => x.name === ref.name)) || list[0];
          f.setValue(window.LBM.encodeRef(target.uid, target.name));
          ref = { uid: target.uid, name: target.name };
        }
        const found = list.find((x) => x.uid === ref.uid) ||
          (ref.name ? list.find((x) => x.name === ref.name) : null);
        if (found) {
          b.setWarningText(null);
          b.setColour('#d7ccc8');
          b.setTooltip(t('variable', { name: found.name, binder: found.block.type || 'binder' }));
        } else if (ref.uid || ref.name) {
          b.setWarningText(t('scope', { name: ref.name || '?' }));
          b.setColour('#8b93a1');
        }
        try { f.forceRerender(); } catch (e) { /* older API */ }
      }
    } finally {
      state.busy = false;
    }
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
    if (!workspace) return [];
    const symbols = [];
    const labels = { tt_lam: 'λ', tt_pi: 'Π', tt_sigma: 'Σ', tt_natrec: 'natrec', tt_sigma_ind: 'Σ-ind', tt_J: 'J', tt_let: 'let' };
    for (const block of workspace.getAllBlocks(false)) {
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
    const pal = new Set(state.level.palette);
    let xml = '<xml>';
    xml += '<label text="' + esc(wt('known')) + '"></label>';
    state.level.givens.forEach((g, i) => { xml += '<block type="tt_given"><field name="IDX">' + i + '</field></block>'; });
    const ans = workspace && workspace.getBlocksByType('tt_answer', false)[0];
    (state.level.answerBinders || []).forEach((b, i) => {
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

  // ---------- Levels ----------
  function declarationJson() {
    return workspace.getTopBlocks(false).filter(b => b.type === 'tt_declare').map(toJson);
  }

  function checkConstruction() {
    const ans = ensureAnswer();
    return MLTT.checkWorkshop(state.level, toJson(ans), declarationJson());
  }

  function createReference(symbol) {
    const b = workspace.newBlock(symbol.blockType);
    b.setFieldValue(symbol.value, symbol.field);
    b.initSvg();
    b.render();
    const metrics = workspace.getMetrics();
    b.moveBy((metrics.viewLeft + 35) / workspace.scale, (metrics.viewTop + 45) / workspace.scale);
    workspace.centerOnBlock(b.id);
    b.select();
  }

  function availableSymbols() {
    const symbols = state.level.givens.map((g, i) => ({ name: g.name, type: ((window.GAME_GIVENS[i] || {}).label || '').slice(g.name.length + 3),
      blockType: 'tt_given', field: 'IDX', value: String(i) }));
    const ans = ensureAnswer();
    (state.level.answerBinders || []).forEach((b, i) => symbols.push({ name: ans.getFieldValue('BNAME' + i),
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
    if (!selected || selected.workspace !== workspace) { el.textContent = wt('select'); return; }
    if (MLTT.inspectWorkshop) {
      const r = MLTT.inspectWorkshop(state.level, toJson(ensureAnswer()), declarationJson(), selected.id, toJson(selected));
      if (r.selectedType) { el.textContent = r.selectedType; return; }
      if (r.selectedError) { el.textContent = window.I18N.error(r.selectedError); return; }
    }
    el.textContent = wt('selected') + goalText() + '\n' + wt('cannotInfer');
  }

  function refreshWorkshop() {
    window.GAME_SYMBOLS = workspace.getTopBlocks(false).filter(b => b.type === 'tt_declare').map(b => ({ id: b.id, name: b.getFieldValue('NAME') }));
    lastWorkshopResult = checkConstruction();
    const signature = JSON.stringify([allBlocks, window.I18N.locale, window.GAME_SYMBOLS, localBinderSymbols(),
      workspace.getBlocksByType('tt_answer', false).map(b => ((b.ttBinds && b.ttBinds.TERM) || []).map(uid => [uid, b.getFieldValue(b.ttNameFields[uid])]))]);
    if (signature !== toolboxSignature) {
      toolboxSignature = signature;
      workspace.updateToolbox(toolboxXml());
    }
    for (const b of workspace.getBlocksByType('tt_symbol', false)) {
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
    const b = workspace.newBlock('tt_declare');
    b.setFieldValue(kind, 'KIND');
    b.setFieldValue(name, 'NAME');
    b.initSvg(); b.render();
    const count = workspace.getBlocksByType('tt_declare', false).length;
    b.moveBy(120, 180 + count * 85);
    workspace.centerOnBlock(b.id); b.select();
    refreshWorkshop();
  }

  function loadLevel(i) {
    state.loading = true;
    state.index = (i + LEVELS.length) % LEVELS.length;
    state.level = LEVELS[state.index];
    state.hintUsed = 0;
    state.hintsShown = 0;

    workspace.clear();
    answerBlock = null;
    window.GAME_SYMBOLS = [];
    lastWorkshopResult = null;
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
    refreshWorkshop();
    renderPanel();
    setStatus(() => state.level.inferTerm
      ? t('inferIdle')
      : t('idle'), 'idle');
    $('#levelSelect').value = String(state.index);
    saveProgress();
    state.loading = false;
    setTimeout(() => {
      try { Blockly.svgResize(workspace); } catch (e) {}
      centerOnAnswer();
    }, 50);
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
    $('#libraryToggle').addEventListener('click', () => {
      allBlocks = !allBlocks;
      $('#libraryToggle').textContent = wt(allBlocks ? 'all' : 'common');
      refreshWorkshop();
    });
    $('#symbolSearch').addEventListener('input', renderSymbols);
    $('#addAssumption').addEventListener('click', () => addDeclaration('assumption'));
    $('#addDefinition').addEventListener('click', () => addDeclaration('definition'));
    $('#addAxiom').addEventListener('click', () => addDeclaration('axiom'));

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCheck(true); }
    });

    const scheduleRefresh = debounce(() => {
      if (state.loading) return;
      refreshVars();
      refreshWorkshop();
      // The term in the slot changed; re-render the answer block (large terms can overflow the border).
      if (answerBlock) { try { answerBlock.render(); } catch (e) { /* ignore */ } }
      const slot = answerTerm();
      const term = slot.term;
      if (term) {
        // Keep feedback in sync even after a previously correct answer changes.
        const r = lastWorkshopResult;
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

    loadLevel(state.index);
  }

  function highlightBinderFor(id) {
    if (!id || !workspace) return;
    const b = workspace.getBlockById(id);
    if (!b || b.type !== 'tt_var') return;
    const ref = window.LBM.decodeRef(b.getFieldValue('REF'));
    const found = window.LBM.findBinder(b, ref.uid);
    if (found && found.block) {
      try { workspace.highlightBlock(found.block.id); } catch (e) {}
      setTimeout(() => { try { workspace.highlightBlock(null); } catch (e) {} }, 1200);
    }
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
  };
})();
