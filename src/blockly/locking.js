/* Frozen blocks retain their parent connection and editable children keep working. */
(function (global) {
  'use strict';
  const B = global.Blockly;
  const nativeDeletable = B.Block.prototype.isDeletable;
  const allowed = new WeakMap();
  const isFrozen = block => !!block && !block.workspace?.isFlyout && !block.isOwnEditable() &&
    !block.isOwnMovable() && !block.isOwnDeletable();
  const internal = block => !block?.workspace || (allowed.get(block.workspace) || 0) > 0;
  function withChanges(workspace, action) {
    allowed.set(workspace, (allowed.get(workspace) || 0) + 1);
    try { return action(); }
    finally { allowed.set(workspace, allowed.get(workspace) - 1); }
  }
  function setFrozen(block, frozen) {
    block.setEditable(!frozen); block.setMovable(!frozen); block.setDeletable(!frozen);
  }
  function frozenChild(connection) {
    if (!connection?.targetConnection) return null;
    return connection.isSuperior() ? connection.targetBlock() : connection.getSourceBlock();
  }
  class FreezeChecker extends B.ConnectionChecker {
    doSafetyChecks(a, b) {
      const result = super.doSafetyChecks(a, b);
      if (result !== B.Connection.CAN_CONNECT || internal(a?.getSourceBlock())) return result;
      for (const connection of [a, b]) {
        if (connection.targetConnection && connection.targetConnection !== (connection === a ? b : a) &&
          isFrozen(frozenChild(connection))) return B.Connection.REASON_CHECKS_FAILED;
      }
      return result;
    }
  }
  B.registry.register(B.registry.Type.CONNECTION_CHECKER, 'mltt_freeze_checker', FreezeChecker);
  const disconnect = B.Connection.prototype.disconnect;
  B.Connection.prototype.disconnect = function () {
    if (!internal(this.getSourceBlock()) && isFrozen(frozenChild(this))) {
      throw new Error('Unfreeze this block before detaching it.');
    }
    return disconnect.call(this);
  };
  // Deleting a parent must not silently delete a frozen descendant.
  B.Block.prototype.isDeletable = function () {
    return nativeDeletable.call(this) && (internal(this) ||
      !this.getDescendants(false).some(child => child !== this && isFrozen(child)));
  };
  const registry = B.ContextMenuRegistry.registry;
  registry.register({
    id: 'mltt_lock_part', scopeType: B.ContextMenuRegistry.ScopeType.BLOCK, weight: 50,
    displayText: ({ block }) => global.I18N.locale === 'zh-CN'
      ? (isFrozen(block) ? '解冻这块积木' : '冻结这块积木')
      : (isFrozen(block) ? 'Unfreeze this block' : 'Freeze this block'),
    preconditionFn: ({ block }) => block && !block.workspace.isFlyout && global.__mltt?.custom?.active ? 'enabled' : 'hidden',
    callback: ({ block }) => {
      setFrozen(block, !isFrozen(block));
      global.__mltt.custom.scheduleSave();
    },
  });
  global.BlockFreeze = { isFrozen, setFrozen, withChanges };
})(typeof window !== 'undefined' ? window : globalThis);
