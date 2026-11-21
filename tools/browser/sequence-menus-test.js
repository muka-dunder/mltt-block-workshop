'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 0 } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.httpServer.address().port);
    await page.waitForFunction(() => window.__mltt?.workspace);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.selectOption('#modeSelect', 'custom');
    const ids = await page.evaluate(() => {
      const w = __mltt.workspace, registry = Blockly.ContextMenuRegistry.registry;
      const make = type => { const b = w.newBlock(type); b.initSvg(); b.render(); return b; };
      const command = (id, block) => registry.getItem(id).callback({ block });
      const judgment = make('tt_judgment');
      judgment.moveBy(60, 480);
      command('mltt_context_add', judgment); command('mltt_context_add', judgment);
      const judgmentCount = judgment.ttContexts.count;
      const rule = make('tt_rule_app');
      rule.moveBy(60, 60);
      for (let i = 0; i < 3; i++) command('mltt_context_add', rule);
      const context = rule.ttContexts;
      const bindings = ['a', 'b', 'c'].map((name, i) => {
        const b = make('tt_binding'); b.setFieldValue(name, 'NAME');
        b.getInput('TYPE').connection.connect(make('tt_U').outputConnection);
        rule.getInput('CONTEXT' + i).connection.connect(b.outputConnection); return b.id;
      });
      command('mltt_premise_add', rule);
      const premises = ['F', 'A', 'P2'].map(input => {
        const b = make('tt_star'); rule.getInput(input).connection.connect(b.outputConnection); return b.id;
      });
      const menu = registry.getContextMenuOptions(Blockly.ContextMenuRegistry.ScopeType.BLOCK, { block: rule });
      return { rule: rule.id, judgmentCount, bindings, premises, labels: menu.map(item => item.text),
        contextCount: context.count, premiseCount: rule.ttItemCount };
    });
    assert.equal(ids.judgmentCount, 2); assert.equal(ids.contextCount, 3); assert.equal(ids.premiseCount, 3);
    for (const label of ['添加上下文', '删除上下文…', '添加前提', '删除前提…']) assert(ids.labels.includes(label), label);
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-inline-contexts.png') });
    for (const kind of ['context', 'premise']) {
      await page.evaluate(({ id, kind }) => {
        Blockly.ContextMenuRegistry.registry.getItem('mltt_' + kind + '_remove').callback(
          { block: __mltt.workspace.getBlockById(id) }, new PointerEvent('contextmenu', { clientX: 500, clientY: 250 }));
      }, { id: ids.rule, kind });
      await page.getByRole('menuitem').filter({ hasText: new RegExp('^第 2 个' + (kind === 'context' ? '上下文' : '前提')) }).click();
      await page.waitForFunction(({ id, kind }) => {
        const rule = __mltt.workspace.getBlockById(id);
        return (kind === 'context' ? rule.ttContexts.count : rule.ttItemCount) === 2;
      }, { id: ids.rule, kind });
    }
    const result = await page.evaluate(ids => {
      const w = __mltt.workspace, rule = w.getBlockById(ids.rule), context = rule.ttContexts;
      const names = context.children().map(b => b.getFieldValue('NAME'));
      const remaining = rule.sequenceChildren().map(b => b.id);
      const drafts = !w.getBlockById(ids.bindings[1]).getParent() && !w.getBlockById(ids.premises[1]).getParent();
      BlockFreeze.setFrozen(rule, true);
      const frozen = Blockly.ContextMenuRegistry.registry.getItem('mltt_context_add').preconditionFn({ block: rule });
      const state = Blockly.serialization.blocks.save(rule), copy = Blockly.serialization.blocks.append(state, w);
      return { names, remaining, drafts, frozen, restoredContext: copy.ttContexts.count,
        restoredPremises: copy.ttItemCount };
    }, ids);
    assert.deepEqual(result.names, ['a', 'c']); assert.deepEqual(result.remaining, [ids.premises[0], ids.premises[2]]);
    assert(result.drafts); assert.equal(result.frozen, 'disabled');
    assert.equal(result.restoredContext, 2); assert.equal(result.restoredPremises, 2);
    assert.deepEqual(errors, []);
    console.log('PASS: judgment/rule context menus, separate premise counts, middle-position deletion, drafts, freeze and persistence');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
