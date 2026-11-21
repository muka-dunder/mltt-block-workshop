/** A floating window remains reachable while being moved or the viewport changes. */
export function installCardWindowDrag(element, { onMove, position } = {}) {
  const heading = element.querySelector('.card-editor-heading');
  let drag = null;
  function clamp() {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.left, Math.max(0, innerWidth - rect.width)));
    const y = Math.max(0, Math.min(rect.top, Math.max(0, innerHeight - rect.height)));
    element.style.left = x + 'px'; element.style.top = y + 'px';
    onMove?.();
  }
  element.style.left = (position?.x ?? Math.max(8, (innerWidth - Math.min(1100, innerWidth * .94)) / 2)) + 'px';
  element.style.top = (position?.y ?? Math.max(8, (innerHeight - Math.min(780, innerHeight * .9)) / 2)) + 'px';
  function down(event) {
    if (event.button !== 0 || event.target.closest('button,input,select,textarea,a')) return;
    const rect = element.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    heading.setPointerCapture(event.pointerId); event.preventDefault();
  }
  function move(event) {
    if (!drag || event.pointerId !== drag.id) return;
    element.style.left = drag.left + event.clientX - drag.x + 'px';
    element.style.top = drag.top + event.clientY - drag.y + 'px'; clamp();
  }
  function up(event) {
    if (drag?.id !== event.pointerId) return;
    if (heading.hasPointerCapture(event.pointerId)) heading.releasePointerCapture(event.pointerId);
    drag = null;
  }
  heading.addEventListener('pointerdown', down);
  heading.addEventListener('pointermove', move);
  heading.addEventListener('pointerup', up);
  heading.addEventListener('pointercancel', up);
  window.addEventListener('resize', clamp);
  return { clamp, dispose() {
    heading.removeEventListener('pointerdown', down); heading.removeEventListener('pointermove', move);
    heading.removeEventListener('pointerup', up); heading.removeEventListener('pointercancel', up);
    window.removeEventListener('resize', clamp);
  } };
}
