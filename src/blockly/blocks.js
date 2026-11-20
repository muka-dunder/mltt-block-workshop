/* Blockly block definitions; scope.js supplies binding and field helpers. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  if (!B) return;
  const t = global.I18N.t;
  if (!global.BlockBinding) throw new Error('Load scope.js before blocks.js');
  const { declareBinder, nameField } = global.BlockBinding;
  const { FieldBinderRef, FieldLocalVar } = global;

  // ================= Blocks =================

  // Variable
  const workshopText = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;
  class FieldSymbolRef extends B.FieldDropdown {
    constructor() {
      super(() => {
        const symbols = global.GAME_SYMBOLS || [];
        return symbols.length ? symbols.map(s => [s.name, s.id]) : [['∅', '']];
      });
    }
    doClassValidation_(value) { return typeof value === 'string' ? value : null; }
    getText_() {
      const id = this.getValue();
      const found = (global.GAME_SYMBOLS || []).find(s => s.id === id);
      return found ? found.name : (id ? '⚠ ' + workshopText('已删除', 'removed') : '∅');
    }
  }
  B.Blocks['tt_symbol'] = {
    init() {
      this.appendDummyInput().appendField(new FieldSymbolRef(), 'REF');
      this.setOutput(true, null);
      this.setColour('#c3b5e5');
      this.setTooltip(workshopText('引用自定义声明；重命名后仍引用同一声明。', 'Reference a declaration by its stable identity.'));
    }
  };
  B.Blocks['tt_declare'] = {
    init() {
      this.appendDummyInput()
        .appendField(new B.FieldDropdown([
          [workshopText('定义', 'Definition'), 'definition'],
          [workshopText('假设', 'Assumption'), 'assumption'],
          [workshopText('公理', 'Axiom'), 'axiom'],
        ], function(value) {
          const block = this.getSourceBlock();
          if (block) block.updateDeclarationShape(value);
          return value;
        }), 'KIND')
        .appendField(new B.FieldTextInput('mySymbol'), 'NAME');
      this.appendValueInput('TYPE').appendField(':');
      this.appendValueInput('VALUE').appendField(':=');
      this.setColour('#7b6aa8');
      this.setTooltip(workshopText('先填写类型；定义还需要一个具有该类型的值。额外假设会显示在检查结果中。', 'Supply a type and, for a definition, a value of that type. Extra assumptions are tracked.'));
    },
    updateDeclarationShape(kind) {
      const input = this.getInput('VALUE');
      if (input) input.setVisible(kind === 'definition');
    },
  };

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

})(typeof window !== 'undefined' ? window : globalThis);
