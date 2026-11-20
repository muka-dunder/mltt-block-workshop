/* Presets compose the same context, judgment, and inference cards as the free canvas. */
import { toJson } from '../workspace/workspace-tools.js';

const freshId = () => Blockly.utils.idGenerator.genUid();
const ref = (uid, name) => window.LBM.encodeRef(uid, name);
const bindingUid = id => 'b' + id + ':decl';

function termState(term, scope) {
  if (!term) throw new Error('Missing preset expression');
  const state = { type: '', id: freshId(), fields: {}, inputs: {} };
  const add = (input, child, childScope = scope) => { state.inputs[input] = { block: termState(child, childScope) }; };
  function bind(input, names, tags) {
    return scope.concat(names.map((name, i) => {
      state.fields[tags[i].toUpperCase() + 'NAME'] = name || '_';
      return { uid: 'b' + state.id + ':' + tags[i], name: name || '_' };
    }));
  }
  const simple = { nat: 'tt_nat', bool: 'tt_bool', empty: 'tt_empty', unit: 'tt_unit',
    zero: 'tt_zero', true: 'tt_true', false: 'tt_false', star: 'tt_star', refl: 'tt_refl', hole: 'tt_hole' };
  if (simple[term.t]) state.type = simple[term.t];
  else if (term.t === 'var') {
    const binding = scope[scope.length - 1 - term.i];
    if (!binding) throw new Error('Preset expression contains an unbound variable');
    state.type = 'tt_var'; state.fields.REF = ref(binding.uid, binding.name);
  } else if (term.t === 'U') { state.type = 'tt_U'; state.fields.LEVEL = String(term.l); }
  else if (term.t === 'ref') { state.type = 'tt_lemma'; state.fields.NAME = term.name; }
  else if (['pi', 'sigma'].includes(term.t)) {
    state.type = term.t === 'pi' ? 'tt_pi' : 'tt_sigma';
    add('DOM', term.dom); add('BODY', term.cod, bind('BODY', [term.name], ['x']));
  } else if (term.t === 'lam') {
    state.type = 'tt_lam'; add('BODY', term.body, bind('BODY', [term.name], ['x']));
    if (term.ty) return { type: 'tt_annot', id: freshId(), inputs: {
      TYPE: { block: termState(term.ty, scope) }, TERM: { block: state } } };
  } else if (term.t === 'natrec') {
    state.type = 'tt_natrec'; add('N', term.n); add('Z', term.z);
    add('MOT_BODY', term.mot.body, bind('MOT_BODY', [term.mot.name], ['m']));
    add('STEP_BODY', term.s.body.body, bind('STEP_BODY', [term.s.name, term.s.body.name], ['k', 'ih']));
  } else if (term.t === 'sigind') {
    state.type = 'tt_sigma_ind'; add('P', term.p);
    add('MOT_BODY', term.mot.body, bind('MOT_BODY', [term.mot.name], ['p']));
    add('STEP_BODY', term.step.body.body, bind('STEP_BODY', [term.step.name, term.step.body.name], ['a', 'b']));
  } else if (term.t === 'J') {
    state.type = 'tt_J'; add('BASE', term.a); add('D', term.d); add('B', term.b); add('P', term.p);
    add('MOT_BODY', term.mot.body.body, bind('MOT_BODY', [term.mot.name, term.mot.body.name], ['y', 'q']));
  } else {
    const shapes = {
      app: ['tt_app', [['F', 'f'], ['A', 'a']]], pair: ['tt_pair', [['A', 'a'], ['B', 'b']]],
      id: ['tt_id', [['TY', 'ty'], ['L', 'l'], ['R', 'r']]], suc: ['tt_suc', [['N', 'n']]],
      fst: ['tt_fst', [['P', 'p']]], snd: ['tt_snd', [['P', 'p']]], annot: ['tt_annot', [['TERM', 'term'], ['TYPE', 'ty']]],
      absurd: ['tt_absurd', [['E', 'e']]], if: ['tt_if', [['B', 'b'], ['X', 'x'], ['Y', 'y']]],
      unitrec: ['tt_unitrec', [['U', 'u'], ['MOT', 'mot'], ['BASE', 'base']]],
    };
    const shape = shapes[term.t];
    if (!shape) throw new Error('Unsupported preset expression: ' + term.t);
    state.type = shape[0]; for (const [input, property] of shape[1]) add(input, term[property]);
  }
  return state;
}

