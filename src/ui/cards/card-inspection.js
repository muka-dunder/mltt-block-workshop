/** Inspect a declaration through the ordinary judgment checker and its scopes. */
export function inspectCardSelection(declaration, selected, dependencies) {
  const M = window.MLTT;
  const root = {
    type: 'tt_problem', id: '__card_inspection', entryVersion: 2,
    inputs: { TERM: { type: 'tt_judgment', id: '__card_inspection_judgment', contextCount: 0,
      inputs: { TYPE: declaration.inputs?.TYPE,
        TERM: declaration.inputs?.VALUE || { type: 'tt_hole', id: '__card_inspection_hole' } } } },
  };
  const declarations = dependencies.filter(card => card.id !== declaration.id).map(card => card.declaration || card);
  const result = M.inspectWorkshop({ givens: [], entry: true }, root, declarations, selected.id, selected);
  if (selected.id === declaration.id && declaration.inputs?.TYPE) {
    try {
      const type = M.elabBlock(declaration.inputs.TYPE, [], { symbols: result.symbols });
      M.sortOf([], type);
      result.selectedType = M.showVal([], M.evalTm([], type));
      delete result.selectedError;
    } catch (error) { result.selectedError = error; }
  }
  return result;
}
