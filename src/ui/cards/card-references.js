/** Remove instances without deleting the surrounding construction. */
export function removeCardBlocks(workspace, ids) {
  if (!workspace || workspace.isFlyout) return 0;
  const removed = ids instanceof Set ? ids : new Set(ids);
  const blocks = workspace.getBlocksByType('tt_card', false)
    .filter(block => removed.has(block.getFieldValue('CARD')));
  if (!blocks.length) return 0;
  const events = window.Blockly.Events;
  const group = events.getGroup();
  events.setGroup(true);
  try {
    window.BlockFreeze.withChanges(workspace, () => {
      for (const block of blocks) block.dispose(false);
    });
  } finally { events.setGroup(group || false); }
  // A library deletion must not be undone into dangling card instances.
  workspace.clearUndo();
  return blocks.length;
}

/** Return a cleaned copy; the original session and its notes remain untouched. */
export function cleanCardSession(session, ids) {
  if (!session) return session;
  const removed = ids instanceof Set ? ids : new Set(ids);
  const result = structuredClone(session);
  function cleanBlock(block) {
    if (!block || (block.type === 'tt_card' && removed.has(block.fields?.CARD))) return null;
    for (const [name, connection] of Object.entries(block.inputs || {})) {
      cleanConnection(connection);
      if (!connection.block && !connection.shadow) delete block.inputs[name];
    }
    if (block.next) {
      cleanConnection(block.next);
      if (!block.next.block && !block.next.shadow) delete block.next;
    }
    return block;
  }
  function cleanConnection(connection) {
    for (const key of ['block', 'shadow']) {
      if (connection[key] && !cleanBlock(connection[key])) delete connection[key];
    }
  }
  function clean(current) {
    const roots = current.workspace?.blocks?.blocks;
    if (Array.isArray(roots)) current.workspace.blocks.blocks = roots.map(cleanBlock).filter(Boolean);
    if (Array.isArray(current.cards)) current.cards = current.cards.filter(card => !removed.has(card.id));
    if (current.answerState?.originalWork) clean(current.answerState.originalWork);
  }
  clean(result);
  return result;
}
