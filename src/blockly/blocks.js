/* Blockly block definitions + lexical binding module (LBM).
 * Key: binders write uids into ttBinds; variable blocks only accept binders whose path goes through that input slot.
 */
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

  /** Visible binders from inner to outer: {uid, name, block, colour} */
  function bindersInScope(block) {
    const out = [];
    let child = block;
    for (let p = block.getParent(); p; child = p, p = p.getParent()) {
      const inputName = inputContaining(p, child);
      if (!inputName || !p.ttBinds) continue;
      const uids = p.ttBinds[inputName];
      if (!uids || !uids.length) continue;
      // Multiple binders in one input (J's y,q / natrec's k,ih): later ones are more local.
      for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];
        const fname = p.ttNameFields && p.ttNameFields[uid];
        const name = fname ? (p.getFieldValue(fname) || 'x') : 'x';
        out.push({ uid, name, block: p, colour: p.ttColour || binderColour(uid) });
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

  // ================= Blocks =================

  // Variable
  B.Blocks['tt_var'] = {
    init() {
      this.appendDummyInput().appendField(new FieldBinderRef(''), 'REF');
      this.setOutput(true, null);
      this.setColour('#d7ccc8');
      this.setTooltip(() => t('block.varTooltip'));
      this.ttIsVar = true;
    }
  };

  // lambda (no type slot: the checker supplies the expected type; use tt_annot for annotations)
  B.Blocks['tt_lam'] = {
    init() {
      declareBinder(this, { BODY: 'x' });
      this.appendDummyInput()
        .appendField('λ')
        .appendField(nameField('x'), 'XNAME')
        .appendField('.');
      this.appendValueInput('BODY');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour('#d7ccc8');
      this.setTooltip(() => t('block.lamTooltip'));
    }
  };

  // Pi
  B.Blocks['tt_pi'] = {
    init() {
      declareBinder(this, { BODY: 'x' });
      this.appendDummyInput()
        .appendField('Π')
        .appendField(nameField('x'), 'XNAME')
        .appendField(':');
      this.appendValueInput('DOM');
      this.appendValueInput('BODY').appendField('→');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.piTooltip'));
    }
  };

  // Sigma
  B.Blocks['tt_sigma'] = {
    init() {
      declareBinder(this, { BODY: 'x' });
      this.appendDummyInput()
        .appendField('Σ')
        .appendField(nameField('x'), 'XNAME')
        .appendField(':');
      this.appendValueInput('DOM');
      this.appendValueInput('BODY').appendField('×');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.sigmaTooltip'));
    }
  };

  // let
  B.Blocks['tt_let'] = {
    init() {
      declareBinder(this, { BODY: 'x' });
      this.appendDummyInput()
        .appendField('let')
        .appendField(nameField('x'), 'XNAME')
        .appendField('=');
      this.appendValueInput('VALUE');
      this.appendDummyInput().appendField('in');
      this.appendValueInput('BODY');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.letTooltip'));
    }
  };

  // natrec
  B.Blocks['tt_natrec'] = {
    init() {
      declareBinder(this, { MOT_BODY: 'm', STEP_BODY: ['k', 'ih'] });
      this.appendDummyInput().appendField('natrec').appendField('n =');
      this.appendValueInput('N');
      this.appendDummyInput()
        .appendField(t('block.motiveLambda'))
        .appendField(nameField('_'), 'MNAME')
        .appendField('▸');
      this.appendValueInput('MOT_BODY');
      this.appendDummyInput().appendField(t('block.base'));
      this.appendValueInput('Z');
      this.appendDummyInput()
        .appendField(t('block.stepLambda'))
        .appendField(nameField('k'), 'KNAME')
        .appendField('λ')
        .appendField(nameField('ih'), 'IHNAME')
        .appendField('▸');
      this.appendValueInput('STEP_BODY');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.natrecTooltip'));
    }
  };

  // J
  B.Blocks['tt_J'] = {
    init() {
      declareBinder(this, { MOT_BODY: ['y', 'q'] });
      this.appendDummyInput().appendField(t('block.jBase')).appendField('a =');
      this.appendValueInput('BASE');
      this.appendDummyInput()
        .appendField(t('block.motiveLambda'))
        .appendField(nameField('y'), 'YNAME')
        .appendField('λ')
        .appendField(nameField('q'), 'QNAME')
        .appendField('▸');
      this.appendValueInput('MOT_BODY');
      this.appendDummyInput().appendField(t('block.baseD'));
      this.appendValueInput('D');
      this.appendDummyInput().appendField(t('block.atB'));
      this.appendValueInput('B');
      this.appendDummyInput().appendField(t('block.alongP'));
      this.appendValueInput('P');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.jTooltip'));
    }
  };

  // Sigma elimination
  B.Blocks['tt_sigma_ind'] = {
    init() {
      declareBinder(this, { MOT_BODY: 'p', STEP_BODY: ['a', 'b'] });
      this.appendDummyInput().appendField('sigma_ind').appendField('p =');
      this.appendValueInput('P');
      this.appendDummyInput()
        .appendField(t('block.motiveLambda'))
        .appendField(nameField('_'), 'PNAME')
        .appendField('▸');
      this.appendValueInput('MOT_BODY');
      this.appendDummyInput()
        .appendField(t('block.stepLambda'))
        .appendField(nameField('a'), 'ANAME')
        .appendField('λ')
        .appendField(nameField('b'), 'BNAME')
        .appendField('▸');
      this.appendValueInput('STEP_BODY');
      this.setInputsInline(false);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.sigmaIndTooltip'));
    }
  };

  // Given (level context)
  B.Blocks['tt_given'] = {
    init() {
      const givens = (typeof window !== 'undefined' && window.GAME_GIVENS) || [];
      const opts = givens.length
        ? givens.map((g, i) => [g.label, String(i)])
        : [['∅', '0']];
      const f = new B.FieldDropdown(opts);
      this.appendDummyInput().appendField(t('block.given')).appendField(f, 'IDX');
      this.setOutput(true, null);
      this.setColour('#d7ccc8');
      this.setTooltip(() => t('block.givenTooltip'));
    }
  };

  // Answer slot: auto-generated, non-deletable top-level container.
  // Checking reads only this slot; other top-level blocks are scratch.
  B.Blocks['tt_answer'] = {
    init() {
      // A level may declare several answer-slot local variables (for example L3's f and x).
      const binders = (typeof window !== 'undefined' && window.GAME_ANSWER_BINDERS) || [];
      const infer = (typeof window !== 'undefined' && window.GAME_INFER) || false;
      const inferTerm = (typeof window !== 'undefined' && window.GAME_INFER_TERM) || '?';
      const ctxRaw = (typeof window !== 'undefined' && window.GAME_ANSWER_CTX) || [];
      const ctx = Array.isArray(ctxRaw) ? ctxRaw : (ctxRaw ? String(ctxRaw).split(/,\s*/) : []);
      // Split the given context by commas into rows; EndRowInput forces the next item onto a new line,
      // while keeping inputsInline so TERM remains a nestable "hole".
      ctx.forEach((text, i) => {
        this.appendEndRowInput().appendField(new B.FieldLabel(text), 'CTX' + i);
      });
      if (binders.length) {
        // One uid per binder; field names are BNAME0/BNAME1... so app can fill them back in.
        declareBinder(this, { TERM: binders.map((_, i) => 'v' + i) });
        const uids = this.ttBinds.TERM || [];
        this.ttNameFields = {};
        binders.forEach((b, i) => {
          const f = FieldLocalVar ? new FieldLocalVar(b.name || ('v' + i)) : nameField(b.name || ('v' + i));
          f.setTooltip(() => t('block.binderTooltip'));
          if (uids[i]) this.ttNameFields[uids[i]] = 'BNAME' + i;
          const row = this.appendEndRowInput();
          row.appendField(f, 'BNAME' + i);
          row.appendField(' : ');
          row.appendField(new B.FieldLabel(b.tyText || '?'), 'BTYPE' + i);
        });
      }
      this.setColour('#d1c4e9');
      this.appendEndRowInput().appendField('⊢');
      if (infer) {
        // Inference mode: show the fixed term; the player fills in its type.
        const row = this.appendDummyInput();
        row.appendField(new B.FieldLabel(inferTerm), 'INFERTERM');
        row.appendField(' :');
        this.appendValueInput('TERM');
      } else {
        this.appendValueInput('TERM');
        this.appendDummyInput()
          .appendField(':')
          .appendField(new B.FieldLabel('?'), 'GOAL');
      }
      this.setInputsInline(true);
      this.setDeletable(false);
      this.setMovable(true);
      this.setTooltip(() => infer
        ? t('block.answerInferTooltip')
        : t('block.answerTooltip'));
      this.ttIsAnswer = true;
    }
  };

  /* The answer block inline input stays a "hole": the background is not covered, so the answer nests in it. */

  // Simple blocks (JSON)
  const simpleBlocks = [
    {
      type: 'tt_app', message0: '%1 %2',
      args0: [{ type: 'input_value', name: 'F' }, { type: 'input_value', name: 'A' }],
      inputsInline: true, output: null, colour: '#d7ccc8',
      tooltipKey: 'appTooltip'
    },
    {
      type: 'tt_pair', message0: '⟨ %1 , %2 ⟩',
      args0: [{ type: 'input_value', name: 'A' }, { type: 'input_value', name: 'B' }],
      inputsInline: true, output: null, colour: '#d7ccc8',
      tooltipKey: 'pairTooltip'
    },
    {
      type: 'tt_fst', message0: 'fst %1',
      args0: [{ type: 'input_value', name: 'P' }],
      inputsInline: true, output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_snd', message0: 'snd %1',
      args0: [{ type: 'input_value', name: 'P' }],
      inputsInline: true, output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_id', message0: 'Id %1 (%2, %3)',
      args0: [
        { type: 'input_value', name: 'TY' },
        { type: 'input_value', name: 'L' },
        { type: 'input_value', name: 'R' }
      ],
      inputsInline: true, output: null, colour: '#d7ccc8',
      tooltipKey: 'idTooltip'
    },
    {
      type: 'tt_annot', message0: '( %1 : %2 )',
      args0: [{ type: 'input_value', name: 'TERM' }, { type: 'input_value', name: 'TYPE' }],
      inputsInline: true, output: null, colour: '#d7ccc8',
      tooltipKey: 'annotTooltip'
    },
    {
      type: 'tt_refl', message0: 'refl',
      output: null, colour: '#d7ccc8',
      tooltipKey: 'reflTooltip'
    },
    {
      type: 'tt_zero', message0: '0', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_suc', message0: 'suc %1',
      args0: [{ type: 'input_value', name: 'N' }],
      inputsInline: true, output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_nat', message0: 'ℕ', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_bool', message0: 'Bool', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_true', message0: 'true', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_false', message0: 'false', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_empty', message0: '0', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_unit', message0: '1', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_star', message0: '★', output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_absurd', message0: 'absurd %1',
      args0: [{ type: 'input_value', name: 'E' }],
      inputsInline: true, output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_unitrec', message0: 'unitrec u = %1 C = %2 c = %3',
      args0: [
        { type: 'input_value', name: 'U' },
        { type: 'input_value', name: 'MOT' },
        { type: 'input_value', name: 'BASE' }
      ],
      inputsInline: true, output: null, colour: '#d7ccc8',
      tooltipKey: 'unitrecTooltip'
    },
    {
      type: 'tt_if', message0: 'if %1 then %2 else %3', messageKey: 'ifMessage',
      args0: [
        { type: 'input_value', name: 'B' },
        { type: 'input_value', name: 'X' },
        { type: 'input_value', name: 'Y' }
      ],
      inputsInline: true, output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_hole', message0: '?', output: null, colour: '#d7ccc8',
      tooltipKey: 'holeTooltip'
    },
    {
      type: 'tt_U', message0: 'Type %1',
      args0: [{
        type: 'field_dropdown', name: 'LEVEL',
        options: [['0', '0'], ['1', '1']]
      }],
      output: null, colour: '#d7ccc8'
    },
    {
      type: 'tt_lemma', message0: 'lemma %1', messageKey: 'lemmaMessage',
      args0: [{ type: 'field_input', name: 'NAME', text: 'add' }],
      output: null, colour: '#d7ccc8',
      tooltipKey: 'lemmaTooltip'
    }
  ];
  for (const definition of simpleBlocks) {
    const { tooltipKey, messageKey, ...json } = definition;
    B.Blocks[json.type] = {
      init() {
        this.jsonInit(messageKey ? { ...json, message0: t('block.' + messageKey) } : json);
        if (tooltipKey) this.setTooltip(() => t('block.' + tooltipKey));
      }
    };
  }

  // Global exports
  global.LBM = {
    bindersInScope, findBinder, nextBinderName, encodeRef, decodeRef,
    binderColour, inputContaining, esc
  };
})(typeof window !== 'undefined' ? window : globalThis);
