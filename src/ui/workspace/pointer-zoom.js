/** Keep the canvas point under the pointer fixed, including flyout reflow. */
export function installPointerZoom(workspace) {
  const svg = workspace.getParentSvg();
  svg.addEventListener('wheel', event => {
    if (event.target.closest?.('.blocklyFlyout') || !event.deltaY) return;
    event.preventDefault();
    event.stopPropagation();
    if (workspace.isDragging()) return;
    const pointer = new DOMPoint(event.clientX, event.clientY);
    const canvas = workspace.getCanvas();
    const anchor = pointer.matrixTransform(canvas.getScreenCTM().inverse());
    const local = pointer.matrixTransform(svg.getScreenCTM().inverse());
    const delta = Blockly.browserEvents.getScrollDeltaPixels(event);
    workspace.zoom(local.x, local.y, -delta.y / 50);
    const moved = anchor.matrixTransform(canvas.getScreenCTM());
    const x = workspace.scrollX + pointer.x - moved.x;
    const y = workspace.scrollY + pointer.y - moved.y;
    workspace.scroll(x, y);
    // Blockly clamps scrolling to content bounds, including an empty canvas.
    // Zoom must still retain its anchor when that point lies beyond those bounds.
    if (Math.abs(workspace.scrollX - x) > 0.01 || Math.abs(workspace.scrollY - y) > 0.01) {
      const metrics = workspace.getMetrics();
      workspace.scrollX = x; workspace.scrollY = y;
      workspace.translate(x + metrics.absoluteLeft, y + metrics.absoluteTop);
    }
  }, { capture: true, passive: false });
}
