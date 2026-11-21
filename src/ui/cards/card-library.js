import { versionedStorageKey } from '../version.js';
import { cardColour } from './card-colours.js';
import { cardActions } from './card-actions.js';

const KEY = versionedStorageKey('cards');
const clone = value => JSON.parse(JSON.stringify(value));
const normalize = card => ({ ...clone(card), kind: card.kind === 'definition' ? 'theorem' : card.kind });

// The checked declaration is the single source for both computation and display.
export function cardWorkspace(record) {
  function block(node) {
    if (node.type === 'tt_symbol') return { type: 'tt_card', id: node.id, fields: { CARD: node.fields.REF } };
    return { type: node.type, id: node.id, fields: node.fields,
      inputs: Object.fromEntries(Object.entries(node.inputs || {}).map(([key, child]) => [key, { block: block(child) }])) };
  }
  return { blocks: { languageVersion: 0, blocks: [{ ...block(record.declaration), x: 36, y: 36 }] } };
}

export function createCardLibrary({ onChange, inspect, edit, onRemove, requestDelete }) {
  const presets = (window.LEVELS.cards || []).map(card => ({ ...normalize(card), preset: true }));
  const presetIds = new Set(presets.map(card => card.id));
  let records = presets.slice();
  let removed = new Set();
  try { removed = new Set(JSON.parse(localStorage.getItem(KEY + '.removed') || '[]')); } catch (_) { /* Storage may be unavailable. */ }
  const refs = value => {
    const result = new Set();
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'tt_symbol' && node.fields?.REF) result.add(node.fields.REF);
      if (node.type === 'tt_card' && node.fields?.CARD) result.add(node.fields.CARD);
      Object.values(node).forEach(walk);
    }
    walk(value); return result;
  };
  function closure(value, source = records) {
    const found = new Map();
    function visit(id) {
      if (found.has(id)) return;
      const record = source.find(item => item.id === id);
      if (!record) return; // Canvas-local declarations are resolved by the checker.
      found.set(id, record);
      for (const ref of refs(record.declaration)) visit(ref);
    }
    for (const ref of refs(value)) visit(ref);
    return [...found.values()];
  }
  function declarations(value, source = records) {
    const selected = closure(value, source);
    const names = new Set();
    return selected.map(record => {
      const declaration = clone(record.declaration);
      // Distinct saved revisions may coexist on one canvas.
      if (names.has(declaration.fields.NAME)) declaration.fields.NAME += '_' + record.id.replace(/-/g, '').slice(-8);
      names.add(declaration.fields.NAME);
      return declaration;
    });
  }
  function validate(record, source = records) {
    try {
      if (!record || typeof record.id !== 'string' || !/^[\w-]{1,100}$/.test(record.id) ||
          !['theorem', 'axiom'].includes(record.kind) || typeof record.name !== 'string' ||
          !record.name.trim() || record.name.length > 80 || /[\s:␟]/u.test(record.name)) throw new Error('名称请使用不带空格、冒号的短名称。');
      if (record.declaration?.type !== 'tt_declare' || record.declaration.id !== record.id ||
          record.declaration.fields?.NAME !== record.name ||
          record.declaration.fields?.KIND !== (record.kind === 'axiom' ? 'axiom' : 'definition')) throw new Error('卡片的名称、种类或标识不一致。');
      if (JSON.stringify(record).length > 300000) throw new Error('这张卡片太大了。');
      if (record.description !== undefined && (typeof record.description !== 'string' || record.description.length > 8000)) throw new Error('简介请使用不超过 8000 字符的纯文本。');
      if (record.explanation !== undefined && (typeof record.explanation !== 'string' || record.explanation.length > 20000)) throw new Error('详细说明请使用不超过 20000 字符的纯文本。');
      const all = source.filter(item => item.id !== record.id).concat(record);
      const root = { type: 'tt_answer', inputs: { TERM: { type: 'tt_symbol', fields: { REF: record.id } } } };
      const result = window.MLTT.checkWorkshop({ givens: [], entry: true }, root, declarations(root, all));
      if (!result.ok) return result;
      return { ...result, typeText: result.declarations.find(item => item.id === record.id)?.typeText };
    } catch (error) { return { ok: false, error }; }
  }
  function persist() { localStorage.setItem(KEY, JSON.stringify(records.filter(record => !presetIds.has(record.id)))); }
  function save(record) {
    if (records.length >= 200) throw new Error('卡片库已达到 200 个版本的上限。');
    if (records.some(item => !removed.has(item.id) && item.name === record.name && item.id !== record.previousId && !records.some(other => other.previousId === item.id))) throw new Error('已经有同名卡片了，请换个名称。');
    const result = validate(record);
    if (!result.ok) throw result.error || new Error('还有空槽需要填写。');
    if (records.some(item => item.id === record.id)) throw new Error('已保存的版本不能覆盖，请另存一个新版本。');
    const stored = clone({ ...record, preset: false, workspace: undefined, typeText: result.typeText });
    records.push(stored);
    try { persist(); } catch (_) { /* The current library remains available in memory. */ }
    onChange?.(); return stored;
  }
  function importRecords(items = []) {
    if (!Array.isArray(items) || items.length > 200 || JSON.stringify(items).length > 1500000) throw new Error('卡片库数据无效或太大。');
    items = items.map(card => ({ ...normalize(card), preset: presetIds.has(card.id) }));
    const combined = records.slice();
    for (const record of items) {
      const previous = combined.find(item => item.id === record.id);
      if (previous && presetIds.has(record.id) && record.name === previous.name && record.kind === previous.kind &&
          JSON.stringify(record.declaration) === JSON.stringify(previous.declaration)) continue;
      if (previous && JSON.stringify(previous) !== JSON.stringify(record)) throw new Error('分享中的卡片与本地同版本内容冲突。');
      if (!previous) combined.push(clone(record));
    }
    for (const record of items) {
      const result = validate(record, combined);
      if (!result.ok) throw result.error || new Error('卡片尚未完成。');
    }
    records = combined;
    try { persist(); } catch (_) { /* Storage may be unavailable. */ }
  }
  function remove(id) {
    const record = records.find(card => card.id === id);
    if (!record || record.preset) throw new Error('系统预置卡片不能删除。');
    const affected = new Set([id]);
    // Edits belong to one card family. Dependent player cards cannot retain a
    // deleted premise, so remove those families and their instances as well.
    let changed = true;
    while (changed) {
      changed = false;
      for (const card of records.filter(card => !card.preset)) {
        if (affected.has(card.id)) {
          if (card.previousId && !presetIds.has(card.previousId) && !affected.has(card.previousId)) { affected.add(card.previousId); changed = true; }
        } else if (affected.has(card.previousId) || [...refs(card.declaration)].some(ref => affected.has(ref))) {
          affected.add(card.id); changed = true;
        }
      }
    }
    onRemove?.(affected);
    for (const key of affected) removed.add(key);
    try { localStorage.setItem(KEY + '.removed', JSON.stringify([...removed])); } catch (_) { /* Keep the current library usable. */ }
    onChange?.();
    return affected;
  }
  const B = window.Blockly;
  class CardField extends B.FieldLabelSerializable {
    getText() {
      const record = records.find(item => item.id === this.getValue());
      return record ? record.name : '⚠ 未找到卡片';
    }
    doValueUpdate_(value) {
      super.doValueUpdate_(value);
      this.getSourceBlock()?.setColour(cardColour(records.find(card => card.id === value)));
    }
  }
  B.Blocks.tt_card = {
    init() {
      this.appendDummyInput().appendField(new CardField(''), 'CARD');
      this.setOutput(true, null); this.setColour(cardColour());
      this.setTooltip(() => {
        const record = records.find(item => item.id === this.getFieldValue('CARD'));
        return record?.typeText || '';
      });
    },
    customContextMenu(options) {
      const record = records.find(item => item.id === this.getFieldValue('CARD'));
      options.unshift(...cardActions(record, { view: inspect, edit, remove: requestDelete, locale: window.I18N.locale }));
    },
  };
  try { importRecords(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (_) { records = presets.slice(); }
  return { save, validate, importRecords, declarations, remove,
    exportUsed: value => clone(closure(value)),
    list: () => records.filter(record => !removed.has(record.id) && !records.some(other => other.previousId === record.id)),
    get: id => records.find(record => record.id === id),
  };
}
