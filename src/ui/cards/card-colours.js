// Category determines the hue; provenance determines the palette within it.
export function cardColour(card = {}) {
  if (card.kind === 'axiom') return card.preset ? '#e7c9ac' : '#edb85b';
  return card.preset ? '#c3b5e5' : '#86cbbd';
}