export function createTerm(workspace, term, scope) {
  return Blockly.serialization.blocks.append(termState(term, scope), workspace);
}

function declarationsFor(level) { return [...level.givens, ...(level.answerBinders || [])]; }
function contextState(declarations, oldNames = []) {
  const scope = [], inputs = {};
  declarations.forEach((declaration, i) => {
    const id = freshId(), name = oldNames[i] || declaration.name;
    inputs['ITEM' + i] = { block: { type: 'tt_binding', id, fields: { NAME: name },
      inputs: { TYPE: { block: termState(declaration.ty, scope) } } } };
    scope.push({ uid: bindingUid(id), name });
  });
  return { state: { type: 'tt_context', id: freshId(), extraState: { count: declarations.length }, inputs }, scope };
}

function wrapLegacyRequirement(root) {
  const old = root.inputs?.TYPE?.block || root.inputs?.TYPE?.shadow;
  if (!root.inputs?.TYPE) return;
  const submission = root.inputs.TERM?.block || root.inputs.TERM?.shadow;
  const type = old?.type;
  const expression = type?.startsWith('tt_requirement_')
    ? old.inputs?.[type === 'tt_requirement_infer' ? 'EXPR' : 'TYPE'] : root.inputs.TYPE;
  const judgment = { type: 'tt_judgment', id: freshId(), extraState: { layout: 'auto' }, inputs: {} };
  if (type === 'tt_requirement_infer') {
    if (expression) judgment.inputs.TERM = expression;
    if (submission) judgment.inputs.TYPE = { block: submission };
  } else {
    if (expression) judgment.inputs.TYPE = expression;
    if (submission) judgment.inputs.TERM = { block: submission };
  }
  if (type === 'tt_requirement_derivation' && ['tt_rule_app', 'tt_rule_judgments'].includes(submission?.type)) {
    delete judgment.inputs.TERM; submission.inputs ||= {}; submission.inputs.RESULT ||= { block: judgment };
  } else root.inputs.TERM = { block: judgment };
  delete root.inputs.TYPE;
}

