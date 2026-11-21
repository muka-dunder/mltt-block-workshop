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
    const list = { block, spec, count: 0 };
    block.ttSequences ||= {};
    block.ttSequences[spec.kind || 'premise'] = list;
    list.children = () => Array.from({ length: list.count }, (_, i) => block.getInputTargetBlock(spec.name(i)));
    list.setCount = (value, record = false) => {
      const desired = count(value, list.count);
      const update = () => {
        while (list.count < desired) {
          const i = list.count++, input = block.appendValueInput(spec.name(i));
          if (spec.check) input.setCheck(spec.check);
          if (i) input.appendField(',');
          block.appendEndRowInput(spec.breakName(i));
          if (spec.before) {
            block.moveInputBefore(spec.name(i), spec.before);
            block.moveInputBefore(spec.breakName(i), spec.before);
          }
        }
        while (list.count > desired) {
          const i = --list.count, child = block.getInputTargetBlock(spec.name(i));
          if (child) { child.unplug(); child.moveBy(30, 30); }
          block.removeInput(spec.name(i)); block.removeInput(spec.breakName(i));
        }
        list.refresh();
      };
      if (record) mutation(block, update); else update();
      return true;
    };
    list.setItems = items => {
      const old = list.children();
      if (old.some((child, i) => child && frozen(child) && items[i] !== child)) return false;
      mutation(block, () => {
        for (const child of old) if (child && !frozen(child)) child.unplug();
        list.setCount(items.length);
        items.forEach((child, i) => {
          if (child && block.getInputTargetBlock(spec.name(i)) !== child) block.getInput(spec.name(i)).connection.connect(child.outputConnection);
        });
        list.refresh();
      });
      return true;
    };
    list.add = (index = list.count) => {
      if (!editable(block) || list.count >= 64) return false;
      const items = list.children(); items.splice(Math.max(0, Math.min(index, items.length)), 0, null);
      return list.setItems(items);
    };
    list.remove = (index = list.count - 1) => {
      if (!editable(block) || index < 0 || index >= list.count) return false;
      const items = list.children(), child = items[index];
      if (child && frozen(child)) return false;
      items.splice(index, 1);
      if (!list.setItems(items)) return false;
      if (child) child.moveBy(30, 30);
      return true;
    };
    list.move = (index, delta) => {
      if (!editable(block) || index < 0 || index + delta < 0 || index + delta >= list.count) return false;
      const items = list.children();
      [items[index], items[index + delta]] = [items[index + delta], items[index]];
      return list.setItems(items);
    };
    list.refresh = () => {
      if (!block.workspace || block.workspace.getBlockById(block.id) !== block) return;
      if (spec.empty) block.getField(spec.empty)?.setVisible(list.count === 0);
      const limit = Math.min(600, Math.max(220, (block.workspace.getMetrics?.()?.viewWidth || 800) * 0.7));
      let width = 0;
      for (let i = 0; i < list.count; i++) {
        const child = block.getInputTargetBlock(spec.name(i));
        const nextWidth = child ? child.getHeightWidth().width + 20 : 40;
        const wrap = i + 1 < list.count && width + nextWidth +
          (block.getInputTargetBlock(spec.name(i + 1))?.getHeightWidth().width || 40) > limit;
        const input = block.getInput(spec.breakName(i));
        const visible = i + 1 === list.count ? !!spec.endRow : wrap;
        if (input.isVisible() !== visible) input.setVisible(visible);
        width = visible ? 0 : width + nextWidth;
      }
      if (block.rendered) block.render();
    };
    block.refreshSequenceLayout = () => { for (const sequence of Object.values(block.ttSequences)) sequence.refresh(); };
    const originalSave = block.saveExtraState, originalLoad = block.loadExtraState;
    block.saveExtraState = function () { return { ...originalSave?.call(this), [spec.state]: list.count }; };
    block.loadExtraState = function (state = {}) {
      originalLoad?.call(this, state);
      list.setCount(count(state[spec.state], spec.initial));
    };
    block.mutationToDom = function () {
      const node = B.utils.xml.createElement('mutation');
      node.setAttribute('sequence', JSON.stringify(this.saveExtraState())); return node;
    };
    block.domToMutation = function (node) { this.loadExtraState(JSON.parse(node.getAttribute('sequence') || '{}')); };
    list.setCount(spec.initial);
    if (spec.kind === 'context') {
      block.ttContexts = list;
      block.contextChildren = list.children;
    } else {
      block.ttSequence = spec;
      Object.defineProperty(block, 'ttItemCount', { get: () => list.count });
      block.sequenceChildren = list.children; block.setSequenceCount = list.setCount;
      block.setSequenceItems = list.setItems; block.addSequenceItem = list.add;
      block.removeSequenceItem = list.remove; block.moveSequenceItem = list.move;
    }
    return list;
  }

  function installContexts(block, before) {
    return install(block, { kind: 'context', name: i => 'CONTEXT' + i, breakName: i => 'CONTEXT_ITEM_END' + i,
      check: 'ContextDeclaration', state: 'contextCount', initial: 1, empty: 'EMPTY_CONTEXT', before });
  }
  function selection(block) {
    let child = block;
    for (let parent = child?.getParent(); parent; child = parent, parent = parent.getParent()) {
      for (const list of Object.values(parent.ttSequences || {})) {
        const index = list.children().indexOf(child);
        if (index >= 0) return { owner: parent, list, index, direct: false };
      }
    }
    return null;
  }
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
  global.BlockSequence = { install, installContexts, selection, frozen };
})(typeof window !== 'undefined' ? window : globalThis);
