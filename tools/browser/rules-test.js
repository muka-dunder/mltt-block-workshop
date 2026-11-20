'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 18746, strictPort: true } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:18746'); await page.waitForFunction(() => window.__mltt?.workspace);
    await page.selectOption('#languageSelect', 'zh-CN');
    async function fillRule(index) {
      await page.selectOption('#levelSelect', String(index));
      return page.evaluate(() => {
        const w = __mltt.workspace, root = w.getBlocksByType('tt_problem')[0], rule = root.getInputTargetBlock('TERM');
        const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
        const templates = w.getFlyout().getWorkspace().getBlocksByType('tt_var');
        function ref(name) {
          const template = templates.find(b => LBM.decodeRef(b.getFieldValue('REF')).name === name);
          if (!template) throw new Error('Missing visible reference ' + name);
          return Blockly.serialization.blocks.append(Blockly.serialization.blocks.save(template), w);
        }
        if (rule.getInputTargetBlock('RULE')) throw new Error('Rule slot must start empty');
        if (!rule.getInput('RESULT') || rule.getField('CONCLUSION') || rule.getField('FTYPE')) throw new Error('All mathematical blanks must be real inputs');
        const refs = {};
        for (const [input, name] of [['F', 'f'], ['A', 'x']]) {
          refs[name] = ref(name);
          const premise = rule.getInputTargetBlock(input);
          if (premise) premise.getInput('TERM').connection.connect(refs[name].outputConnection);
          else rule.getInput(input).connection.connect(refs[name].outputConnection);
        }
        const app = make('tt_app'); app.getInput('F').connection.connect(ref('f').outputConnection); app.getInput('A').connection.connect(ref('x').outputConnection);
        const conclusion = rule.getInputTargetBlock('RESULT'); conclusion.getInput('TERM').connection.connect(app.outputConnection);
        __mltt.check();
        const missingRule = document.querySelector('#status').textContent;
        const piece = make('tt_rule_pi_elim'); rule.getInput('RULE').connection.connect(piece.outputConnection); __mltt.check();
        return { rule: rule.id, f: refs.f.id, x: refs.x.id, piece: piece.id, app: app.id, conclusion: conclusion.id, missingRule };
      });
    }
    const ids = await fillRule(17); assert.match(ids.missingRule, /推导规则/); assert.match(await page.textContent('#status'), /正确/);
    const geometry = await page.evaluate(id => {
      const b = __mltt.workspace.getBlockById(id), bar = b.getSvgRoot().querySelector('.tt-rule-line').getBoundingClientRect();
      return { width: bar.width / __mltt.workspace.scale, barY: bar.y,
        above: b.getInputTargetBlock('A').getSvgRoot().getBoundingClientRect().bottom,
        below: b.getInputTargetBlock('RESULT').getSvgRoot().getBoundingClientRect().top };
    }, ids.rule);
    assert(geometry.width >= 180 && geometry.barY > geometry.above && geometry.barY < geometry.below, JSON.stringify(geometry));
    await page.selectOption('#languageSelect', 'en');
    assert.equal(await page.evaluate(id => __mltt.workspace.getBlockById(id).getInputTargetBlock('F').id, ids.rule), ids.f);
    await page.evaluate(id => {
      const w = __mltt.workspace, b = w.getBlockById(id), fn = b.getInputTargetBlock('F'), arg = b.getInputTargetBlock('A');
      fn.unplug(); arg.unplug(); b.getInput('F').connection.connect(arg.outputConnection); b.getInput('A').connection.connect(fn.outputConnection); __mltt.check();
    }, ids.rule);
    assert.doesNotMatch(await page.textContent('#status'), /Correct/);
    page.once('dialog', d => d.accept()); await page.click('#resetBtn');
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_rule_app').length), 1);
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_rule_app')[0].getInputTargetBlock('RULE')), null);
    await page.selectOption('#languageSelect', 'zh-CN');
    const nested = await fillRule(18); assert.match(await page.textContent('#status'), /正确/);
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-single-entry-rule.png') });
    assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_rule_app').length), 1);
    assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_rule_judgments').length), 0);
    assert.equal(await page.evaluate(() => __mltt.workspace.getFlyout().getWorkspace().getBlocksByType('tt_rule_app')[0].getInputTargetBlock('RULE')), null);
    await page.evaluate(id => {
      const w = __mltt.workspace, app = w.getBlockById(id), arg = app.getInputTargetBlock('A'); arg.unplug();
      app.getInput('A').connection.connect(app.getInputTargetBlock('F').outputConnection); __mltt.check();
    }, nested.app);
    assert.doesNotMatch(await page.textContent('#status'), /正确/);
    await page.selectOption('#levelSelect', '17'); await page.selectOption('#levelSelect', '18');
    await page.setViewportSize({ width: 988, height: 1000 });
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-rule-judgments.png') });
    await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem')[0].moveBy(900, 700));
    await page.getByText('定位题目', { exact: true }).click();
    await page.waitForFunction(() => Blockly.getSelected() === __mltt.workspace.getBlocksByType('tt_problem')[0]);
    assert.equal(await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_problem').length), 1);
    assert.deepEqual(errors, []);
    console.log('PASS: real premise/rule/conclusion inputs; missing rule; checked conclusions; invalid inference; nested judgments; locale preservation; empty toolbox rule; reset');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
