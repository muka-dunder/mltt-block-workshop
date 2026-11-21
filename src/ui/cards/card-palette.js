/** Both workbenches present the same two mathematical card categories. */
export function cardPaletteXml(cards, escape, makeButtons = false) {
  const zh = window.I18N.locale === 'zh-CN';
  let xml = '';
  for (const [kind, label] of [['axiom', zh ? '公理' : 'Axioms'], ['theorem', zh ? '定理' : 'Theorems']]) {
    xml += '<label text="' + label + '"></label>';
    if (makeButtons) xml += '<button text="' + (zh ? '＋ 制作' + (kind === 'axiom' ? '公理' : '定理') : '+ Make ' + (kind === 'axiom' ? 'axiom' : 'theorem')) +
      '" callbackKey="' + (kind === 'axiom' ? 'MAKE_AXIOM' : 'MAKE_THEOREM') + '"></button>';
    for (const card of cards.filter(card => card.kind === kind)) {
      xml += '<block type="tt_card"><field name="CARD">' + escape(card.id) + '</field></block>';
    }
  }
  return xml;
}
