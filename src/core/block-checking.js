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
  const entryChecking = (typeof window === 'undefined' && typeof module === 'object' && module.exports
    ? require('./entry-checking.js') : globalThis.MLTTCreateEntryChecking)(runtime, printing, checking, elabBlock);
  const { validateEntry, checkExplicitEntry, premiseNames } = entryChecking;

  // ---------------- Block JSON -> core terms ----------------
  // j = {type, id, fields:{}, binds:{input:[uid]}, names:{uid:name}, inputs:{input:j}}
  function elabBlock(j, scope, opts) {
    scope = scope || [];
    opts = opts || {};
    if (!j) fail('E_EMPTY', 'No block here yet', null, null, 'noBlock');
    const src = j.id;
    if (opts.contextual && j.inputs?.CONTEXT) {
      const aliases = new Map(opts.bindingAliases || []);
      for (const binding of entryChecking.contextEntries(j.inputs.CONTEXT)) {
        const name = String(binding.fields?.NAME || '').trim();
        const target = [...scope].reverse().find(entry => entry.name === name);
        if (!target) fail('E_SCOPE', 'A context cannot escape its card', { src: binding.id }, null, 'contextEscapes');
        aliases.set('b' + binding.id + ':decl', target.uid);
      }
      opts = { ...opts, bindingAliases: aliases };
    }
    const inp = (n) => j.inputs && j.inputs[n] ? j.inputs[n] : null;
    const el = (n, sc) => {
      const c = inp(n);
      if (!c) fail('E_EMPTY', 'A slot is still empty', { src }, null, 'emptySlot');
      return elabBlock(c, sc || scope, opts);
    };
    const binds = j.binds || {};
    const nameOf = (uid) => (j.names && j.names[uid]) || 'x';
    const push = (uid) => scope.concat([{ uid, name: nameOf(uid) }]);
    const applyRule = () => {
      const rule = inp('RULE');
      if (!rule) fail('E_EMPTY', 'Choose an inference rule', { src }, null, 'ruleMissing');
      const names = premiseNames(j);
      if (rule.type === 'tt_rule_pi_elim') {
        if (names.length !== 2) fail('E_REQUIRE', 'Π-elim requires two premises', { src }, null, 'premiseCount', { expected: 2, actual: names.length });
        return App(el('F'), el('A'), src);
      }
      if (rule.type === 'tt_rule_theorem') {
        const theorem = elabBlock(rule.inputs && rule.inputs.THEOREM, scope, opts);
        return names.reduce((term, name) => App(term, el(name), src), theorem);
      }
      fail('E_REQUIRE', 'Choose a supported inference-rule block', { src }, null, 'ruleInvalid');
    };

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
        const originalRef = bar < 0 ? raw : raw.slice(0, bar);
        const ref = opts.bindingAliases?.get(originalRef) || originalRef;
        const nm = bar < 0 ? ((j.fields && j.fields.NAME) || '') : raw.slice(bar + 1);
        let pos = -1;
        for (let i = scope.length - 1; i >= 0; i--) if (scope[i].uid === ref) { pos = i; break; }
        if (pos < 0 && (!opts.strictScope || !ref)) for (let i = scope.length - 1; i >= 0; i--) if (scope[i].name === nm) { pos = i; break; }
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
      case 'tt_problem':
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
      case 'tt_judgment': return inp('TYPE') ? Annot(el('TERM'), el('TYPE'), src) : el('TERM');
      case 'tt_rule_judgments': return applyRule();
      case 'tt_suc': return Object.assign(SUC(el('N')), { src });
      case 'tt_fst': return Fst(el('P'), src);
      case 'tt_snd': return Snd(el('P'), src);
      case 'tt_rule_app': return applyRule();
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
    if (j.type === type || (type === 'tt_rule_app' && j.type === 'tt_rule_judgments')) return true;
    const inputs = j.inputs || {};
    for (const key of Object.keys(inputs)) {
      if (hasBlockType(inputs[key], type)) return true;
    }
    return false;
  }

  function checkBlocks(level, blockJson) {
    if (blockJson?.type === 'tt_problem' && !blockJson.inputs?.TYPE) return checkWorkshop(level, blockJson, []);
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
    const canonical = blockJson?.entryVersion === 2 || hasBlockType(blockJson, 'tt_context') ||
      (level.entry && blockJson?.type === 'tt_problem' && !Object.hasOwn(blockJson.inputs || {}, 'TYPE'));
    try {
      const ctx = canonical ? [] : buildCtx(level.givens);
      const binders = canonical ? [] : level.answerBinders || (level.answerBinder ? [level.answerBinder] : []);
      for (const b of binders) {
        sortOf(ctx, b.ty);
        ctx.push({ name: b.name, ty: evalTm(envOf(ctx), b.ty) });
      }
      const answerUids = blockJson && blockJson.binds && blockJson.binds.TERM || [];
      const answerScope = binders.map((b, i) => ({
        uid: answerUids[i],
        name: blockJson && blockJson.names && blockJson.names[answerUids[i]] || b.name,
      }));
      const opts = { nGivens: canonical ? 0 : level.givens.length, symbols };
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
      if (Object.prototype.hasOwnProperty.call(level, 'customGoalJson')) {
        const goal = elabBlock(level.customGoalJson, answerScope, opts);
        sortOf(ctx, goal);
        level = { ...level, goal };
      }
      if (Object.prototype.hasOwnProperty.call(level, 'customInferJson')) {
        level = { ...level, inferTerm: elabBlock(level.customInferJson, answerScope, opts) };
      }
      const used = references(blockJson);
      if (level.customGoalJson) references(level.customGoalJson, used);
      if (level.customInferJson) references(level.customInferJson, used);
      function includeDependencies(id) {
        for (const ref of dependencies.get(id) || []) {
          if (!used.has(ref)) { used.add(ref); includeDependencies(ref); }
        }
      }
      for (const id of used) includeDependencies(id);
      const assumptions = declarations.filter(d => d.kind !== 'definition' && used.has(d.id));
      if (canonical) return Object.assign(checkExplicitEntry(blockJson, opts, inspection), { declarations, assumptions });
      const entry = blockJson?.inputs?.TERM;
      const strictEntry = blockJson?.type === 'tt_problem' && !blockJson.inputs?.TYPE;
      let tm = elabBlock(blockJson, [], { ...opts, answerBinder: !!binders.length });
      if (strictEntry) validateEntry(entry, ctx, answerScope, opts, level.entry ? undefined : level.inferTerm ? undefined : evalTm(envOf(ctx), level.goal));
      if (strictEntry && level.inferTerm && entry?.type === 'tt_judgment') {
        tm = elabBlock(entry.inputs.TYPE, answerScope, opts);
      }
      const result = level.entry
        ? { ok: true, ctx, inferred: infer(ctx, tm) }
        : checkLevel(level, tm);
      if (result.ok && level.requireDerivation) {
        let submitted = blockJson.inputs && blockJson.inputs.TERM;
        while (submitted && submitted.type === 'tt_judgment') submitted = submitted.inputs && submitted.inputs.TERM;
        if (!submitted || !['tt_rule_app', 'tt_rule_judgments'].includes(submitted.type)) {
          result.ok = false;
          result.error = new CheckError('E_REQUIRE', 'Submit an inference card', null, null, 'derivationRequired');
        } else if (level.requireRule && submitted.inputs?.RULE?.type !== level.requireRule) {
          result.ok = false;
          result.error = new CheckError('E_REQUIRE', 'Use the required inference rule', null, null, 'requiredBlock', { name: 'Π-elim' });
        }
      }
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
              find(child, nested || !['tt_answer', 'tt_problem', 'tt_judgment'].includes(j.type) && !!(j.binds && j.binds[input]?.length));
            }
          }
          find(blockJson);
          try {
            if (nestedScope) fail('E_SCOPE', 'Select the complete expression to check its local bindings', { src: inspection.id });
            if (result.ok && (selected === blockJson || selected && selected.id === (blockJson.inputs && blockJson.inputs.TERM && blockJson.inputs.TERM.id))) {
              output.selectedType = showVal(ctx, level.inferTerm || level.entry ? infer(ctx, tm) : evalTm(envOf(ctx), level.goal));
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

  function checkCustomProblem(problem, declarations, inspection) {
    const requirement = problem && problem.inputs && problem.inputs.TYPE;
    if (!Object.prototype.hasOwnProperty.call(problem?.inputs || {}, 'TYPE')) return checkWorkshop({ givens: [], entry: true }, problem, declarations, inspection);
    const level = { givens: [], goal: UNIT };
    if (requirement && requirement.type === 'tt_requirement_infer') level.customInferJson = requirement.inputs && requirement.inputs.EXPR;
    else {
      level.customGoalJson = requirement && ['tt_requirement_type', 'tt_requirement_derivation'].includes(requirement.type)
        ? requirement.inputs && requirement.inputs.TYPE : requirement;
      if (requirement && requirement.type === 'tt_requirement_derivation') {
        const kind = requirement.fields && requirement.fields.RULE_KIND || 'application';
        if (!['application', 'any'].includes(kind)) return { ok: false, error: new CheckError('E_REQUIRE', 'Unknown inference requirement', null, null, 'ruleInvalid') };
        level.requireDerivation = true;
        if (kind === 'application') level.requireRule = 'tt_rule_pi_elim';
      }
    }
    const answer = { type: 'tt_answer', id: problem && problem.id, inputs: { TERM: problem && problem.inputs && problem.inputs.TERM } };
    return checkWorkshop(level, answer, declarations, inspection);
  }

  return {
    elabBlock, checkBlocks, checkWorkshop, inspectWorkshop, checkCustomProblem,
  };
});
