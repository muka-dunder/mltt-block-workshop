/* Judgment layout changes preserve inputs, fields, and lexical identities. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  const text = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;
  const modes = ['auto', 'inline', 'stacked'];

  function estimatedWidth(block) {
    let width = 28;
    for (const input of block.inputList) {
      if (input.name.startsWith('LAYOUT_BREAK_') || !input.isVisible()) continue;
      for (const field of input.fieldRow) width += Math.max(12,
        block.rendered ? field.getSize().width + 8 : String(field.getText()).length * 8 + 8);
      const child = input.connection?.targetBlock();
      if (child) width += child.getHeightWidth().width + 10;
      else if (input.connection) width += 24;
    }
    return width;
  }

  function applyLayout(block) {
    if (!block.workspace || block.workspace.getBlockById(block.id) !== block || block.ttRootRule) return;
    if (!block.ttContextDisplay) block.getField('CTX')?.setVisible(!block.getInputTargetBlock('CONTEXT'));
    const viewWidth = block.workspace.isFlyout ? 800 : block.workspace.getMetrics()?.viewWidth || 800;
    const threshold = Math.min(420, Math.max(220, viewWidth * 0.55));
    const stacked = block.ttLayout === 'stacked' || (block.ttLayout === 'auto' && estimatedWidth(block) > threshold);
    let changed = false;
    for (const input of block.inputList) {
      if (!input.name.startsWith('LAYOUT_BREAK_')) continue;
      if (input.isVisible() !== stacked) { input.setVisible(stacked); changed = true; }
    }
    if (!block.inputsInline) block.setInputsInline(true);
    if (changed && block.rendered) block.render();
  }

  function installLayout(block) {
    block.ttLayout = 'auto';
    block.ttRootRule = block.type === 'tt_answer' && !!global.GAME_ROOT_RULE;
    block.saveExtraState = function () { return { layout: this.ttLayout }; };
    block.loadExtraState = function (state) { this.setJudgmentLayout(state?.layout || 'auto', false); };
    block.mutationToDom = function () {
      const node = B.utils.xml.createElement('mutation');
      node.setAttribute('layout', this.ttLayout);
      return node;
    };
    block.domToMutation = function (node) { this.setJudgmentLayout(node.getAttribute('layout') || 'auto', false); };
    block.setJudgmentLayout = function (mode, record = true) {
      if (!modes.includes(mode)) mode = 'auto';
      const previous = B.Xml.domToText(this.mutationToDom());
      const changed = this.ttLayout !== mode;
      this.ttLayout = mode;
      applyLayout(this);
      if (changed && record && B.Events.isEnabled()) {
        B.Events.fire(new B.Events.BlockChange(this, 'mutation', null, previous, B.Xml.domToText(this.mutationToDom())));
      }
    };
    let timer;
    block.setOnChange(function (event) {
      if (this.workspace?.isFlyout || event.isUiEvent) return;
      if (![B.Events.BLOCK_CHANGE, B.Events.BLOCK_MOVE, B.Events.BLOCK_CREATE, B.Events.BLOCK_DELETE].includes(event.type)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (this.workspace?.getBlockById(this.id) === this && !this.workspace.isDragging()) applyLayout(this);
      }, 80);
    });
    applyLayout(block);
  }

  B.Blocks.tt_judgment = {
    init() {
      this.appendValueInput('CONTEXT').setCheck('Context').appendField(new B.FieldLabel('Γ'), 'CTX');
      this.appendEndRowInput('LAYOUT_BREAK_CONTEXT');
      this.appendDummyInput('TURNSTILE').appendField('⊢');
      this.appendEndRowInput('LAYOUT_BREAK_TURNSTILE');
      this.appendValueInput('TERM');
      this.appendValueInput('TYPE').appendField(':');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour('#d1c4e9');
      this.setTooltip(() => text('在给定条件下构造一个项。右键可选择自动、单行或分行排版。', 'Construct a term in its context. Right-click to choose automatic, inline, or stacked layout.'));
      installLayout(this);
      const saveLayout = this.saveExtraState, loadLayout = this.loadExtraState;
      this.saveExtraState = function () {
        return { ...saveLayout.call(this), context: this.ttJudgmentContext || null };
      };
      this.loadExtraState = function (state) {
        loadLayout.call(this, state);
        if (state?.context) this.configureJudgmentContext(state.context.binders, state.context.lines, state.context.uids);
      };
    },
    configureJudgmentContext(binders = [], lines = [], uids = []) {
      this.ttJudgmentContext = { binders, lines, uids };
      this.ttContextDisplay = true;
      for (const input of [...this.inputList]) if (input.name.startsWith('LOCAL_CONTEXT_')) this.removeInput(input.name);
      this.ttBinds = { TERM: uids, TYPE: uids }; this.ttNameFields = {};
      this.getField('CTX').setValue(lines.join(', ') || (binders.length ? '' : 'Γ'));
      this.getInput('CONTEXT').setVisible(lines.length > 0 || binders.length === 0);
      binders.forEach((binder, i) => {
        const Field = global.FieldLocalVar || B.FieldTextInput;
        const field = new Field(binder.name);
        this.appendDummyInput('LOCAL_CONTEXT_' + i).appendField(field, 'BNAME' + i)
          .appendField(' : ' + binder.tyText);
        this.ttNameFields[uids[i]] = 'BNAME' + i;
        this.moveInputBefore('LOCAL_CONTEXT_' + i, 'LAYOUT_BREAK_CONTEXT');
        field.EDITABLE = false; field.updateEditable();
      });
      if (this.rendered) this.render();
    },
  };

  const registry = B.ContextMenuRegistry.registry;
  for (const mode of modes) {
    const id = 'mltt_judgment_layout_' + mode;
    if (registry.getItem(id)) registry.unregister(id);
    registry.register({
      id, scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 40 + modes.indexOf(mode),
      displayText: scope => {
        const labels = { auto: text('自动', 'Automatic'), inline: text('单行', 'Inline'), stacked: text('分行', 'Stacked') };
        return (scope.block?.ttLayout === mode ? '✓ ' : '') + text('布局：', 'Layout: ') + labels[mode];
      },
      preconditionFn: scope => scope.block && !scope.block.workspace.isFlyout &&
        scope.block.type === 'tt_judgment' && !scope.block.ttRootRule ? 'enabled' : 'hidden',
      callback: scope => scope.block.setJudgmentLayout(mode),
    });
  }
  global.JudgmentLayout = { install: installLayout, refresh: applyLayout };
  let resizeTimer;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const workspace = B.common.getMainWorkspace();
      if (workspace && !workspace.isDragging()) for (const block of workspace.getAllBlocks(false)) {
        if (block.ttLayout === 'auto') applyLayout(block);
      }
    }, 80);
  });
})(typeof window !== 'undefined' ? window : globalThis);
