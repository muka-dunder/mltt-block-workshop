/* A separate Blockly workbench for reusable, checked mathematical cards. */
import { createVariableTools } from '../workspace/workspace-tools.js';
import './card-editor.css';
import { cardWorkspace } from './card-library.js';
import { installCompactShelf } from '../workspace/compact-shelf.js';
import { cardPaletteXml } from './card-palette.js';
import { cardColour } from './card-colours.js';
import { inspectCardSelection } from './card-inspection.js';
import { cleanCardSession, removeCardBlocks } from './card-references.js';
import { installCardWindowDrag } from './card-window-drag.js';
import { cardPermissions } from './card-actions.js';

/** All sources and modes use the same workbench; each opening owns its workspace. */
export function createCardEditor(options) {
  const windows = [];
  const removed = new Set();
  let active = null;
  function focus(instance) {
    if (!instance || !windows.includes(instance)) return;
    if (active !== instance) { options.Blockly.WidgetDiv.hide(); options.Blockly.DropDownDiv.hideWithoutAnimation(); }
    active = instance;
    const index = windows.indexOf(instance); windows.splice(index, 1); windows.push(instance);
    windows.forEach((item, order) => {
      item.element.style.zIndex = String(100 + order);
      item.element.classList.toggle('is-active', item === active);
      item.element.dataset.active = String(item === active);
    });
  }
  function open(card, inspecting, kind) {
    const offset = windows.length % 6 * 26;
    const instance = createCardWindow({ ...options,
      onSave: async record => {
        const saved = await options.onSave(record);
        windows.forEach(item => item.refreshLibrary());
        return saved;
      },
      position: { x: Math.max(8, (innerWidth - Math.min(1100, innerWidth * .94)) / 2) + offset,
        y: Math.max(8, (innerHeight - Math.min(780, innerHeight * .9)) / 2) + offset },
      onFocus: focus,
      onClose: item => {
        const index = windows.indexOf(item); if (index >= 0) windows.splice(index, 1);
        if (active === item) active = windows.at(-1) || null;
        focus(active); active?.refreshSelection();
      },
    });
    windows.push(instance); focus(instance);
    instance.removeCardReferences(removed);
    try { if (inspecting) instance.inspect(card); else instance.open(card, kind); }
    catch (error) { instance.dispose(); throw error; }
    return instance;
  }
  return {
    open: (card = null, kind = 'axiom') => open(card, false, kind),
    inspect: card => open(card, true),
    get workspace() { return active?.workspace || null; },
    get activeWindow() { return active; },
    get windows() { return windows.slice(); },
    refreshSelection: () => active?.refreshSelection(),
    removeCardReferences(ids) {
      for (const id of ids) removed.add(id);
      for (const instance of windows.slice()) instance.removeCardReferences(ids);
    },
    dispose() { for (const instance of windows.slice()) instance.dispose(); },
  };
}

