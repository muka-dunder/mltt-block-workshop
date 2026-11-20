/* Inference-rule blocks retain judgments above and below a real rule bar. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  if (!B) return;
  const text = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;

  class FieldRuleBar extends B.Field {
    constructor() {
      super('');
      this.EDITABLE = false;
      this.SERIALIZABLE = false;
      this.size_ = new B.utils.Size(280, 14);
    }
    initView() {
      this.ruleLine_ = B.utils.dom.createSvgElement('line', {
        x1: 0, y1: 7, x2: 280, y2: 7,
        stroke: '#173b35', 'stroke-width': 2,
        class: 'tt-rule-line', 'pointer-events': 'none',
      }, this.fieldGroup_);
    }
    render_() {
      const width = this.getSourceBlock()?.workspace.isFlyout ? 180 : 280;
      this.size_ = new B.utils.Size(width, 14);
      if (this.ruleLine_) this.ruleLine_.setAttribute('x2', String(width));
    }
    getText_() { return ''; }
  }

  function initApplicationRule() {
      this.appendValueInput('CONTEXT').setCheck('Context').appendField('Γ', 'CONTEXT_LABEL');
      this.appendEndRowInput('CONTEXT_END');
      this.appendDummyInput('BAR_ROW').appendField(new FieldRuleBar(), 'BAR');
      this.appendValueInput('RULE').setCheck('InferenceRule');
      this.appendEndRowInput('RULE_END');
      this.appendValueInput('RESULT');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour('#91c5b7');
      global.BlockSequence.install(this, { name: i => i === 0 ? 'F' : i === 1 ? 'A' : 'P' + i,
        breakName: i => 'PREMISE_END' + i, before: 'BAR_ROW', state: 'premiseCount', initial: 2, endRow: true });
      Object.defineProperty(this, 'ttPremiseCount', { get: () => this.ttItemCount });
      let timer;
      this.setOnChange(event => {
        if (event.isUiEvent || this.workspace?.isFlyout) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (this.workspace?.getBlockById(this.id) !== this) return;
          this.getField('CONTEXT_LABEL')?.setVisible(!this.getInputTargetBlock('CONTEXT'));
          this.refreshSequenceLayout();
        }, 80);
      });
      this.setTooltip(() => text(
        '横线上方放前提，右侧放规则，下方放结论。右键增删或调整前提顺序；所选规则会检查前提数量。顶部条件可留空以继承外层条件。',
        'Place premises above the bar, the rule beside it, and the conclusion below. Right-click to change the premise list; the rule checks its arity. An empty context inherits outer conditions.'
      ));
  }

  B.Blocks['tt_rule_app'] = {
    init() { initApplicationRule.call(this); },
    setPremiseCount(value) { return global.BlockSequence.frozen(this) ? false : this.setSequenceCount(value); },
    addPremise(index) { return this.addSequenceItem(index); },
    removePremise(index) { return this.removeSequenceItem(index); },
    movePremise(index, delta) { return this.moveSequenceItem(index, delta); },
  };
  // Keep old saved workspaces and shared URLs readable; only the unified card is offered.
  B.Blocks['tt_rule_judgments'] = B.Blocks['tt_rule_app'];
  B.Blocks['tt_rule_pi_elim'] = {
    init() {
      this.appendDummyInput().appendField('Π-elim');
      this.setOutput(true, 'InferenceRule');
      this.setColour('#e0bd72');
      this.setTooltip(() => text('函数应用规则：从 f : A → B 和 x : A 得到 f x : B。', 'Application: from f : A → B and x : A obtain f x : B.'));
    },
  };
  B.Blocks['tt_rule_theorem'] = {
    init() {
      this.appendValueInput('THEOREM').appendField(text('应用定理', 'Apply theorem'));
      this.setOutput(true, 'InferenceRule');
      this.setColour('#e0bd72');
      this.setTooltip(() => text('放入一个接受两个参数的定理或函数；上方两个前提作为它的参数。定理来自假设时会记录依赖。', 'Insert a theorem or function with two arguments. The premises supply those arguments; assumptions are tracked.'));
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
