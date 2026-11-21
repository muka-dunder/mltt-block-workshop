/** Keep Blockly's original control nodes interactive above HTML canvas notes. */
export function installControlLayer(workspace, host) {
  const svg = workspace.getParentSvg();
  const controls = new Set([...svg.querySelectorAll('.blocklyZoom')].map(node => node.parentElement));
  for (const node of svg.querySelectorAll('.blocklyTrash')) controls.add(node);
  if (!controls.size) return;
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.classList.add('canvas-control-layer');
  for (const node of controls) { node.classList.add('canvas-native-control'); layer.append(node); }
  host.parentElement.append(layer);
  const position = () => {
    const rect = host.getBoundingClientRect(), parent = host.parentElement.getBoundingClientRect();
    Object.assign(layer.style, { left: rect.left - parent.left + 'px', top: rect.top - parent.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px' });
  };
  new ResizeObserver(position).observe(host);
  position();
}
