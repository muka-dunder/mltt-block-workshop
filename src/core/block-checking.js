/* Blockly expression elaboration and checked workshop declarations. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateBlockChecking = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime, printing, checking) {
  'use strict';

  const { Var, U, Pi, Sigma, Lam, App, Pair, Fst, Snd, Id, NatRec, If, Absurd, J, Annot, Hole, Ref, Const, UnitRec, SigmaInd,
    NAT, ZERO, SUC, BOOL, TRUE, FALSE, EMPTY, UNIT, STAR, REFL, vNe, evalTm, envOf, CheckError, fail } = runtime;
  const { infer, check, sortOf, buildCtx, checkLevel } = checking;
  const { showVal } = printing;

  // ---------------- Block JSON -> core terms ----------------
  // j = {type, id, fields:{}, binds:{input:[uid]}, names:{uid:name}, inputs:{input:j}}
  function elabBlock(j, scope, opts) {
    scope = scope || [];
    opts = opts || {};
    if (!j) fail('E_EMPTY', 'No block here yet', null, null, 'noBlock');
    const src = j.id;
    const inp = (n) => j.inputs && j.inputs[n] ? j.inputs[n] : null;
    const el = (n, sc) => {
      const c = inp(n);
      if (!c) fail('E_EMPTY', 'A slot is still empty', { src }, null, 'emptySlot');
      return elabBlock(c, sc || scope, opts);
    };
    const binds = j.binds || {};
    const nameOf = (uid) => (j.names && j.names[uid]) || 'x';
    const push = (uid) => scope.concat([{ uid, name: nameOf(uid) }]);

    switch (j.type) {
      case 'tt_symbol': {
        const id = j.fields && j.fields.REF;
        const symbol = opts.symbols && opts.symbols.get(id);
        if (!symbol) fail('E_SCOPE', 'Unknown declaration: ' + (id || '?'), { src }, null, 'declarationMissing', { id: id || '?' });
        return { t: 'symbol', name: symbol.name, value: symbol.value, tyValue: symbol.tyValue, src };
      }
      case 'tt_var': {
        const raw = (j.fields && j.fields.REF) || '';
        const bar = raw.indexOf('\u241F');
        const ref = bar < 0 ? raw : raw.slice(0, bar);
        const nm = bar < 0 ? ((j.fields && j.fields.NAME) || '') : raw.slice(bar + 1);
        let pos = -1;
        for (let i = scope.length - 1; i >= 0; i--) if (scope[i].uid === ref) { pos = i; break; }
        if (pos < 0) for (let i = scope.length - 1; i >= 0; i--) if (scope[i].name === nm) { pos = i; break; }
        if (pos < 0) fail('E_SCOPE', 'Variable "' + (nm || '?') + '" is not in scope', { src }, null, 'variableScope', { name: nm || '?' });
        return Var(scope.length - 1 - pos, src);
      }
      case 'tt_U': return U(parseInt((j.fields && j.fields.LEVEL) || '0', 10), src);
      case 'tt_given': {
        const idx = parseInt((j.fields && j.fields.IDX) || '-1', 10);
        const n = opts.nGivens || 0;
        if (!(idx >= 0 && idx < n)) fail('E_SCOPE', 'This given is not in the current level context', { src }, null, 'givenScope');
        return Var(scope.length + (n - 1 - idx), src);
      }
      case 'tt_nat': return Object.assign({}, NAT, { src });
      case 'tt_bool': return Object.assign({}, BOOL, { src });
      case 'tt_empty': return Object.assign({}, EMPTY, { src });
      case 'tt_unit': return Object.assign({}, UNIT, { src });
      case 'tt_zero': return Object.assign({}, ZERO, { src });
      case 'tt_true': return Object.assign({}, TRUE, { src });
      case 'tt_false': return Object.assign({}, FALSE, { src });
      case 'tt_star': return Object.assign({}, STAR, { src });
      case 'tt_refl': return Object.assign({}, REFL, { src });
      case 'tt_hole': return Hole(j.id, src);
      case 'tt_lemma': return Ref((j.fields && j.fields.NAME) || '', src);
      case 'tt_answer':
      case 'tt_goal': {
        // The answer slot declares its own local variable (LBM); TERM is in its scope.
        if (!inp('TERM')) fail('E_EMPTY', 'The "answer" slot is still empty', { src }, null, 'emptyAnswer');
        let sc = scope;
        if (opts.answerBinder) {
          for (const uid of (binds.TERM || [])) sc = sc.concat([{ uid, name: nameOf(uid) }]);
        }
        return elabBlock(inp('TERM'), sc, opts);
      }
      case 'tt_annot': return Annot(el('TERM'), el('TYPE'), src);
      case 'tt_suc': return Object.assign(SUC(el('N')), { src });
      case 'tt_fst': return Fst(el('P'), src);
      case 'tt_snd': return Snd(el('P'), src);
      case 'tt_app': return App(el('F'), el('A'), src);
      case 'tt_pair': return Pair(el('A'), el('B'), src);
      case 'tt_if': return If(el('B'), el('X'), el('Y'), src);
      case 'tt_absurd': return Absurd(el('E'), src);
      case 'tt_unitrec': return UnitRec(el('U'), el('MOT'), el('BASE'), src);
      case 'tt_sigma_ind': {
        const pUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const aUid = binds.STEP_BODY && binds.STEP_BODY[0];
        const bUid = binds.STEP_BODY && binds.STEP_BODY[1];
        const mot = Lam(nameOf(pUid), el('MOT_BODY', push(pUid)), null, src);
        const stepScope = scope.concat([
          { uid: aUid, name: nameOf(aUid) },
          { uid: bUid, name: nameOf(bUid) }
        ]);
        const step = Lam(nameOf(aUid), Lam(nameOf(bUid), el('STEP_BODY', stepScope), null, src), null, src);
        return SigmaInd(el('P'), mot, step, src);
      }
      case 'tt_pi': {
        const uid = binds.BODY && binds.BODY[0];
        return Pi(nameOf(uid), el('DOM'), el('BODY', push(uid)), src);
      }
      case 'tt_sigma': {
        const uid = binds.BODY && binds.BODY[0];
        return Sigma(nameOf(uid), el('DOM'), el('BODY', push(uid)), src);
      }
      case 'tt_lam': {
        const uid = binds.BODY && binds.BODY[0];
        return Lam(nameOf(uid), el('BODY', push(uid)), inp('TY') ? el('TY') : null, src);
      }
      case 'tt_id': return Id(el('TY'), el('L'), el('R'), src);
      case 'tt_let': {
        const uid = binds.BODY && binds.BODY[0];
        const ty = inp('TY') ? el('TY') : null;
        return App(Lam(nameOf(uid), el('BODY', push(uid)), ty, src), el('VALUE'), src);
      }
      case 'tt_natrec': {
        const mUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const kUid = binds.STEP_BODY && binds.STEP_BODY[0];
        const iUid = binds.STEP_BODY && binds.STEP_BODY[1];
        const mot = Lam(nameOf(mUid), el('MOT_BODY', push(mUid)), null, src);
        const stepScope = scope.concat([
          { uid: kUid, name: nameOf(kUid) },
          { uid: iUid, name: nameOf(iUid) }
        ]);
        const step = Lam(nameOf(kUid), Lam(nameOf(iUid), el('STEP_BODY', stepScope), null, src), null, src);
        return NatRec(el('N'), mot, el('Z'), step, src);
      }
      case 'tt_J': {
        const yUid = binds.MOT_BODY && binds.MOT_BODY[0];
        const qUid = binds.MOT_BODY && binds.MOT_BODY[1];
        const motScope = scope.concat([
          { uid: yUid, name: nameOf(yUid) },
          { uid: qUid, name: nameOf(qUid) }
        ]);
        const mot = Lam(nameOf(yUid), Lam(nameOf(qUid), el('MOT_BODY', motScope), null, src), null, src);
        return J(el('BASE'), mot, el('D'), el('B'), el('P'), src);
      }
      default: fail('E_INTERNAL', 'Unknown block type ' + j.type, { src }, null, 'unknownBlock', { type: j.type });
    }
  }

  // Wrap a block tree as an entry point that checks the goal in an empty context.
  function hasBlockType(j, type) {
    if (!j) return false;
    if (j.type === type) return true;
    const inputs = j.inputs || {};
    for (const key of Object.keys(inputs)) {
      if (hasBlockType(inputs[key], type)) return true;
    }
    return false;
  }

  function checkBlocks(level, blockJson) {
    let tm;
    try {
      const hasAnswerBinder = !!(level.answerBinders && level.answerBinders.length) || !!level.answerBinder;
      tm = elabBlock(blockJson, [], { nGivens: level.givens.length, answerBinder: hasAnswerBinder });
    } catch (e) {
      if (e instanceof CheckError) return { ok: false, error: e, phase: 'elab' };
      throw e;
    }
    const r = checkLevel(level, tm);
    r.term = tm;
    if (r.ok && level.requireBlock && !hasBlockType(blockJson, level.requireBlock)) {
      r.ok = false;
      r.error = new CheckError('E_REQUIRE', 'This level requires the ' +
        (level.requireBlockName || level.requireBlock) + ' block', null, null, 'requiredBlock',
        { name: level.requireBlockName || level.requireBlock });
      r.requireBlock = level.requireBlock;
    }
    return r;
  }

  // Workshop symbols hold checked semantic values. They are local to one check,
  // never enter DEFS, and can therefore safely depend on the level context.
  function checkWorkshop(level, blockJson, declarationBlocks, inspection) {
    declarationBlocks = declarationBlocks || [];
    const declarations = [], symbols = new Map(), dependencies = new Map();
    try {
      const ctx = buildCtx(level.givens);
      const binders = level.answerBinders || (level.answerBinder ? [level.answerBinder] : []);
      for (const b of binders) {
        sortOf(ctx, b.ty);
        ctx.push({ name: b.name, ty: evalTm(envOf(ctx), b.ty) });
      }
      const answerUids = blockJson && blockJson.binds && blockJson.binds.TERM || [];
      const answerScope = binders.map((b, i) => ({
        uid: answerUids[i],
        name: blockJson && blockJson.names && blockJson.names[answerUids[i]] || b.name,
      }));
      const opts = { nGivens: level.givens.length, symbols };
      const names = new Set(ctx.map(c => c.name));
      for (const entry of answerScope) names.add(entry.name);
      const byId = new Map();
      for (const d of declarationBlocks) {
        const name = String(d.fields && d.fields.NAME || '').trim();
        const kind = d.fields && d.fields.KIND;
        if (!name || /[\s:␟]/u.test(name)) fail('E_DECLARATION', 'Enter a symbol name without spaces or colons', { src: d.id }, null, 'declarationName');
        if (names.has(name) || runtime.DEFS.has(name)) fail('E_DECLARATION', 'Symbol name is already used: ' + name, { src: d.id }, null, 'declarationDuplicate', { name });
        if (!['assumption', 'axiom', 'definition'].includes(kind)) fail('E_DECLARATION', 'Unknown declaration kind', { src: d.id }, null, 'declarationKind');
        if (!d.id || byId.has(d.id)) fail('E_DECLARATION', 'Declaration needs a unique ID', { src: d.id }, null, 'declarationId');
        names.add(name);
        byId.set(d.id, d);
      }
      function references(j, result = new Set()) {
        if (!j) return result;
        if (j.type === 'tt_symbol') result.add(j.fields && j.fields.REF);
        for (const child of Object.values(j.inputs || {})) references(child, result);
        return result;
      }
      const visiting = new Set();
      function resolve(id) {
        if (symbols.has(id)) return;
        const d = byId.get(id);
        if (!d) fail('E_SCOPE', 'Declaration has been removed or is unavailable: ' + (id || '?'), { src: id }, null, 'declarationMissing', { id: id || '?' });
        if (visiting.has(id)) fail('E_DECLARATION', 'Circular declaration: ' + d.fields.NAME, { src: id }, null, 'declarationCircular', { name: d.fields.NAME });
        visiting.add(id);
        const kind = d.fields.KIND, name = d.fields.NAME.trim();
        const inputs = d.inputs || {};
        const refs = references(inputs.TYPE);
        if (kind === 'definition') references(inputs.VALUE, refs);
        for (const ref of refs) resolve(ref);
        dependencies.set(id, refs);
        const active = { type: 'tt_declare', inputs: { TYPE: inputs.TYPE } };
        if (kind === 'definition') active.inputs.VALUE = inputs.VALUE;
        if (hasBlockType(active, 'tt_hole')) fail('E_DECLARATION', 'Complete the declaration before using it', { src: id }, null, 'declarationIncomplete');
        const ty = elabBlock(inputs.TYPE, answerScope, opts);
        sortOf(ctx, ty);
        const tyValue = evalTm(envOf(ctx), ty);
        let value;
        if (kind === 'definition') {
          const term = elabBlock(inputs.VALUE, answerScope, opts);
          const goals = [];
          check(ctx, term, tyValue, goals);
          if (goals.length) fail('E_DECLARATION', 'Complete the definition before using it', { src: id }, null, 'declarationIncomplete');
          value = evalTm(envOf(ctx), term);
        } else value = vNe({ h: 'const', name }, []);
        symbols.set(id, { name, tyValue, value });
        declarations.push({ id, name, kind, typeText: showVal(ctx, tyValue) });
        visiting.delete(id);
      }
      for (const id of byId.keys()) resolve(id);
      const used = references(blockJson);
      function includeDependencies(id) {
        for (const ref of dependencies.get(id) || []) {
          if (!used.has(ref)) { used.add(ref); includeDependencies(ref); }
        }
      }
      for (const id of used) includeDependencies(id);
      const assumptions = declarations.filter(d => d.kind !== 'definition' && used.has(d.id));
      const tm = elabBlock(blockJson, [], { ...opts, answerBinder: !!binders.length });
      const result = checkLevel(level, tm);
      if (result.ok && level.requireBlock && !hasBlockType(blockJson, level.requireBlock)) {
        result.ok = false;
        result.error = new CheckError('E_REQUIRE', 'This level requires the ' + (level.requireBlockName || level.requireBlock) + ' block', null, null, 'requiredBlock', { name: level.requireBlockName || level.requireBlock });
      }
      const output = Object.assign(result, { term: tm, declarations, assumptions });
      if (inspection) {
        const declaration = declarations.find(d => d.id === inspection.id);
        if (declaration) output.selectedType = declaration.typeText;
        else {
          let selected = inspection.json, nestedScope = false;
          function find(j, nested = false) {
            if (!j) return;
            if (j.id === inspection.id) { selected = j; nestedScope = nested; }
            for (const [input, child] of Object.entries(j.inputs || {})) {
              find(child, nested || j.type !== 'tt_answer' && !!(j.binds && j.binds[input]?.length));
            }
          }
          find(blockJson);
          try {
            if (nestedScope) fail('E_SCOPE', 'Select the complete expression to check its local bindings', { src: inspection.id });
            if (result.ok && (selected === blockJson || selected && selected.id === (blockJson.inputs && blockJson.inputs.TERM && blockJson.inputs.TERM.id))) {
              output.selectedType = showVal(ctx, level.inferTerm ? infer(ctx, tm) : evalTm(envOf(ctx), level.goal));
            } else if (selected) {
              const selectedTm = selected === blockJson ? tm : elabBlock(selected, answerScope, opts);
              output.selectedType = showVal(ctx, infer(ctx, selectedTm));
            }
          } catch (e) { output.selectedError = e; }
        }
      }
      return output;
    } catch (error) {
      if (error instanceof CheckError) return { ok: false, error, declarations, assumptions: [], phase: 'declaration' };
      throw error;
    }
  }

  function inspectWorkshop(level, blockJson, declarations, selectedId, selectedJson) {
    if (blockJson && !blockJson.inputs?.TERM) {
      blockJson = { ...blockJson, inputs: { ...blockJson.inputs, TERM: { type: 'tt_hole', id: '__inspection_empty' } } };
    }
    return checkWorkshop(level, blockJson, declarations, { id: selectedId, json: selectedJson });
  }

  return {
    elabBlock, checkBlocks, checkWorkshop, inspectWorkshop,
  };
});