export function createCardWindow({ Blockly, theme, toJson, validate, onSave, onDelete, getCards, getInspectionCards, getInspectionDeclarations, onFocus, onClose, openEditor, position }) {
  const zh = () => window.I18N.locale === 'zh-CN';
  const text = (cn, en) => zh() ? cn : en;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dialog = document.createElement('dialog');
  dialog.className = 'card-editor';
  const titleId = 'card-editor-title-' + crypto.randomUUID();
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.innerHTML = `<header class="card-editor-heading"><div><h2 class="card-editor-title"></h2><p class="card-editor-intro"></p></div><div class="card-editor-navigation"><button type="button" class="card-editor-close" aria-label="Close">×</button></div></header>
    <p class="card-editor-readonly" hidden></p>
    <div class="card-editor-form"><label><span data-label="name"></span><input class="card-editor-name" maxlength="80" autocomplete="off"></label><label class="card-editor-description-label"><span data-label="description"></span><input class="card-editor-description" maxlength="240"></label><label><span data-label="kind"></span><select class="card-editor-kind"><option value="axiom"></option><option value="theorem"></option></select></label></div>
    <div class="card-editor-main"><button type="button" class="card-editor-blocks" hidden></button><div class="card-editor-workspace"></div><aside class="card-editor-explanation-panel"><label><span data-label="explanation"></span><textarea class="card-editor-explanation" maxlength="20000" spellcheck="false"></textarea></label></aside></div>
    <section class="card-editor-feedback"><h3></h3><div class="card-editor-selection" aria-live="polite"></div></section>
    <footer class="card-editor-footer"><div class="card-editor-result" role="status" aria-live="polite"></div><button type="button" class="card-editor-delete"></button><button type="button" class="card-editor-edit"></button><button type="button" class="card-editor-check"></button><button type="button" class="card-editor-save"></button></footer>`;
  dialog.querySelector('.card-editor-title').id = titleId;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const name = $('.card-editor-name'), description = $('.card-editor-description'), explanation = $('.card-editor-explanation'), kind = $('.card-editor-kind');
  const result = $('.card-editor-result');
  let workspace = null, root = null, original = null, readOnly = false, busy = false, signature = '';
  let valid = false, dirtyRevision = 0, editingId = '';
  let shelf = null;
  const removedReferences = new Set();
  let disposed = false, selectedId = null;
  const drag = installCardWindowDrag(dialog, { position, onMove: () => {
    if (workspace) { workspace.updateInverseScreenCTM(); Blockly.svgResize(workspace); }
  } });
  const variables = createVariableTools({ getWorkspace: () => workspace, getBusy: () => busy, setBusy: value => { busy = value; } });

  function refreshSelection() {
    const display = $('.card-editor-selection');
    const globalSelection = Blockly.getSelected();
    if (globalSelection?.workspace === workspace) selectedId = globalSelection.id;
    const selected = workspace?.getBlockById(selectedId);
    if (!workspace || !root || selected?.workspace !== workspace) {
      display.textContent = text('选择一个积木，查看它的类型。', 'Select a block to inspect its type.');
      display.classList.remove('is-invalid');
      return;
    }
    try {
      const declaration = toJson(root);
      if (kind.value === 'axiom') delete declaration.inputs.VALUE;
      const checked = inspectCardSelection(declaration, toJson(selected), getInspectionDeclarations?.(declaration) || getInspectionCards?.(declaration) || getCards?.() || []);
      display.classList.toggle('is-invalid', !checked.selectedType);
      display.textContent = checked.selectedType || (checked.selectedError
        ? window.I18N.error(checked.selectedError)
        : text('补全周围的类型或构造后，就能查看这块积木的类型。', 'Complete the surrounding type or construction to inspect this block.'));
    } catch (error) {
      display.classList.add('is-invalid');
      display.textContent = error.code ? window.I18N.error(error) : error.message;
    }
  }

  function palette() {
    let xml = '<xml>';
    const section = (label, types) => {
      xml += `<label text="${escape(label)}"></label>`;
      for (const type of types) xml += `<block type="${escape(type)}"></block>`;
    };
    section(text('类型', 'Types'), ['tt_nat', 'tt_bool', 'tt_unit', 'tt_empty', 'tt_U', 'tt_pi', 'tt_sigma', 'tt_id']);
    section(text('构造', 'Constructions'), ['tt_lam', 'tt_var', 'tt_app', 'tt_pair', 'tt_zero', 'tt_suc', 'tt_true', 'tt_false', 'tt_star', 'tt_refl', 'tt_annot', 'tt_let']);
    section(text('归纳子', 'Eliminators'), [...Object.keys(window.MLTT.eliminatorBlockNames), 'tt_if', 'tt_absurd']);
    const bindings = [];
    for (const block of workspace?.getAllBlocks(false) || []) {
      for (const uid of new Set(Object.values(block.ttBinds || {}).flat())) {
        const field = block.ttNameFields?.[uid];
        if (field) bindings.push([block.getFieldValue(field), uid]);
      }
    }
    if (bindings.length) {
      xml += `<label text="${escape(text('局部变量', 'Local variables'))}"></label>`;
      for (const [label, uid] of bindings) xml += `<block type="tt_var"><field name="REF">${escape(window.LBM.encodeRef(uid, label))}</field></block>`;
    }
    const cards = (getCards?.() || []).filter(card => card.id !== original?.id);
    xml += cardPaletteXml(cards, escape);
    xml += '</xml>';
    return xml;
  }

  function invalidate() {
    valid = false;
    dirtyRevision++;
    $('.card-editor-save').disabled = true;
    result.textContent = '';
    result.className = 'card-editor-result';
  }

  function refreshCardColour() {
    const colour = cardColour({ kind: kind.value, preset: readOnly && original?.preset });
    if (root?.workspace && root.workspace === workspace) root.setColour(colour);
  }

  function record() {
    const declaration = toJson(root);
    declaration.id = editingId;
    declaration.fields.NAME = name.value.trim();
    declaration.fields.KIND = kind.value === 'axiom' ? 'axiom' : 'definition';
    if (kind.value === 'axiom') delete declaration.inputs.VALUE;
    return { ...(original || {}), preset: false, id: editingId, ...(original && !original.preset ? { previousId: original.id } : {}), name: name.value.trim(), description: description.value, explanation: explanation.value, kind: kind.value,
      declaration, workspace: Blockly.serialization.workspaces.save(workspace) };
  }

  async function check() {
    const revision = dirtyRevision;
    if (!name.value.trim()) {
      result.textContent = text('先给卡片起个名字吧。', 'Give the card a name first.');
      return false;
    }
    try {
      const checked = await validate(record());
      if (revision !== dirtyRevision || !dialog.open || disposed) return false;
      valid = checked.ok === true;
      result.className = 'card-editor-result ' + (valid ? 'is-valid' : 'is-invalid');
      result.textContent = valid ? text('检查通过，可以保存啦。', 'Checked. Ready to save.')
        : typeof checked.error === 'string' ? checked.error : checked.error ? (checked.error.code ? window.I18N.error(checked.error) : checked.error.message) : text('还有空槽或类型不匹配，检查一下卡片吧。', 'Check for empty slots or a type mismatch.');
      if (valid && checked.assumptions?.length) result.textContent += text(' 依赖公理：', ' Axiom dependencies: ') + checked.assumptions.map(item => item.name).join(', ');
      $('.card-editor-save').disabled = !valid;
      return valid;
    } catch (error) {
      result.className = 'card-editor-result is-invalid';
      result.textContent = error.message;
      return false;
    }
  }

  function translate() {
    $('.card-editor-title').textContent = readOnly ? text('卡片详情', 'Card details') : original ? text('编辑卡片', 'Edit card') : text('制作卡片', 'Make a card');
    $('.card-editor-intro').textContent = readOnly ? text('这里展示卡片的完整类型和构造。', 'Inspect the complete type and construction.')
      : text('给常用的构造起个名字，下次直接拿来用。', 'Name a useful construction and reuse it next time.');
    for (const [key, cn, en] of [['name', '名称', 'Name'], ['description', readOnly ? '简介' : '简介（选填）', readOnly ? 'Summary' : 'Summary (optional)'],
      ['explanation', readOnly ? '详细说明' : '详细说明（选填）', readOnly ? 'Explanation' : 'Explanation (optional)'], ['kind', '种类', 'Kind']]) $(`[data-label="${key}"]`).textContent = text(cn, en);
    for (const [value, cn, en] of [['axiom', '公理', 'Axiom'], ['theorem', '定理', 'Theorem']]) kind.querySelector(`[value="${value}"]`).textContent = text(cn, en);
    $('.card-editor-feedback h3').textContent = text('类型反馈', 'Type feedback');
    description.placeholder = readOnly ? text('暂无简介。', 'No summary yet.') : text('用一句话概括用途。', 'Summarize its purpose in one sentence.');
    explanation.placeholder = readOnly ? text('暂无详细说明。', 'No explanation yet.')
      : text('可以讲讲用途、每个输入的含义，以及它是怎样一步步构造出来的。', 'Explain its purpose, inputs, and how the construction works step by step.');
    $('.card-editor-check').textContent = text('检查', 'Check');
    $('.card-editor-save').textContent = text('保存卡片', 'Save card');
    $('.card-editor-edit').textContent = text('编辑卡片', 'Edit card');
    $('.card-editor-delete').textContent = text('删除卡片', 'Delete card');
    $('.card-editor-readonly').textContent = text('这是系统预置卡片，仅供查看，不能编辑或删除。', 'This is a system preset. It can be inspected but cannot be edited or deleted.');
    $('.card-editor-close').setAttribute('aria-label', text('关闭', 'Close'));
  }

  function close() {
    if (disposed) return;
    disposed = true;
    Blockly.ContextMenu.hide(); Blockly.DropDownDiv.hideWithoutAnimation();
    shelf?.dispose(); observer.disconnect(); drag.dispose();
    if (Blockly.getSelected()?.workspace === workspace) Blockly.common.setSelected(null);
    workspace?.dispose(); workspace = null; root = null;
    dialog.close(); dialog.remove();
    onClose?.(api);
  }

  function open(card = null, inspecting = false, initialKind = 'axiom') {
    if (card?.preset) inspecting = true;
    shelf?.dispose(); shelf = null;
    if (workspace) { workspace.dispose(); workspace = null; }
    original = card;
    editingId = inspecting && card ? card.id : 'card_' + crypto.randomUUID();
    readOnly = inspecting;
    name.value = card?.name || '';
    description.value = card?.description || '';
    explanation.value = card?.explanation || '';
    kind.value = card ? (card.kind === 'axiom' ? 'axiom' : 'theorem') : initialKind;
    for (const input of [name, kind]) input.disabled = readOnly;
    description.readOnly = readOnly;
    explanation.readOnly = readOnly;
    $('.card-editor-check').hidden = readOnly;
    $('.card-editor-save').hidden = readOnly;
    $('.card-editor-edit').hidden = !readOnly || !cardPermissions(card).edit;
    $('.card-editor-delete').hidden = !readOnly || !cardPermissions(card).remove;
    $('.card-editor-readonly').hidden = !card?.preset;
    translate(); refreshCardColour(); invalidate(); signature = '';
    if (!dialog.open) dialog.show();
    workspace = Blockly.inject($('.card-editor-workspace'), {
      renderer: 'thrasos', theme, readOnly, ...(readOnly ? {} : { toolbox: palette(), trashcan: true }),
      move: { scrollbars: true, drag: true, wheel: false },
      zoom: { controls: true, wheel: true, startScale: 0.85, minScale: 0.3, maxScale: 1.5 },
      sounds: false, media: window.BLOCKLY_MEDIA,
    });
    if (!readOnly && window.LexicalVariablesPlugin) window.LexicalVariablesPlugin.init(workspace);
    $('.card-editor-blocks').hidden = true;
    if (!readOnly) shelf = installCompactShelf(workspace, { button: $('.card-editor-blocks') });
    busy = true;
    Blockly.Events.disable();
    try {
      if (card?.declaration) {
        const saved = cleanCardSession({ workspace: cardWorkspace(card) }, removedReferences).workspace;
        for (const block of saved.blocks?.blocks || []) if (block.type === 'tt_declare') block.id = editingId;
        Blockly.serialization.workspaces.load(saved, workspace);
      }
      root = workspace.getTopBlocks(false).find(block => block.type === 'tt_declare');
      if (!root) {
        root = workspace.newBlock('tt_declare', editingId);
        root.initSvg();
        root.moveBy(36, 36);
      }
      root.setDeletable(false); root.setMovable(false);
      root.setFieldValue(name.value, 'NAME');
      root.setFieldValue(kind.value === 'axiom' ? 'axiom' : 'definition', 'KIND');
      root.setColour(cardColour({ kind: kind.value, preset: readOnly && original?.preset }));
      root.getField('KIND').setEnabled(false);
      for (const block of workspace.getAllBlocks(false).reverse()) block.render();
    } finally { Blockly.Events.enable(); busy = false; }
    workspace.addChangeListener(event => {
      if (event.type === Blockly.Events.SELECTED) { refreshSelection(); return; }
      if (readOnly || busy || event.isUiEvent) return;
      if (event.type === Blockly.Events.BLOCK_CREATE) variables.remapCreatedBindings(event.ids);
      variables.refreshVars();
      if (name.value !== root.getFieldValue('NAME')) name.value = root.getFieldValue('NAME');
      invalidate(); refreshCardColour();
      const xml = palette();
      if (xml !== signature) { signature = xml; workspace.updateToolbox(xml); }
      for (const block of workspace.getAllBlocks(false)) block.refreshTypeLayout?.();
      refreshSelection();
    });
    // Blockly keeps read-only workspaces immutable and normally does not select
    // their blocks. Selection alone remains useful while inspecting a theorem.
    workspace.getParentSvg().addEventListener('pointerdown', event => {
      if (!readOnly) return;
      const id = event.target.closest('[data-id]')?.getAttribute('data-id');
      const block = id && workspace.getBlockById(id);
      if (!block) return;
      onFocus?.(api);
      event.stopImmediatePropagation();
      Blockly.common.setSelected(block); selectedId = block.id;
      refreshSelection();
    }, true);
    workspace.getParentSvg().addEventListener('contextmenu', event => {
      if (!readOnly) return;
      const id = event.target.closest('[data-id]')?.getAttribute('data-id');
      const block = id && workspace.getBlockById(id);
      if (!block) return;
      event.preventDefault(); event.stopPropagation();
      Blockly.common.setSelected(block);
      const options = [{ text: text('查看类型', 'Inspect type'), enabled: true, callback: () => { selectedId = block.id; Blockly.common.setSelected(block); refreshSelection(); } },
        { text: text('复制文本', 'Copy text'), enabled: !!navigator.clipboard?.writeText, callback: () => { void navigator.clipboard.writeText(block.toString()).catch(() => {}); } }];
      block.customContextMenu?.(options);
      Blockly.ContextMenu.setCurrentBlock(block);
      Blockly.ContextMenu.show(event, options, workspace.RTL, workspace);
      refreshSelection();
    });
    Blockly.svgResize(workspace);
    if (card) workspace.zoomToFit();
    drag.clamp();
    if (!readOnly) name.focus();
    refreshSelection();
  }

  name.addEventListener('input', () => { root?.setFieldValue(name.value, 'NAME'); invalidate(); });
  description.addEventListener('input', invalidate);
  explanation.addEventListener('input', invalidate);
  kind.addEventListener('change', () => {
    root?.setFieldValue(kind.value === 'axiom' ? 'axiom' : 'definition', 'KIND');
    root?.render(); invalidate(); refreshCardColour();
  });
  $('.card-editor-close').addEventListener('click', close);
  $('.card-editor-check').addEventListener('click', check);
  $('.card-editor-save').addEventListener('click', async () => {
    if (!valid || !await check()) return;
    try { await onSave(record()); close(); }
    catch (error) { result.className = 'card-editor-result is-invalid'; result.textContent = error.message; }
  });
  $('.card-editor-edit').addEventListener('click', () => open(original));
  $('.card-editor-delete').addEventListener('click', async () => {
    try { await onDelete(original); close(); }
    catch (error) { result.className = 'card-editor-result is-invalid'; result.textContent = error.message; }
  });
  const observer = new ResizeObserver(() => { if (workspace && dialog.open) Blockly.svgResize(workspace); });
  observer.observe($('.card-editor-workspace'));
  dialog.addEventListener('pointerdown', () => onFocus?.(api), true);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  const api = { get element() { return dialog; }, get workspace() { return workspace; }, get readOnly() { return readOnly; }, refreshSelection,
    open: (card, kind) => open(card, false, kind), inspect: card => open(card, true), close,
    removeCardReferences(ids) {
      for (const id of ids) removedReferences.add(id);
      removeCardBlocks(workspace, ids);
    },
    refreshLibrary() { if (workspace && !readOnly) workspace.updateToolbox(palette()); },
    dispose: close };
  return api;
}
