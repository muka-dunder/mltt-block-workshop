'use strict';
const assert = require('node:assert/strict');
const { chooseLanguage } = require('./header-controls.cjs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18752, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.addInitScript(() => {
      const replace = history.replaceState;
      history.replaceState = function (...args) {
        const result = replace.apply(this, args); window.dispatchEvent(new Event('test:urlchanged')); return result;
      };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18752/?level=L0');
    await page.waitForFunction(() => window.__mltt?.custom);
    await chooseLanguage(page, 'en');

    async function scene(tab) {
      return tab.evaluate(async () => {
        __mltt.refreshVars(); __mltt.refreshWorkshop();
        const root = __mltt.workspace.getBlocksByType('tt_problem')[0];
        __mltt.notes.refresh();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const missing = root.getDescendants(false).filter(block => !block.isCollapsed() &&
          (!block.pathObject.svgPath.getAttribute('d') || block.getHeightWidth().width === 0));
        if (missing.length) throw new Error('Restored blocks were not drawn: ' + missing.map(block => block.type + ':' + block.id).join(', '));
        const session = __mltt.exportSession();
        delete session.answerState;
        // Automatic wrapping and right-side tutorial coordinates are derived
        // from freshly rendered dimensions, not authored puzzle data.
        function authored(value) {
          if (!value || typeof value !== 'object') return;
          if (['tt_pi', 'tt_sigma'].includes(value.type)) delete value.inline;
          for (const child of Object.values(value)) authored(child);
        }
        authored(session.workspace);
        for (const note of session.notes || []) {
          note.tutorial = !!note.tutorial;
          if (note.tutorial && note.placement === 'right') for (const key of ['x', 'y', 'dx', 'dy']) delete note[key];
        }
        return { session: JSON.stringify(session, (_, value) => typeof value === 'number' ? Math.round(value * 1e5) / 1e5 : value),
          workspaceId: __mltt.workspace.id, root: root.id, workspaces: Blockly.common.getAllWorkspaces().length };
      });
    }

    async function waitAnswerUrl(tab, active, originalBlock) {
      await tab.evaluate(async ({ active, originalBlock }) => {
        const { decodeSession } = await import('/src/ui/sharing/share.js');
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { cleanup(); reject(new Error('Answer URL was not synchronized')); }, 15000);
          function cleanup() { clearTimeout(timer); window.removeEventListener('test:urlchanged', check); }
          async function check() {
            const hash = location.hash, encoded = new URLSearchParams(hash.slice(1)).get('workshop');
            if (!encoded) return;
            try {
              const saved = await decodeSession(encoded);
              if (hash !== location.hash || !!saved.answerState?.originalWork !== active) return;
              if (originalBlock && !JSON.stringify(saved.answerState.originalWork.workspace).includes(originalBlock)) return;
              cleanup(); resolve();
            } catch (error) { cleanup(); reject(error); }
          }
          window.addEventListener('test:urlchanged', check); void check();
        });
      }, { active, originalBlock });
    }

    const course = [];
    for (const series of ['journey', 'functions', 'dependent']) {
      await page.selectOption('#seriesSelect', series);
      for (const value of await page.locator('#levelSelect option').evaluateAll(items => items.map(item => item.value))) course.push({ series, value });
    }
    assert.equal(course.length, 19);
    for (let i = 0; i < course.length; i++) {
      const { series, value } = course[i];
      await page.selectOption('#seriesSelect', series);
      await page.selectOption('#levelSelect', value);
      if (i === 0) {
        await page.evaluate(() => {
          const block = __mltt.workspace.newBlock('tt_zero'); block.initSvg(); block.render(); block.moveBy(120, 450);
          __mltt.notes.add();
        });
        await page.locator('.note-card[data-kind="user"] textarea').fill('Keep this notebook and scratch work');
        await page.evaluate(() => __mltt.notes.focusTutorial());
        await page.locator('.note-card[data-kind="tutorial"] [data-action="collapse"]').click();
      }
      if (i === 1) await page.evaluate(() => {
        const w = __mltt.workspace, lambda = w.newBlock('tt_lam'); lambda.initSvg(); lambda.render();
        w.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInput('TERM').connection.connect(lambda.outputConnection);
      });
      await page.evaluate(() => { const w = __mltt.workspace; w.scroll(w.scrollX + 5, w.scrollY + 4); });
      await page.evaluate(() => Blockly.common.setSelected(__mltt.workspace.getBlocksByType('tt_problem')[0]));
      const before = await scene(page);
      const questionExplanation = await page.locator('.note-card[data-kind="tutorial"] textarea').inputValue();
      await page.click('#viewAnswerBtn');
      assert.equal(await page.locator('#viewAnswerBtn').textContent(), 'Back to work');
      const result = await page.evaluate(async () => {
        const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
        const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0];
        const entry = root.getInputTargetBlock('TERM');
        const conditions = entry.ttContexts;
        Blockly.common.setSelected(entry); __mltt.refreshWorkshop();
        return { valid: MLTT.checkCustomProblem(toJson(root), __mltt.cards.declarations(toJson(root))).ok, root: root.id, workspaceId: w.id,
          explicitContext: !!conditions,
          emptyContext: conditions?.count !== 0 ||
            (entry.getField('EMPTY_CONTEXT').isVisible() && !entry.getInput('CONTEXT0')),
          workspaces: Blockly.common.getAllWorkspaces().length, feedback: document.querySelector('#selectionInfo').textContent,
          references: w.getBlocksByType('tt_var', false).map(block => block.getField('REF').getText()) };
      });
      assert(result.valid, JSON.stringify(result)); assert.equal(result.root, before.root);
      assert(result.explicitContext && result.emptyContext, 'Reference answers must show explicit conditions, including ∅ without empty slots');
      assert.equal(result.workspaceId, before.workspaceId); assert.equal(result.workspaces, before.workspaces);
      assert(result.feedback && !/Select a block|E_SCOPE|E_EMPTY/.test(result.feedback), result.feedback);
      assert(result.references.every(text => !text.includes('⚠')), JSON.stringify(result));
      const answerExplanation = await page.locator('.note-card[data-kind="tutorial"] textarea').inputValue();
      assert.notEqual(answerExplanation, questionExplanation, 'Answer explanations should explain the completed construction');
      assert.equal(await page.locator('.note-card[data-kind="tutorial"] textarea').isVisible(), true);
      if (i === 0) {
        assert.equal(await page.evaluate(async () => {
          const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
          const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0], entry = root.getInputTargetBlock('TERM');
          const submission = entry.getInputTargetBlock('TERM');
          const editable = submission.isEditable() && submission.isMovable(); submission.dispose(false);
          const zero = w.newBlock('tt_zero'); zero.initSvg(); zero.render(); entry.getInput('TERM').connection.connect(zero.outputConnection);
          return editable && !MLTT.checkCustomProblem(toJson(root), []).ok;
        }), true, 'The answer uses the regular editable canvas and checker');
      }
      await page.click('#viewAnswerBtn');
      assert.equal(await page.locator('#viewAnswerBtn').textContent(), 'View answer');
      assert.equal((await scene(page)).session, before.session, 'Returning must restore all player blocks, notes and view');
      assert.equal(await page.locator('.note-card[data-kind="tutorial"] textarea').inputValue(), questionExplanation);
      if (i === 0) assert.equal(await page.locator('.note-card[data-kind="tutorial"] textarea').isVisible(), false);
      assert.equal(await page.locator('.solution-dialog').count(), 0);
    }

    await page.selectOption('#seriesSelect', 'journey');
    await page.selectOption('#levelSelect', '0');
    const draft = await page.evaluate(() => {
      const block = __mltt.workspace.newBlock('tt_zero'); block.initSvg(); block.render(); block.moveBy(150, 430); return block.id;
    });
    const original = await scene(page);
    await page.click('#viewAnswerBtn'); await waitAnswerUrl(page, true, draft);
    const url = await page.evaluate(() => location.href);
    await page.reload();
    await page.waitForFunction(() => window.__mltt?.custom && document.querySelector('#viewAnswerBtn')?.textContent === 'Back to work');
    await page.click('#viewAnswerBtn');
    assert.equal((await scene(page)).session, original.session, 'Answer URL reload must retain the original work');
    const visitor = await context.newPage(); visitor.on('pageerror', error => errors.push(error.message));
    await visitor.goto(url);
    await visitor.waitForFunction(() => window.__mltt?.custom && document.querySelector('#viewAnswerBtn')?.textContent === 'Back to work');
    await visitor.click('#viewAnswerBtn');
    assert(await visitor.evaluate(id => !!__mltt.workspace.getBlockById(id), draft));

    await page.click('#viewAnswerBtn');
    await page.selectOption('#modeSelect', 'custom');
    assert.equal(await page.locator('#viewAnswerBtn').isDisabled(), true);
    await page.selectOption('#modeSelect', 'level');
    assert.equal(await page.locator('#viewAnswerBtn').textContent(), 'View answer');
    assert(await page.evaluate(id => !!__mltt.workspace.getBlockById(id), draft), 'Mode switching must save original work, not the displayed answer');
    await page.click('#viewAnswerBtn'); await page.selectOption('#levelSelect', '1');
    assert.equal(await page.locator('#viewAnswerBtn').textContent(), 'View answer');
    await chooseLanguage(page, 'zh-CN');
    await page.click('#viewAnswerBtn'); assert.equal(await page.locator('#viewAnswerBtn').textContent(), '返回作答');
    await page.setViewportSize({ width: 320, height: 800 });
    await page.locator('.workshop-details > summary').click();
    const button = await page.locator('#viewAnswerBtn').boundingBox(); assert(button.x >= 0 && button.x + button.width <= 320);
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-reference-answer.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: all 19 main-canvas answers, editable checked diagrams, original blocks/notes/view restoration, answer URL reload, mode/reset/locale and dual explanations');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
