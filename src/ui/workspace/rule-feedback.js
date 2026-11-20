/* Layout refresh never replaces writable slots with computed text. */
export function refreshRuleCards(workspace) {
  for (const type of ['tt_pi', 'tt_sigma']) {
    for (const block of workspace.getBlocksByType(type, false).reverse()) block.refreshTypeLayout();
  }
  for (const block of workspace.getAllBlocks(false).reverse()) block.refreshSequenceLayout?.();
  for (const block of workspace.getBlocksByType('tt_judgment', false)) {
    if (block.setJudgmentLayout) window.JudgmentLayout.refresh(block);
  }
}
