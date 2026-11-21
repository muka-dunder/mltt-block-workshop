/* Contexts and editable inference trees share one checker in both modes. */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  global.MLTTCreateEntryChecking = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime, printing, checking, elabBlock) {
  'use strict';
  const { evalTm, envOf, vNe, fail, CheckError, conv } = runtime;
  const { infer, check, sortOf } = checking;

  function entries(context) {
    if (!context) return [];
    const inputs = context.inputs || {};
    const count = context.contextCount ?? context.extraState?.contextCount ?? 0;
    if (!Number.isInteger(count) || count < 0 || count > 2000) fail('E_REQUIRE', 'Invalid context size', { src: context.id }, null, 'emptySlot');
    return Array.from({ length: count }, (_, i) => {
      const declaration = inputs['CONTEXT' + i];
      if (!declaration) fail('E_EMPTY', 'Fill every context entry', { src: context.id }, null, 'emptySlot');
      if (declaration.type !== 'tt_binding') fail('E_REQUIRE', 'Expected a binding declaration', { src: declaration.id }, null, 'unknownBlock', { type: declaration.type });
      return declaration;
    });
  }
  const hasContext = j => j && (j.contextCount !== undefined || j.extraState?.contextCount !== undefined);
  function stripContext(j) {
    const copy = { ...j, inputs: { ...j.inputs }, extraState: { ...j.extraState } };
    delete copy.contextCount; delete copy.extraState.contextCount;
    for (const input of Object.keys(copy.inputs)) if (/^CONTEXT\d+$/.test(input)) delete copy.inputs[input];
    return copy;
  }

  function openContext(context, ctx, scope, opts, allowFresh) {
    const nextCtx = ctx.slice(), nextScope = scope.slice();
    const aliases = new Map(opts.bindingAliases || []), ownNames = new Set();
    const nextOpts = { ...opts, bindingAliases: aliases, strictScope: true, contextual: true };
    for (const binding of entries(context)) {
      const name = String(binding.fields?.NAME || '').trim(), uid = 'b' + binding.id + ':decl';
      if (!name || /[\s:␟]/u.test(name)) fail('E_DECLARATION', 'Enter a symbol name', { src: binding.id }, null, 'declarationName');
      if (ownNames.has(name)) fail('E_DECLARATION', 'Duplicate context name', { src: binding.id }, null, 'declarationDuplicate', { name });
      ownNames.add(name);
      const ty = elabBlock(binding.inputs?.TYPE, nextScope, nextOpts); sortOf(nextCtx, ty);
      const tyValue = evalTm(envOf(nextCtx), ty);
      let existing = -1;
      for (let i = scope.length - 1; i >= 0; i--) if (scope[i].name === name) { existing = i; break; }
      if (existing >= 0) {
        if (!conv(ctx[existing].ty, tyValue)) fail('E_MISMATCH', 'Context type differs from the outer context', { src: binding.id }, null, 'contextMismatch', { name });
        aliases.set(uid, scope[existing].uid);
      } else {
        if (!allowFresh) fail('E_SCOPE', 'A context cannot escape its card', { src: binding.id }, null, 'contextEscapes');
        nextCtx.push({ name, ty: tyValue }); nextScope.push({ uid, name });
      }
    }
    return { ctx: nextCtx, scope: nextScope, opts: nextOpts };
  }

  function premiseNames(j) {
    const inputs = j.inputs || {};
    const count = j.premiseCount ?? j.extraState?.premiseCount ?? Math.max(2, ...Object.keys(inputs).filter(k => /^P\d+$/.test(k)).map(k => Number(k.slice(1)) + 1));
    if (!Number.isInteger(count) || count < 0 || count > 2000) fail('E_REQUIRE', 'Invalid premise count', { src: j.id }, null, 'ruleInvalid');
    return Array.from({ length: count }, (_, i) => i === 0 ? 'F' : i === 1 ? 'A' : 'P' + i);
  }

  // Check every editable judgment and conclusion in the entry, including nested cards.
  function validateEntry(j, ctx, scope, opts, expected) {
    if (!j || j.type === 'tt_hole') fail('E_EMPTY', 'A slot is still empty', { src: j?.id }, null, 'emptySlot');
    if (opts.contextual && hasContext(j)) {
      const opened = openContext(j, ctx, scope, opts, false);
      return validateEntry(stripContext(j), opened.ctx, opened.scope, opened.opts, expected);
    }
    if (opts.inspection?.id === j.id) opts.inspection.location = { json: j, ctx, scope, opts, expected };
    const inputs = j.inputs || {}, term = () => elabBlock(j, scope, opts);
    const value = block => evalTm(envOf(ctx), elabBlock(block, scope, opts));
    const visit = (name, ty) => validateEntry(inputs[name], ctx, scope, opts, ty);
    const ensure = (tm, ty) => {
      const goals = []; check(ctx, tm, ty, goals);
      if (goals.length) fail('E_EMPTY', 'A slot is still empty', { src: j.id }, null, 'emptySlot');
    };
    if (j.type === 'tt_judgment') {
      if (!inputs.TYPE) fail('E_EMPTY', 'Fill the judgment type', { src: j.id }, null, 'emptySlot');
      const ty = elabBlock(inputs.TYPE, scope, opts); sortOf(ctx, ty);
      const tyV = value(inputs.TYPE);
      ensure(elabBlock(inputs.TERM, scope, opts), tyV);
      visit('TYPE'); visit('TERM', tyV); return;
    }
    if (['tt_rule_app', 'tt_rule_judgments'].includes(j.type)) {
      const computed = term(), ty = infer(ctx, computed);
      const names = premiseNames(j);
      if (inputs.RULE?.type === 'tt_rule_theorem') {
        const theorem = inputs.RULE.inputs?.THEOREM;
        validateEntry(theorem, ctx, scope, opts);
        let applied = elabBlock(theorem, scope, opts);
        for (const name of names) {
          const fnTy = infer(ctx, applied);
          visit(name, fnTy.t === 'Pi' ? fnTy.dom : undefined);
          applied = runtime.App(applied, elabBlock(inputs[name], scope, opts));
        }
      } else {
        visit('F'); visit('A', infer(ctx, computed.f).dom);
      }
      if (!inputs.RESULT) fail('E_EMPTY', 'Fill the conclusion', { src: j.id }, null, 'emptySlot');
      visit('RESULT', ty);
      const result = elabBlock(inputs.RESULT, scope, opts); ensure(result, ty);
      if (!runtime.conv(evalTm(envOf(ctx), computed), evalTm(envOf(ctx), result))) {
        fail('E_MISMATCH', 'The conclusion does not follow from these premises', { src: inputs.RESULT.id },
          null, 'ruleConclusionMismatch', { expected: printing.show(ctx, computed), actual: printing.show(ctx, result) });
      }
      return;
    }
    const scoped = (name, additions, ty) => {
      const uids = j.binds?.[name] || [], nextCtx = ctx.slice(), nextScope = scope.slice();
      additions.forEach((type, i) => {
        const uid = uids[i], binderName = j.names?.[uid] || 'x';
        nextCtx.push({ name: binderName, ty: type }); nextScope.push({ uid, name: binderName });
      });
      validateEntry(inputs[name], nextCtx, nextScope, opts, ty);
    };
    if (['tt_pi', 'tt_sigma'].includes(j.type)) {
      visit('DOM'); scoped('BODY', [value(inputs.DOM)]); return;
    }
    if (j.type === 'tt_lam') {
      if (inputs.TY) visit('TY');
      const dom = expected?.t === 'Pi' ? expected.dom : inputs.TY && value(inputs.TY);
      if (!dom) return; // The enclosing bidirectional check reports a missing expected type.
      const x = vNe({ h: 'var', lvl: ctx.length }, []);
      scoped('BODY', [dom], expected?.t === 'Pi' ? expected.cod(x) : undefined); return;
    }
    if (j.type === 'tt_annot') { visit('TYPE'); visit('TERM', value(inputs.TYPE)); return; }
    if (j.type === 'tt_app') {
      visit('F'); const fnTy = infer(ctx, elabBlock(inputs.F, scope, opts));
      visit('A', fnTy.t === 'Pi' ? fnTy.dom : undefined); return;
    }
    if (j.type === 'tt_pair' && expected?.t === 'Sigma') {
      visit('A', expected.dom); visit('B', expected.cod(value(inputs.A))); return;
    }
    if (j.type === 'tt_if') { visit('B'); visit('X', expected); visit('Y', expected); return; }
    if (j.type === 'tt_let') {
      if (inputs.TY) visit('TY'); visit('VALUE', inputs.TY && value(inputs.TY));
      scoped('BODY', [inputs.TY ? value(inputs.TY) : infer(ctx, elabBlock(inputs.VALUE, scope, opts))], expected); return;
    }
    if (j.type === 'tt_id') { visit('TY'); visit('L', value(inputs.TY)); visit('R', value(inputs.TY)); return; }
    for (const name of Object.keys(inputs)) visit(name);
  }


  function checkExplicitEntry(problem, initialOpts = {}, inspection) {
    let ctx = [], scope = [], opts = { ...initialOpts, nGivens: 0, strictScope: true, contextual: true };
    const selection = inspection && { id: inspection.id };
    if (selection) opts.inspection = selection;
    const root = problem?.type === 'tt_problem' ? problem.inputs?.TERM : problem;
    let entry = root, term, result;
    try {
      if (hasContext(root)) {
        ({ ctx, scope, opts } = openContext(root, ctx, scope, opts, true));
        entry = stripContext(root);
      }
      validateEntry(entry, ctx, scope, opts);
      term = elabBlock(entry, scope, opts);
      const inferred = infer(ctx, term);
      result = { ok: true, ctx, term, inferred, goalV: inferred };
    } catch (error) {
      if (!(error instanceof CheckError)) throw error;
      result = { ok: false, error, ctx, term, phase: 'entry' };
    }
    if (inspection) {
      try {
        let selected = inspection.json;
        const find = j => { if (!j) return; if (j.id === inspection.id) selected = j; for (const child of Object.values(j.inputs || {})) find(child); };
        find(root);
        const location = selection.location;
        const selectedCtx = location?.ctx || ctx, selectedScope = location?.scope || scope, selectedOpts = location?.opts || opts;
        if (selected?.type === 'tt_binding') result.selectedType = printing.show(selectedCtx, elabBlock(selected.inputs?.TYPE, selectedScope, selectedOpts));
        else {
          const selectedTerm = selected?.id === problem?.id || selected?.id === root?.id ? term : elabBlock(selected, selectedScope, selectedOpts);
          if (selectedTerm) {
            const type = location?.expected || infer(selectedCtx, selectedTerm);
            result.selectedType = printing.showVal(selectedCtx, type);
            result.selectedTypeValue = type; result.selectedScope = selectedScope; result.selectedCtx = selectedCtx;
          }
        }
      } catch (error) { result.selectedError = error; }
    }
    return result;
  }
  return { validateEntry, checkExplicitEntry, contextEntries: entries, hasContext, premiseNames };
});
