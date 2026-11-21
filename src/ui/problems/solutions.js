import { ensurePresetProblem, createTerm } from './preset-problems.js';
import { toJson } from '../workspace/workspace-tools.js';
import { cleanCardSession } from '../cards/card-references.js';

/** Reference answers temporarily occupy the regular canvas; the player's work is retained. */
export function createAnswerPreview({ getWorkspace, getLevel, locale, status, exportSession, importSession, refresh, cards }) {
  const B = window.Blockly;
  const words = (zh, en) => locale() === 'zh-CN' ? zh : en;
  let original = null;

  function setLocale() {
    const button = document.querySelector('#viewAnswerBtn');
    if (button) button.textContent = original ? words('返回作答', 'Back to work') : words('查看答案', 'View answer');
  }

  function reset() { original = null; setLocale(); }

  function restore() {
    if (!original) return false;
    const saved = original;
    // Importing a preset calls loadLevel/reset. Clear our state before that happens.
    original = null;
    try {
      importSession(saved); refresh?.(); setLocale();
      return true;
    } catch (error) {
      original = saved; setLocale();
      status?.(words('恢复作答失败：', 'Could not restore your work: ') + window.I18N.error(error), 'err');
      return false;
    }
  }

  function connect(parent, input, block) {
    parent.getInputTargetBlock(input)?.dispose(false);
    parent.getInput(input).connection.connect(block.outputConnection);
  }

  function build(workspace, level, rootId) {
    workspace.clear();
    const root = workspace.newBlock('tt_problem', rootId); root.initSvg(); root.render(); root.moveBy(80, 80);
    ensurePresetProblem(workspace, level, root);
    const entry = root.getInputTargetBlock('TERM');
    const scope = entry.contextChildren()
      .map(binding => ({ uid: 'b' + binding.id + ':decl', name: binding.getFieldValue('NAME') }));
    if (level.starterBlock) {
      for (const [input, term] of [['F', level.solution.f], ['A', level.solution.a]]) {
        const target = entry.getInputTargetBlock(input);
        connect(target?.type === 'tt_judgment' ? target : entry, target?.type === 'tt_judgment' ? 'TERM' : input,
          createTerm(workspace, term, scope));
      }
      const rule = workspace.newBlock('tt_rule_pi_elim'); rule.initSvg(); rule.render();
      connect(entry, 'RULE', rule);
      connect(entry.getInputTargetBlock('RESULT'), 'TERM', createTerm(workspace, level.solution, scope));
    } else connect(entry, level.inferTerm ? 'TYPE' : 'TERM', createTerm(workspace, level.solution, scope));
    const json = toJson(root);
    const result = window.MLTT.checkCustomProblem(json, cards.declarations(json));
    if (!result.ok) throw result.error || new Error('Incomplete reference answer');
    return root;
  }

  function show() {
    if (original) return restore();
    const level = getLevel(), workspace = getWorkspace();
    if (!workspace || level?.custom || !level?.solution) return false;
    const saved = exportSession();
    const rootId = workspace.getBlocksByType('tt_problem', false)[0]?.id;
    original = saved;
    try {
      B.Events.disable();
      try { window.BlockFreeze.withChanges(workspace, () => build(workspace, level, rootId)); }
      finally { B.Events.enable(); }
      refresh?.(); setLocale();
      status?.(words('已显示完整答案。可选择积木查看类型，点击“返回作答”继续原来的题目。',
        'The complete answer is on the canvas. Select blocks to inspect their types, or return to your work.'), 'ok');
      return true;
    } catch (error) {
      restore();
      status?.(words('显示答案失败：', 'Could not display the answer: ') + window.I18N.error(error), 'err');
      return false;
    }
  }

  return { show, reset, restore, setLocale,
    removeCardReferences(ids) { if (original) original = cleanCardSession(original, ids); },
    exportState() { return original ? { originalWork: original } : null; },
    importState(saved) { original = saved?.originalWork || null; setLocale(); },
    get active() { return !!original; }
  };
}
