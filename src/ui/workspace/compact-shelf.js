/** Small screens use the existing flyout as an overlay drawer. */
export function installCompactShelf(workspace, { onChange, button = document.querySelector('#blocksToggle') } = {}) {
  const flyout = workspace.getFlyout();
  if (!button || !flyout) return { setLocale() {} };
  const media = matchMedia('(max-width: 600px)');
  const nativeShow = flyout.show;
  const nativeSetVisible = flyout.setVisible;
  let compact = media.matches, open = !compact, refreshing = false;
  let latestDefinition = [workspace.options.languageTree];

  function syncButton() {
    button.hidden = !compact;
    button.setAttribute('aria-expanded', String(compact && open));
  }
  function setLocale() {
    const zh = window.I18N.locale === 'zh-CN';
    button.textContent = zh ? '积木' : 'Blocks';
    button.title = zh ? '展开或收起积木工具箱' : 'Open or close the block drawer';
    syncButton();
  }
  flyout.setVisible = function (visible) {
    const changed = compact && open !== visible;
    if (!refreshing) open = compact ? visible : true;
    nativeSetVisible.call(this, visible);
    if (!refreshing) {
      syncButton();
      if (changed) onChange?.();
    }
  };
  flyout.show = function (...args) {
    // Toolbox updates rebuild its contents, but must not reopen a closed drawer.
    latestDefinition = args;
    const desired = compact ? open : true;
    refreshing = true;
    try {
      const result = nativeShow.apply(this, args);
      if (!desired) this.hide();
      return result;
    } finally { refreshing = false; syncButton(); }
  };
  function updateScreen() {
    compact = media.matches; open = !compact;
    flyout.setAutoClose(compact);
    if (compact) flyout.hide();
    else if (!flyout.isVisible()) flyout.show(...latestDefinition);
    syncButton();
    window.Blockly.svgResize(workspace);
    onChange?.();
  }
  const toggle = () => {
    if (open) flyout.hide();
    else {
      open = true;
      flyout.show(...latestDefinition);
      syncButton(); onChange?.();
    }
  };
  button.addEventListener('click', toggle);
  media.addEventListener('change', updateScreen);
  updateScreen(); setLocale();
  return { setLocale, dispose() { media.removeEventListener('change', updateScreen); button.removeEventListener('click', toggle); } };
}
