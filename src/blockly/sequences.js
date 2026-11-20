/* Ordered slots share editing, persistence, and lexical declaration identities. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  const text = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;
  const frozen = block => global.BlockFreeze?.isFrozen?.(block) ||
    block && !block.isEditable() && !block.isMovable() && !block.isDeletable();
  const editable = block => block && !block.workspace.isFlyout && block.isEditable() && !frozen(block);

  function mutation(block, update) {
    const group = B.Events.getGroup();
    if (!group) B.Events.setGroup(true);
    try {
      const previous = B.Xml.domToText(block.mutationToDom());
      update();
      if (block.rendered) block.render();
      const next = B.Xml.domToText(block.mutationToDom());
      if (previous !== next && B.Events.isEnabled()) {
        B.Events.fire(new B.Events.BlockChange(block, 'mutation', null, previous, next));
      }
    } finally { if (!group) B.Events.setGroup(false); }
  }

  function count(value, fallback = 0) {
    return Number.isInteger(value) && value >= 0 && value <= 64 ? value : fallback;
  }

  function install(block, spec) {
    block.ttSequence = spec;
    block.ttItemCount = 0;
    block.sequenceChildren = function () {
      return Array.from({ length: this.ttItemCount }, (_, i) => this.getInputTargetBlock(spec.name(i)));
    };
    block.setSequenceCount = function (value, record = false) {
      const desired = count(value, this.ttItemCount);
      const update = () => {
        while (this.ttItemCount < desired) {
          const i = this.ttItemCount++;
          const input = this.appendValueInput(spec.name(i));
          if (spec.check) input.setCheck(spec.check);
          if (i) input.appendField(',');
          this.appendEndRowInput(spec.breakName(i));
          if (spec.before) {
            this.moveInputBefore(spec.name(i), spec.before);
            this.moveInputBefore(spec.breakName(i), spec.before);
          }
        }
        while (this.ttItemCount > desired) {
          const i = --this.ttItemCount, child = this.getInputTargetBlock(spec.name(i));
          if (child) { child.unplug(); child.moveBy(30, 30); }
          this.removeInput(spec.name(i)); this.removeInput(spec.breakName(i));
        }
        this.refreshSequenceLayout();
      };
      if (record) mutation(this, update); else update();
      return true;
    };
    block.setSequenceItems = function (items) {
      const old = this.sequenceChildren();
      if (old.some((child, i) => child && frozen(child) && items[i] !== child)) return false;
      mutation(this, () => {
        for (const child of old) if (child && !frozen(child)) child.unplug();
        this.setSequenceCount(items.length);
        items.forEach((child, i) => {
          if (child && this.getInputTargetBlock(spec.name(i)) !== child) this.getInput(spec.name(i)).connection.connect(child.outputConnection);
        });
        this.refreshSequenceLayout();
      });
      return true;
    };
    block.addSequenceItem = function (index = this.ttItemCount) {
      if (!editable(this) || this.ttItemCount >= 64) return false;
      const items = this.sequenceChildren(); items.splice(Math.max(0, Math.min(index, items.length)), 0, null);
      return this.setSequenceItems(items);
    };
    block.removeSequenceItem = function (index = this.ttItemCount - 1) {
      if (!editable(this) || index < 0 || index >= this.ttItemCount) return false;
      const items = this.sequenceChildren(), child = items[index];
      if (child && frozen(child)) return false;
      items.splice(index, 1);
      if (!this.setSequenceItems(items)) return false;
      if (child) child.moveBy(30, 30);
      return true;
    };
    block.moveSequenceItem = function (index, delta) {
      if (!editable(this) || index < 0 || index + delta < 0 || index + delta >= this.ttItemCount) return false;
      const items = this.sequenceChildren();
      [items[index], items[index + delta]] = [items[index + delta], items[index]];
      return this.setSequenceItems(items);
    };
    block.refreshSequenceLayout = function () {
      if (!this.workspace || this.workspace.getBlockById(this.id) !== this) return;
      const limit = Math.min(600, Math.max(220, (this.workspace.getMetrics?.()?.viewWidth || 800) * 0.7));
      let width = 0;
      for (let i = 0; i < this.ttItemCount; i++) {
        const child = this.getInputTargetBlock(spec.name(i));
        const nextWidth = child ? child.getHeightWidth().width + 20 : 40;
        const wrap = i + 1 < this.ttItemCount && width + nextWidth +
          (this.getInputTargetBlock(spec.name(i + 1))?.getHeightWidth().width || 40) > limit;
        const input = this.getInput(spec.breakName(i));
        if (!input) continue;
        const visible = i + 1 === this.ttItemCount ? !!spec.endRow : wrap;
        if (input.isVisible() !== visible) input.setVisible(visible);
        width = visible ? 0 : width + nextWidth;
      }
      if (this.rendered) this.render();
    };
    const originalSave = block.saveExtraState, originalLoad = block.loadExtraState;
    block.saveExtraState = function () {
      return { ...originalSave?.call(this), [spec.state]: this.ttItemCount };
    };
    block.loadExtraState = function (state = {}) {
      originalLoad?.call(this, state);
      this.setSequenceCount(count(state[spec.state], spec.initial));
    };
    block.mutationToDom = function () {
      const node = B.utils.xml.createElement('mutation');
      node.setAttribute('sequence', JSON.stringify(this.saveExtraState()));
      return node;
    };
    block.domToMutation = function (node) {
      const saved = node.getAttribute('sequence');
      this.loadExtraState(saved ? JSON.parse(saved) : {});
    };
    block.setSequenceCount(spec.initial);
  }

  function selection(block) {
    if (block?.ttSequence) return { owner: block, index: block.ttItemCount - 1, direct: true };
    let child = block;
    for (let parent = child?.getParent(); parent; child = parent, parent = parent.getParent()) {
      if (!parent.ttSequence) continue;
      const index = parent.sequenceChildren().indexOf(child);
      if (index >= 0) return { owner: parent, index, direct: false };
    }
    return null;
  }
  const registry = B.ContextMenuRegistry.registry;
  for (const [action, zh, en] of [['add', '添加一项', 'Add item'], ['remove', '删除这一项', 'Remove item'],
    ['previous', '将这一项前移', 'Move item earlier'], ['next', '将这一项后移', 'Move item later']]) {
    registry.register({
      id: 'mltt_sequence_' + action, scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 30,
      displayText: () => text(zh, en),
      preconditionFn: ({ block }) => {
        const selected = selection(block);
        if (!selected) return 'hidden';
        const { owner, index, direct } = selected;
        if (!editable(owner)) return 'disabled';
        if (action === 'add') return owner.ttItemCount < 64 ? 'enabled' : 'disabled';
        if (owner.ttItemCount === 0 || frozen(owner.sequenceChildren()[index])) return 'disabled';
        if (action === 'previous') return !direct && index > 0 ? 'enabled' : 'disabled';
        if (action === 'next') return !direct && index < owner.ttItemCount - 1 ? 'enabled' : 'disabled';
        return 'enabled';
      },
      callback: ({ block }) => {
        const selected = selection(block);
        if (!selected) return;
        const { owner, index } = selected;
        if (action === 'add') owner.addSequenceItem(index + 1);
        else if (action === 'remove') owner.removeSequenceItem(index);
        else owner.moveSequenceItem(index, action === 'previous' ? -1 : 1);
      },
    });
  }

  B.Blocks.tt_context = {
    init() {
      this.setInputsInline(true); this.setOutput(true, 'Context'); this.setColour('#cbbbdc');
      install(this, { name: i => 'ITEM' + i, breakName: i => 'ITEM_END' + i,
        check: 'ContextDeclaration', state: 'count', initial: 1 });
      let timer;
      this.setOnChange(event => {
        if (event.isUiEvent || this.workspace?.isFlyout) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (this.workspace?.getBlockById(this.id) === this) this.refreshSequenceLayout();
        }, 80);
      });
      this.setTooltip(() => text('条件按顺序声明名字；后面的类型和判断内容可以引用前面声明的名字。右键增删或调整顺序。',
        'Ordered declarations introduce names for later declarations and the judgment. Right-click to add, remove, or reorder.'));
    },
    setItemCount(value) { return frozen(this) ? false : this.setSequenceCount(value); },
    addItem(index) { return this.addSequenceItem(index); },
    removeItem(index) { return this.removeSequenceItem(index); },
    moveItem(index, delta) { return this.moveSequenceItem(index, delta); },
  };
  B.Blocks.tt_binding = {
    init() {
      this.ttBindingUid = 'b' + this.id + ':decl';
      this.ttBinds = { DECLARATION: [this.ttBindingUid] };
      this.ttNameFields = { [this.ttBindingUid]: 'NAME' };
      const Field = global.FieldLocalVar || B.FieldTextInput;
      const field = new Field('x');
      field.setValidator(value => String(value || 'x').trim().replace(/\s+/g, '').slice(0, 32) || 'x');
      this.appendValueInput('TYPE').appendField(field, 'NAME').appendField(':');
      this.setInputsInline(true); this.setOutput(true, 'ContextDeclaration'); this.setColour('#d7ccc8');
      this.setTooltip(() => text('声明一个局部名字及其类型。悬停名字可拖出引用。', 'Declare a local name and its type. Hover over the name to drag a reference.'));
    },
  };
  global.BlockSequence = { install, selection, frozen };
})(typeof window !== 'undefined' ? window : globalThis);
