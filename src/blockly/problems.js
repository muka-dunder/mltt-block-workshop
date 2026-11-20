/* Checking containers have the same structure in preset and authored canvases. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  const text = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;
  const problem = {
    init() {
      this.ttEntryVersion = 2;
      this.appendEndRowInput('TITLE').appendField(text('题目', 'Problem'))
        .appendField(new B.FieldTextInput(text('我的题目', 'My problem')), 'NAME');
      this.appendValueInput('TERM');
      this.setInputsInline(true); this.setColour('#c7b6e2');
      this.setTooltip(() => text('把要检查的卡片放入入口。冻结的积木不能编辑或从父元素拆开。',
        'Place a card in the checking entry. Frozen blocks cannot be edited or detached.'));
    },
    setProblemLocked(locked) {
      this.ttProblemLocked = !!locked;
      if (global.BlockFreeze) global.BlockFreeze.setFrozen(this, locked);
      else { this.setEditable(!locked); this.setMovable(!locked); this.setDeletable(!locked); }
    },
    // Old metadata is read for migration; new containers never declare hidden variables.
    configureProblemContext(binders = [], context = []) { this.ttLegacyProblemState = { binders, context }; },
    saveExtraState() { return { entryVersion: this.ttEntryVersion }; },
    loadExtraState(state = {}) {
      this.ttEntryVersion = state.entryVersion === 2 ? 2 : 1;
      this.ttLegacyProblemState = state;
    },
    mutationToDom() {
      const mutation = B.utils.xml.createElement('mutation');
      mutation.setAttribute('problem', JSON.stringify(this.saveExtraState())); return mutation;
    },
    domToMutation(node) {
      const state = node.getAttribute('problem');
      if (state) this.loadExtraState(JSON.parse(state));
    },
  };
  B.Blocks.tt_problem = problem;
  B.Blocks.tt_answer = problem;

  B.Blocks.tt_requirement_type = {
    init() {
      this.appendValueInput('TYPE').appendField(text('构造项：类型', 'Construct a term of type'));
      this.setOutput(true, 'CheckRequirement'); this.setColour('#8cb3d6');
      this.setTooltip(() => text('提交一个具有此类型的项。', 'Submit a term of this type.'));
    },
  };
  B.Blocks.tt_requirement_infer = {
    init() {
      this.appendValueInput('EXPR').appendField(text('推断类型：项', 'Infer the type of'));
      this.setOutput(true, 'CheckRequirement'); this.setColour('#8cb3d6');
      this.setTooltip(() => text('提交这里给出的项的类型。', 'Submit the type of the given term.'));
    },
  };
  B.Blocks.tt_requirement_derivation = {
    init() {
      this.appendDummyInput('KIND').appendField(text('补全推导', 'Complete a derivation'))
        .appendField(new B.FieldDropdown([[text('函数应用', 'Function application'), 'application'],
          [text('任意推导', 'Any derivation'), 'any']]), 'RULE_KIND');
      this.appendValueInput('TYPE').appendField(text('结论类型', 'Conclusion type'));
      this.setOutput(true, 'CheckRequirement'); this.setColour('#8cb3d6');
      this.setTooltip(() => text('提交推导卡，使其结论具有指定类型。', 'Submit an inference card with the specified conclusion type.'));
    },
  };
  const registry = B.ContextMenuRegistry.registry, menuId = 'mltt_requirement_details';
  if (registry.getItem(menuId)) registry.unregister(menuId);
  registry.register({ id: menuId, scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 45,
    displayText: scope => scope.block.isCollapsed() ? text('展开检查要求', 'Expand requirement') : text('收起检查要求', 'Collapse requirement'),
    preconditionFn: scope => scope.block && !scope.block.workspace.isFlyout &&
      ['tt_requirement_type', 'tt_requirement_infer', 'tt_requirement_derivation'].includes(scope.block.type) ? 'enabled' : 'hidden',
    callback: scope => scope.block.setCollapsed(!scope.block.isCollapsed()) });
})(typeof window !== 'undefined' ? window : globalThis);