export function migrateProblemContainers(serialized) {
  const copy = JSON.parse(JSON.stringify(serialized || {}));
  const roots = [], maps = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'tt_answer') value.type = 'tt_problem';
    if (value.type === 'tt_problem') roots.push(value);
    if (value.type === 'tt_judgment' && value.fields) delete value.fields.GOAL;
    if (['tt_rule_app', 'tt_rule_judgments'].includes(value.type) && value.fields) {
      for (const field of ['CONCLUSION', 'FTYPE', 'ATYPE', 'FPREFIX', 'APREFIX', 'RULE_TITLE']) delete value.fields[field];
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(copy);
  for (const root of roots) {
    const oldState = root.extraState || {};
    wrapLegacyRequirement(root);
    if (oldState.entryVersion === 2) continue;
    const preset = oldState.preset || window.GAME_PROBLEM_PRESET?.id;
    const level = window.LEVELS?.levels.find(level => level.id === preset);
    if (!level) { root.extraState = { entryVersion: 2 }; continue; }
    const names = level.givens.map(given => given.name).concat((oldState.binders || []).map(binding => binding.name));
    let entry = root.inputs?.TERM?.block;
    const existing = entry?.inputs?.CONTEXT?.block;
    const existingBindings = existing?.type === 'tt_context' ? Object.entries(existing.inputs || {})
      .filter(([input]) => /^ITEM\d+$/.test(input)).sort(([a], [b]) => Number(a.slice(4)) - Number(b.slice(4)))
      .map(([, input]) => input.block) : [];
    const built = existing?.type === 'tt_context' && existingBindings.length === declarationsFor(level).length && existingBindings.every(binding => binding?.type === 'tt_binding')
      ? { state: existing, scope: existingBindings.map(binding => ({ uid: bindingUid(binding.id), name: binding.fields.NAME })) }
      : contextState(declarationsFor(level), names);
    if (!['tt_judgment', 'tt_rule_app', 'tt_rule_judgments'].includes(entry?.type)) {
      entry = { type: 'tt_judgment', id: freshId(), extraState: { layout: 'auto' }, inputs: {
        TYPE: { block: termState(level.goal, built.scope) }, ...(entry ? { TERM: { block: entry } } : {}) } };
      root.inputs = { TERM: { block: entry } };
    }
    entry.inputs ||= {}; entry.inputs.CONTEXT = { block: built.state };
    maps.push({ root, givens: built.scope.slice(0, level.givens.length),
      old: new Map(built.scope.slice(level.givens.length).map((binding, i) => ['b' + root.id + ':v' + i, binding])) });
    root.extraState = { entryVersion: 2 };
    if (root.fields) for (const field of Object.keys(root.fields)) if (/^BNAME\d+$/.test(field)) delete root.fields[field];
  }
  function rewrite(value, mapping) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'tt_given') {
      const binding = mapping.givens[Number(value.fields?.IDX)];
      if (binding) { value.type = 'tt_var'; value.fields = { REF: ref(binding.uid, binding.name) }; }
    } else if (value.type === 'tt_var') {
      const raw = value.fields?.REF || '', binding = mapping.old.get(raw.split('␟')[0]);
      if (binding) value.fields.REF = ref(binding.uid, binding.name);
    } else if (value.type === 'tt_judgment') {
      if (value.extraState) delete value.extraState.context;
      if (value.fields) for (const field of Object.keys(value.fields)) if (field === 'CTX' || /^BNAME\d+$/.test(field)) delete value.fields[field];
    }
    for (const child of Object.values(value)) rewrite(child, mapping);
  }
  for (const mapping of maps) rewrite(maps.length === 1 ? copy : mapping.root, mapping);
  return copy;
}

function freeze(block, frozen, tree = false) {
  if (!block) return;
  for (const item of tree ? block.getDescendants(false) : [block]) {
    if (window.BlockFreeze) window.BlockFreeze.setFrozen(item, frozen);
    else { item.setEditable(!frozen); item.setMovable(!frozen); item.setDeletable(!frozen); }
  }
}

export function ensurePresetProblem(workspace, level, problem) {
  const perform = () => ensurePreset(workspace, level, problem);
  return window.BlockFreeze ? window.BlockFreeze.withChanges(workspace, perform) : perform();
}

