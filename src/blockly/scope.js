/* Lexical scopes and fields shared by the Blockly definitions. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  if (!B) return;
  const t = global.I18N.t;

  // ---------- Helpers ----------
  const pick = (v, d) => (v === undefined || v === null || v === '') ? d : v;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
    return '#' + to(f(0)) + to(f(8)) + to(f(4));
  }
  function binderColour(uid) { return hsl(hash(uid) % 360, 30, 44); }

  function mkUid(block, tag) {
    const id = block.id || ('t' + Math.random().toString(36).slice(2));
    return 'b' + id + (tag ? ':' + tag : '');
  }

  // ---------- Scope queries ----------
  function inputContaining(parent, child) {
    const list = parent.inputList || [];
    for (const inp of list) {
      if (inp.connection && inp.connection.targetBlock() === child) return inp.name;
    }
    return null;
  }

  function contextDeclarations(context, before = Infinity) {
    if (!context || context.type !== 'tt_context') return [];
    const out = [];
    for (let i = 0; i < Math.min(context.ttItemCount || 0, before); i++) {
      const block = context.getInputTargetBlock('ITEM' + i);
      if (block?.type !== 'tt_binding') continue;
      const uid = block.ttBindingUid || 'b' + block.id + ':decl';
      out.push({ uid, name: block.getFieldValue('NAME') || 'x', block, colour: binderColour(uid) });
    }
    return out;
  }

  /** Visible binders from inner to outer: {uid, name, block, colour} */
  function bindersInScope(block) {
    const out = [];
    let child = block;
    for (let p = block.getParent(); p; child = p, p = p.getParent()) {
      const inputName = inputContaining(p, child);
      if (!inputName) continue;
      let context = [];
      if (p.type === 'tt_context') {
        const match = /^ITEM(\d+)$/.exec(inputName);
        if (match) context = contextDeclarations(p, Number(match[1]));
      } else if (['tt_judgment', 'tt_rule_app', 'tt_rule_judgments'].includes(p.type) && inputName !== 'CONTEXT') {
        context = contextDeclarations(p.getInputTargetBlock('CONTEXT'));
      }
      for (const binding of context.reverse()) if (!out.some(existing => existing.uid === binding.uid)) out.push(binding);
      if (!p.ttBinds) continue;
      const uids = p.ttBinds[inputName];
      if (!uids || !uids.length) continue;
      // Multiple binders in one input (J's y,q / natrec's k,ih): later ones are more local.
      for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];
        const fname = p.ttNameFields && p.ttNameFields[uid];
        const name = fname ? (p.getFieldValue(fname) || 'x') : 'x';
        if (!out.some(binding => binding.uid === uid)) out.push({ uid, name, block: p, colour: p.ttColour || binderColour(uid) });
      }
    }
    if (child.type === 'tt_declare' && block !== child) {
      const answer = block.workspace.getBlocksByType('tt_problem', false)[0] ||
        block.workspace.getBlocksByType('tt_answer', false)[0];
      if (answer) {
        for (const uid of [...(answer.ttBinds && answer.ttBinds.TERM || [])].reverse()) {
          const field = answer.ttNameFields[uid];
          out.push({ uid, name: answer.getFieldValue(field), block: answer, colour: answer.ttColour });
        }
      }
    }
    return out;
  }

  function findBinder(block, uid) {
    return bindersInScope(block).find((b) => b.uid === uid) || null;
  }

  /** Avoid outer names: prefer later letters, then append digits. */
  function nextBinderName(base, used) {
    base = String(base || 'x');
    const has = (n) => used ? (used.has ? used.has(n) : (used.indexOf(n) >= 0)) : false;
    if (!has(base)) return base;
    const m = /^([a-z])(\d*)$/.exec(base);
    if (m) {
      for (let c = m[1].charCodeAt(0) + 1; c <= 122; c++) {
        const cand = String.fromCharCode(c);
        if (!has(cand)) return cand;
      }
    }
    let k = 2;
    while (has(base + k)) k++;
    return base + k;
  }

  // ---------- Variable reference field ----------
  const SEP = '\u241F';
  function encodeRef(uid, name) { return (uid || '') + SEP + (name || ''); }
  function decodeRef(v) {
    const s = String(v == null ? '' : v);
    const i = s.indexOf(SEP);
    if (i < 0) return { uid: s, name: '' };
    return { uid: s.slice(0, i), name: s.slice(i + 1) };
  }

  class FieldBinderRef extends B.FieldDropdown {
    constructor(value) {
      super(function () { return FieldBinderRef.menuFor(this); }, undefined, { value: value || '' });
    }
    static menuFor(field) {
      const src = field.getSourceBlock();
      const list = src ? bindersInScope(src) : [];
      if (!list.length) return [[t('block.noVariables'), encodeRef('', '')]];
      const seen = new Map();
      return list.map((b) => {
        const n = (seen.get(b.name) || 0) + 1;
        seen.set(b.name, n);
        return [n > 1 ? b.name + ' · ' + t('block.level') + ' ' + n : b.name, encodeRef(b.uid, b.name)];
      });
    }
    // Keep stale references in the field and let the validator flag them instead of silently rebinding.
    doClassValidation_(v) { return typeof v === 'string' ? v : null; }
    getText_() {
      const { uid, name } = decodeRef(this.getValue());
      if (!uid && !name) return '∅';
      // No uid yet (for example a toolbox template): display by name.
      if (!uid) return name;
      const src = this.getSourceBlock();
      const b = findBinder(src, uid);
      if (b) return b.name;
      // Getters in the flyout are outside the declarer scope; show the saved name.
      if (src && src.workspace && src.workspace.isFlyout) return name || 'x';
      return (name || '?') + ' ⚠';
    }
  }
  global.FieldBinderRef = FieldBinderRef;

  // Local variable name field: uses @mit-app-inventor/blockly-block-lexical-variables
  // FieldFlydown (hover pops out a getter block; click to rename).
  const LEX = global.LexicalVariablesPlugin;
  const xmlEsc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const FieldLocalVar = (LEX && LEX.FieldFlydown) ? class extends LEX.FieldFlydown {
    constructor(value) {
      super(value, true);
    }
    flydownBlocksXML_() {
      const block = this.getSourceBlock();
      let uid = null;
      if (block && block.ttBinds && block.ttNameFields) {
        for (const uids of Object.values(block.ttBinds)) {
          for (const u of uids) {
            if (block.ttNameFields[u] === this.name) { uid = u; break; }
          }
          if (uid) break;
        }
      }
      const ref = encodeRef(uid, this.getValue());
      // The flyout block is this language's variable getter: tt_var, bound to this local variable.
      return '<xml><block type="tt_var"><field name="REF">' + xmlEsc(ref) + '</field></block></xml>';
    }
  } : null;
  global.FieldLocalVar = FieldLocalVar;

  // ---------- Shared: scope declaration ----------
  function declareBinder(block, inputs) {
    // inputs: {BODY:'b', STEP_BODY:['k','ih']}
    const binds = {}, names = {};
    for (const [input, spec] of Object.entries(inputs)) {
      const tags = Array.isArray(spec) ? spec : [spec];
      binds[input] = tags.map((tag) => mkUid(block, tag));
    }
    block.ttBinds = binds;
    block.ttNameFields = {};
    for (const [input, uids] of Object.entries(binds)) {
      const tags = Array.isArray(inputs[input]) ? inputs[input] : [inputs[input]];
      uids.forEach((uid, i) => {
        const upper = tags[i].toUpperCase().replace(/[^A-Z0-9]/g, '');
        block.ttNameFields[uid] = upper + 'NAME';
      });
    }
    block.ttColour = '#d7ccc8';
    block.setColour(block.ttColour);
  }

  function nameField(defaultName) {
    const f = new B.FieldTextInput(defaultName || 'x');
    f.setValidator((v) => {
      const s = String(v == null ? '' : v).trim().replace(/\s+/g, '');
      const name = s ? s.slice(0, 8) : (defaultName || 'x');
      const block = f.getSourceBlock();
      // Reject duplicates of outer local variables (easier to read and to use the dropdown).
      if (block && bindersInScope(block).some((b) => b.name === name)) return null;
      return name;
    });
    return f;
  }

  // Global exports
  global.LBM = {
    bindersInScope, findBinder, nextBinderName, encodeRef, decodeRef,
    binderColour, inputContaining, contextDeclarations, esc
  };
  global.BlockBinding = { declareBinder, nameField };
})(typeof window !== 'undefined' ? window : globalThis);
