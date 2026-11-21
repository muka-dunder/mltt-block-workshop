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
  return { bindings: Object.values(inputs).map(input => input.block), scope };
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
  let conditions = entry.contextChildren();
  let scope = [];
  const validContext = () => {
    if (conditions.length !== declarations.length) return false;
    try {
      for (let i = 0; i < declarations.length; i++) {
        const binding = conditions[i], type = binding?.getInputTargetBlock('TYPE');
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
    for (const binding of conditions) if (binding) { freeze(binding, false, true); binding.dispose(false); }
    entry.ttContexts.setCount(declarations.length);
    conditions = built.bindings.map((state, i) => {
      const binding = Blockly.serialization.blocks.append(state, workspace); attach(entry, 'CONTEXT' + i, binding); return binding;
    });
    scope = built.scope;
  }
  for (const binding of conditions) freeze(binding, true, true);
  freeze(entry, true);
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
    block.ttContexts.setCount(0);
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