function ensurePreset(workspace, level, problem) {
  const M = window.MLTT, declarations = declarationsFor(level), context = M.buildCtx(declarations);
  problem.ttEntryVersion = 2;
  problem.setFieldValue(level.id + ' · ' + level.title, 'NAME');
  freeze(problem, true);
  const make = type => { const block = workspace.newBlock(type); block.initSvg(); block.render(); return block; };
  function attach(parent, input, block) {
    const previous = parent.getInputTargetBlock(input);
    if (previous && previous !== block) { freeze(previous, false); previous.unplug(); previous.moveBy(30, 30); }
    if (block.getParent()) block.unplug();
    parent.getInput(input).connection.connect(block.outputConnection);
  }
  let entry = problem.getInputTargetBlock('TERM');
  const kind = level.starterBlock ? 'tt_rule_app' : 'tt_judgment';
  if (entry?.type !== kind && !(kind === 'tt_rule_app' && entry?.type === 'tt_rule_judgments')) {
    const old = entry; entry = make(kind); attach(problem, 'TERM', entry);
    if (old && kind === 'tt_judgment') attach(entry, level.inferTerm ? 'TYPE' : 'TERM', old);
  }
  let conditions = entry.getInputTargetBlock('CONTEXT');
  let scope = [];
  const validContext = () => {
    if (!conditions && declarations.length === 0) return true;
    if (conditions?.type !== 'tt_context' || conditions.ttItemCount !== declarations.length) return false;
    try {
      for (let i = 0; i < declarations.length; i++) {
        const binding = conditions.getInputTargetBlock('ITEM' + i), type = binding?.getInputTargetBlock('TYPE');
        if (binding?.type !== 'tt_binding' || !type) return false;
        const prior = context.slice(0, i), got = M.elabBlock(toJson(type), scope, { nGivens: 0 });
        if (!M.conv(M.evalTm(M.envOf(prior), got), M.evalTm(M.envOf(prior), declarations[i].ty))) return false;
        scope.push({ uid: bindingUid(binding.id), name: binding.getFieldValue('NAME') });
      }
      return true;
    } catch (_) { return false; }
  };
  if (!validContext()) {
    const built = contextState(declarations);
    conditions = Blockly.serialization.blocks.append(built.state, workspace); scope = built.scope;
    attach(entry, 'CONTEXT', conditions);
  }
  freeze(conditions, true, true); freeze(entry, true);
  function sameTerm(block, expression) {
    try {
      if (!block) return false;
      const got = M.elabBlock(toJson(block), scope, { nGivens: 0 });
      return M.conv(M.evalTm(M.envOf(context), got), M.evalTm(M.envOf(context), expression));
    } catch (_) { return false; }
  }
  function fixedExpression(parent, input, expression) {
    let block = parent.getInputTargetBlock(input);
    if (!sameTerm(block, expression)) { block = createTerm(workspace, expression, scope); attach(parent, input, block); }
    freeze(block, true, true);
  }
  function judgment(parent, input, type) {
    let block = parent.getInputTargetBlock(input);
    if (block?.type !== 'tt_judgment') {
      const old = block; block = make('tt_judgment'); attach(parent, input, block);
      if (old) attach(block, 'TERM', old);
    }
    freeze(block, true); fixedExpression(block, 'TYPE', type); return block;
  }
  if (level.starterBlock) {
    entry.setSequenceCount(2);
    judgment(entry, 'RESULT', level.goal);
    if (level.starterPremises) for (const [i, input] of ['F', 'A'].entries()) {
      const prior = context.slice(0, level.givens.length + i);
      judgment(entry, input, M.quote(context.length, M.evalTm(M.envOf(prior), level.answerBinders[i].ty)));
    }
  } else {
    fixedExpression(entry, level.inferTerm ? 'TERM' : 'TYPE', level.inferTerm || level.goal);
    if (level.requireBlock && !level.inferTerm) {
      let submitted = entry.getInputTargetBlock('TERM');
      let required = submitted?.getDescendants(false).find(block => block.type === level.requireBlock);
      if (!required) {
        const skeleton = termState(level.solution, scope);
        function retainPath(state) {
          if (state.type === level.requireBlock) { state.inputs = {}; return true; }
          for (const [input, child] of Object.entries(state.inputs || {})) {
            if (retainPath(child.block)) { state.inputs = { [input]: child }; return true; }
          }
          return false;
        }
        if (!retainPath(skeleton)) throw new Error('Required preset constructor is missing from its reference solution');
        submitted = Blockly.serialization.blocks.append(skeleton, workspace); attach(entry, 'TERM', submitted);
        required = submitted.getDescendants(false).find(block => block.type === level.requireBlock);
      }
      for (let block = required; block && block !== entry; block = block.getParent()) freeze(block, true);
    }
  }
  return problem;
}
