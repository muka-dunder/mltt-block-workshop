'use strict';
const assert = require('node:assert/strict');
const { chooseLanguage } = require('./header-controls.cjs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18815, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    await page.clock.install();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18815/');
    await page.waitForFunction(() => window.__mltt?.answerPreview);
    assert.equal(await page.locator('#status').isVisible(), false, 'A fresh canvas has no persistent instruction toast');
    await chooseLanguage(page, 'zh-CN');
    assert.equal(await page.locator('#seriesSelect option[value="coming-soon"]').textContent(), '更多内容制作中');
    assert(await page.locator('#seriesSelect option[value="coming-soon"]').isDisabled());
    for (const [series, count] of [['journey', 12], ['functions', 4], ['dependent', 3]]) {
      await page.selectOption('#seriesSelect', series);
      const options = await page.locator('#levelSelect option').evaluateAll(items => items.map(item => ({ value: item.value, text: item.textContent })));
      assert.equal(options.length, count);
      assert(options.every(item => !/\b[LFDR]\d+\b/.test(item.text)), 'Human names replace internal IDs');
      for (const { value } of options) {
        await page.selectOption('#levelSelect', value);
        const initial = await page.evaluate(async () => {
          const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
          const root = __mltt.workspace.getBlocksByType('tt_problem')[0];
          return { id: __mltt.state.level.id, ok: MLTT.checkCustomProblem(toJson(root), []).ok,
            ids: root.getDescendants(false).map(block => block.id).sort() };
        });
        assert.equal(initial.ok, false, 'Unfinished lesson must not pass: ' + initial.id);
        assert(await page.evaluate(() => __mltt.workspace.getAllBlocks(false)
          .filter(block => ['tt_pi', 'tt_sigma'].includes(block.type)).every(block => {
            const close = block.getInput('PARAM_END'), lineBreak = block.getInput('TYPE_BREAK');
            return close?.fieldRow[0].getText() === ')' && block.inputList.indexOf(close) < block.inputList.indexOf(lineBreak) &&
              !block.getInput('BODY').fieldRow.some(field => field.getText().includes(')'));
          })), 'Closing parentheses stay before the type line break: ' + initial.id);
        assert((await page.locator('.note-card[data-kind="tutorial"] textarea').inputValue()).length > 100, 'A friendly guide is present');
        await page.click('#viewAnswerBtn');
        assert.equal(await page.evaluate(async () => {
          const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
          return MLTT.checkCustomProblem(toJson(__mltt.workspace.getBlocksByType('tt_problem')[0]), []).ok;
        }), true, 'Reference checks: ' + initial.id);
        assert((await page.locator('.note-card[data-kind="tutorial"] textarea').inputValue()).length > 100, 'An answer explanation is present');
        const steps = await page.evaluate(() => (__mltt.state.level.scaffoldPaths || []).map(path => {
          let block = __mltt.workspace.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInputTargetBlock('TERM');
          for (const input of path) block = block.getInputTargetBlock(input);
          return { path, state: Blockly.serialization.blocks.save(block) };
        }));
        await page.click('#viewAnswerBtn');
        assert.deepEqual(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].getDescendants(false).map(block => block.id).sort()), initial.ids);
        assert(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].getDescendants(false).every(block => block.getHeightWidth().width > 0)));
        if (steps.length) assert(await page.evaluate(async steps => {
          const { toJson } = await import('/src/ui/workspace/workspace-tools.js');
          for (const { path, state } of steps) {
            let parent = __mltt.workspace.getBlocksByType('tt_problem')[0].getInputTargetBlock('TERM').getInputTargetBlock('TERM');
            for (const input of path.slice(0, -1)) parent = parent.getInputTargetBlock(input);
            const block = Blockly.serialization.blocks.append(state, __mltt.workspace);
            parent.getInput(path.at(-1)).connection.connect(block.outputConnection);
            for (const child of block.getDescendants(false)) if (child.type === 'tt_var') {
              const name = LBM.decodeRef(child.getFieldValue('REF')).name;
              const binding = LBM.bindersInScope(child).find(binding => binding.name === name);
              if (binding) child.setFieldValue(LBM.encodeRef(binding.uid, binding.name), 'REF');
            }
          }
          return MLTT.checkCustomProblem(toJson(__mltt.workspace.getBlocksByType('tt_problem')[0]), []).ok;
        }, steps), 'The supplied scaffold can be completed through its regular slots: ' + initial.id);
      }
      assert(await page.locator('#nextBtn2').isDisabled(), 'End of series does not wrap');
    }
    await page.selectOption('#seriesSelect', 'journey');
    const remembered = await page.inputValue('#levelSelect');
    await page.selectOption('#seriesSelect', 'functions');
    await page.click('#returnJourneyBtn');
    assert.equal(await page.inputValue('#levelSelect'), remembered);
    await page.selectOption('#levelSelect', '1');
    await page.click('#branchBtn');
    assert.equal(await page.inputValue('#seriesSelect'), 'functions');
    await page.click('#returnJourneyBtn');
    assert.equal(await page.inputValue('#levelSelect'), '1');
    await page.selectOption('#seriesSelect', 'dependent');
    const newLevel = await page.locator('#levelSelect option').first().getAttribute('value');
    await page.selectOption('#levelSelect', newLevel);
    await page.waitForFunction(() => location.search.includes('dependent_constant'));
    await page.reload(); await page.waitForFunction(() => window.__mltt?.state.level.id === 'dependent_constant');
    assert.equal(await page.inputValue('#seriesSelect'), 'dependent');
    await page.goto('http://127.0.0.1:18815/?level=R0');
    await page.waitForFunction(() => window.__mltt?.state.level.id === 'R0');
    assert.equal(await page.inputValue('#seriesSelect'), 'legacy', 'Old direct links remain usable');
    await page.selectOption('#seriesSelect', 'journey');
    await page.selectOption('#levelSelect', '0');
    assert(await page.evaluate(() => {
      const block = __mltt.workspace.newBlock('tt_lemma_add'); block.initSvg(); block.render();
      const fixed = !block.getField('NAME') && block.toString() === 'add' && !Blockly.Blocks.tt_lemma;
      block.dispose(false); return fixed;
    }), 'The add lemma is its own fixed-name puzzle');
    assert(await page.evaluate(() => {
      __mltt.check();
      const status = document.querySelector('#status'), note = document.querySelector('.note-card'), layer = note.parentElement;
      const rect = status.getBoundingClientRect(), parent = layer.getBoundingClientRect(), style = note.getAttribute('style');
      note.style.left = rect.left - parent.left + 'px'; note.style.top = rect.top - parent.top + 'px';
      const visible = document.elementFromPoint(rect.left + 30, rect.top + 15)?.closest('#status') === status;
      note.setAttribute('style', style);
      return visible && status.parentElement === document.body && rect.top < document.querySelector('main').getBoundingClientRect().top;
    }), 'Feedback uses a page-level toast above the canvas');
    await page.clock.fastForward(8001);
    assert.equal(await page.locator('#status').isVisible(), false, 'Feedback disappears automatically');
    const zoomIn = await page.evaluate(() => {
      const control = document.querySelector('.blocklyZoomIn');
      const point = new DOMPoint(16, 16).matrixTransform(control.getScreenCTM());
      const note = document.querySelector('.note-card'), layer = note.parentElement.getBoundingClientRect();
      note.style.left = point.x - layer.left - 20 + 'px'; note.style.top = point.y - layer.top - 20 + 'px';
      if (!document.elementFromPoint(point.x, point.y)?.closest('.canvas-control-layer')) throw new Error('Notes cover the zoom controls');
      return { x: point.x, y: point.y, scale: __mltt.workspace.scale };
    });
    await page.mouse.click(zoomIn.x, zoomIn.y);
    assert(await page.evaluate(scale => __mltt.workspace.scale > scale, zoomIn.scale), 'Original zoom controls stay clickable above notes');
    const zoomOut = await page.evaluate(() => {
      const point = new DOMPoint(16, 16).matrixTransform(document.querySelector('.blocklyZoomOut').getScreenCTM());
      return { x: point.x, y: point.y };
    });
    await page.mouse.click(zoomOut.x, zoomOut.y);
    for (const width of [1440, 1000, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.mouse.move(0, 0);
      await page.waitForFunction(() => {
        const colors = ['shareBtn', 'resetBtn', 'checkBtn'].map(id => getComputedStyle(document.getElementById(id)).backgroundColor);
        return colors.every(color => color === colors[0]);
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page overflow at ' + width);
      assert(await page.locator('#seriesSelect').isVisible());
      assert(await page.locator('#levelSelect').isVisible());
      if (width >= 720) assert(await page.evaluate(() => {
        const controls = ['seriesSelect', 'levelSelect', 'librarySelect', 'checkBtn'].map(id => document.getElementById(id).getBoundingClientRect());
        return Math.max(...controls.map(rect => rect.top)) - Math.min(...controls.map(rect => rect.top)) < 4;
      }), 'Lesson controls stay together in the second row at ' + width);
      assert(await page.evaluate(() => {
        const link = document.querySelector('.github-link').getBoundingClientRect();
        const check = document.querySelector('#checkBtn').getBoundingClientRect();
        const share = document.querySelector('#shareBtn'), reset = document.querySelector('#resetBtn');
        return link.right <= innerWidth && link.bottom < check.top &&
          getComputedStyle(share).backgroundColor === getComputedStyle(reset).backgroundColor &&
          getComputedStyle(share).backgroundColor === getComputedStyle(document.querySelector('#checkBtn')).backgroundColor;
      }));
      if (width <= 900) {
        assert.equal(await page.locator('.workshop-details').getAttribute('open'), null);
        await page.locator('#settingsSummary').click();
        assert(await page.locator('#languageSelect').isVisible());
        await page.locator('#settingsSummary').click();
      }
      if (width <= 600) {
        assert(await page.locator('#blocksToggle').isVisible());
        assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().isVisible()), false);
        await page.click('#blocksToggle');
        assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().isVisible()), true);
        await page.click('#blocksToggle');
      }
    }
    await page.screenshot({ path: path.join(os.tmpdir(), 'mltt-series-phone.png') });
    await page.selectOption('#modeSelect', 'custom');
    assert(await page.locator('#freeCanvasLabel').isVisible());
    assert.equal(await page.locator('#seriesSelect').isVisible(), false);
    await page.selectOption('#modeSelect', 'level');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.selectOption('#seriesSelect', 'journey');
    await page.selectOption('#levelSelect', '0');
    await page.screenshot({ path: path.join(os.tmpdir(), 'mltt-series-desktop.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: all 19 curated lessons, incomplete scaffolds, answers/restoration, named series/memory/branches, direct URLs and responsive controls');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
