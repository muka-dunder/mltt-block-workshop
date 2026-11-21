/* Context declarations and inference premises have separate editing commands. */
(function (global) {
  'use strict';
  const B = global.Blockly, { frozen } = global.BlockSequence;
  const text = (zh, en) => global.I18N.locale === 'zh-CN' ? zh : en;
  const editable = block => !!block && !block.workspace.isFlyout && block.isEditable() && !frozen(block);
  const isRule = block => ['tt_rule_app', 'tt_rule_judgments'].includes(block?.type);

  function contextTarget(block) {
    for (let child = block; child; child = child.getParent()) {
      if (child.ttContexts) return { host: child, list: child.ttContexts };
    }
    return null;
  }
  function premiseTarget(block) {
    if (isRule(block)) return { host: block, list: block.ttSequences.premise };
    let child = block;
    for (let parent = child?.getParent(); parent; child = parent, parent = parent.getParent()) {
      if (isRule(parent) && parent.sequenceChildren().includes(child)) return { host: parent, list: parent.ttSequences.premise };
    }
    return null;
  }
  function removable(list, index) {
    return editable(list.block) && !list.children().slice(index).some(child => child && frozen(child));
  }
  function deleteMenu(list, kind, event) {
    const options = list.children().map((child, index) => ({
      text: text('第 ' + (index + 1) + ' 个' + kind.zh, kind.en + ' ' + (index + 1)) +
        (child ? ' · ' + child.toString(48) : text(' · 空位', ' · empty slot')),
      enabled: removable(list, index),
      callback: () => { if (removable(list, index)) list.remove(index); },
    }));
    // Let the original menu close before opening the position selector.
    setTimeout(() => {
      if (list.block.workspace?.getBlockById(list.block.id) === list.block) B.ContextMenu.show(event, options, list.block.RTL, list.block.workspace);
    }, 0);
  }
  const kinds = [
    { id: 'context', zh: '上下文', en: 'Context entry', target: contextTarget },
    { id: 'premise', zh: '前提', en: 'Premise', target: premiseTarget },
  ];
  for (const kind of kinds) {
    for (const action of ['add', 'remove']) {
      B.ContextMenuRegistry.registry.register({
        id: 'mltt_' + kind.id + '_' + action,
        scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 30 + kinds.indexOf(kind),
        displayText: () => action === 'add' ? text('添加' + kind.zh, 'Add ' + kind.en.toLowerCase())
          : text('删除' + kind.zh + '…', 'Remove ' + kind.en.toLowerCase() + '…'),
        preconditionFn: ({ block }) => {
          const target = kind.target(block);
          if (!target || block.workspace.isFlyout) return 'hidden';
          const { host, list } = target;
          if (action === 'add') return editable(host) && (list.count < 64) ? 'enabled' : 'disabled';
          return list.children().some((_, index) => removable(list, index)) ? 'enabled' : 'disabled';
        },
        callback: ({ block }, event) => {
          const target = kind.target(block);
          if (!target) return;
          const { list, host } = target;
          if (action === 'remove') { deleteMenu(list, kind, event); return; }
          if (!editable(host)) return;
          list.add();
        },
      });
    }
  }
  for (const [action, delta] of [['previous', -1], ['next', 1]]) {
    B.ContextMenuRegistry.registry.register({
      id: 'mltt_sequence_' + action, scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 33,
      displayText: ({ block }) => {
        const context = global.BlockSequence.selection(block)?.list.spec.kind === 'context';
        return text('将此' + (context ? '上下文' : '前提') + (delta < 0 ? '前移' : '后移'),
          'Move ' + (context ? 'context entry' : 'premise') + (delta < 0 ? ' earlier' : ' later'));
      },
      preconditionFn: ({ block }) => {
        const selected = global.BlockSequence.selection(block);
        if (!selected || selected.direct) return 'hidden';
        const { owner, list, index } = selected, other = index + delta;
        return editable(owner) && other >= 0 && other < list.count &&
          !frozen(list.children()[index]) && !frozen(list.children()[other]) ? 'enabled' : 'disabled';
      },
      callback: ({ block }) => {
        const selected = global.BlockSequence.selection(block);
        if (selected) selected.list.move(selected.index, delta);
      },
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
