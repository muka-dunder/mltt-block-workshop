/* Blockly block definitions; scope.js supplies binding and field helpers. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  if (!B) return;
  const t = global.I18N.t;
  if (!global.BlockBinding) throw new Error('Load scope.js before blocks.js');
  const { declareBinder, nameField } = global.BlockBinding;
  const { FieldBinderRef, FieldLocalVar } = global;
  for (const [type, name] of Object.entries(global.MLTT.eliminatorBlockNames)) {
    B.Blocks[type] = {
      init() {
        this.ttEliminator = name;
        const input = this.appendDummyInput().appendField(name);
        if (['ind_sigma', 'J'].includes(name)) input.appendField('A : Type').appendField(new B.FieldNumber(0, 0, Infinity, 1), 'A_LEVEL');
        if (name === 'ind_sigma') input.appendField('B(a) : Type').appendField(new B.FieldNumber(0, 0, Infinity, 1), 'B_LEVEL');
        this.setOutput(true, null); this.setColour('#d7ccc8');
        this.setTooltip(() => global.MLTT.showVal([], global.MLTT.infer([], global.MLTT.eliminatorTerm(name, undefined,
          [Number(this.getFieldValue('A_LEVEL') || 0), Number(this.getFieldValue('B_LEVEL') || 0)]))));
      },
    };
  }

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
          [workshopText('公理', 'Axiom'), 'axiom'],
          [workshopText('定理', 'Theorem'), 'definition'],
        ], function(value) {
          const block = this.getSourceBlock();
          if (block) block.updateDeclarationShape(value);
          return value;
        }), 'KIND')
        .appendField(new B.FieldTextInput('mySymbol'), 'NAME');
      this.appendValueInput('TYPE').appendField(':');
      this.appendValueInput('VALUE').appendField(':=');
      this.setColour('#7b6aa8');
      this.updateDeclarationShape('axiom');
      this.setTooltip(workshopText('公理填写类型；定理还需要提供符合类型的构造。使用的公理会显示在检查结果中。', 'An axiom supplies a type; a theorem also supplies a checked construction. Axiom dependencies are tracked.'));
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
      this.appendValueInput('DOM')
        .appendField('Π (')
        .appendField(nameField('x'), 'XNAME')
        .appendField(':');
      this.appendDummyInput('PARAM_END').appendField(')');
      this.appendEndRowInput('TYPE_BREAK').setVisible(false);
      this.appendValueInput('BODY').appendField('→');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.piTooltip'));
    },
    refreshTypeLayout() {
      const width = this.inputList.filter(input => input.name !== 'TYPE_BREAK').reduce((sum, input) => sum + input.fieldRow.reduce((n, field) =>
        n + field.getSize().width + 8, 0) + (input.connection?.targetBlock()?.getHeightWidth().width || 24), 28);
      const viewWidth = this.workspace.getMetrics()?.viewWidth || 800;
      const inline = width <= Math.min(480, Math.max(260, viewWidth * 0.7));
      if (!this.inputsInline) this.setInputsInline(true);
      const lineBreak = this.getInput('TYPE_BREAK');
      if (lineBreak.isVisible() === inline) {
        lineBreak.setVisible(!inline);
        if (this.rendered) this.render();
      }
    }
  };

  // Sigma
  B.Blocks['tt_sigma'] = {
    init() {
      declareBinder(this, { BODY: 'x' });
      this.appendValueInput('DOM')
        .appendField('Σ (')
        .appendField(nameField('x'), 'XNAME')
        .appendField(':');
      this.appendDummyInput('PARAM_END').appendField(')');
      this.appendEndRowInput('TYPE_BREAK').setVisible(false);
      this.appendValueInput('BODY').appendField('×');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.sigmaTooltip'));
    },
    refreshTypeLayout() { B.Blocks.tt_pi.refreshTypeLayout.call(this); },
  };

  // Keep each label and its value in one row, without external-input cutouts.
  function inlineRows(block) {
    const inputs = [...block.inputList];
    inputs.forEach((input, i) => {
      if (!input.connection || i === inputs.length - 1) return;
      const name = 'ROW_END_' + input.name;
      const lineBreak = block.appendEndRowInput(name);
      block.moveNumberedInputBefore(block.inputList.indexOf(lineBreak), block.inputList.indexOf(inputs[i + 1]));
    });
    block.setInputsInline(true);
  }

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
      inlineRows(this);
      this.setOutput(true, null);
      this.setTooltip(() => t('block.letTooltip'));
    }
  };

  // Given (level context)
  B.Blocks['tt_given'] = {
    init() {
      const givens = (typeof window !== 'undefined' && window.GAME_GIVENS) || [];
      const opts = givens.length
        ? givens.map((g, i) => [g.name || g.label.split(':')[0].trim(), String(i)])
        : [['∅', '0']];
      const f = new B.FieldDropdown(opts);
      this.appendDummyInput().appendField(f, 'IDX');
      this.setOutput(true, null);
      this.setColour('#d7ccc8');
      this.setTooltip(() => givens[Number(this.getFieldValue('IDX'))]?.label || t('block.givenTooltip'));
    }
  };

  // problems.js installs the unified tt_problem and legacy tt_answer definitions.

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
