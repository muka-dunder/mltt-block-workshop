'use strict';
/* Open the page in headless Chromium, build the L0 reference solution, check it, and screenshot. */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  const logs = [];
  page.on('console', (m) => logs.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const info = await page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const goal = ws.getTopBlocks(false).find((b) => b.type === 'tt_problem');
    return {
      blocks: ws.getAllBlocks(false).length,
      goal: !!goal,
      toolbox: ws.getToolbox() ? ws.getToolbox().getToolboxItems().length : -1,
      goalText: document.getElementById('goalType').textContent,
      title: document.getElementById('levelTitle').textContent,
    };
  });
  console.log('INIT', JSON.stringify(info));

  // Build lambda x. x
  const built = await page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const goal = ws.getTopBlocks(false).find((b) => b.type === 'tt_problem');
    const lam = ws.newBlock('tt_lam');
    lam.initSvg(); lam.render(); lam.moveBy(120, 120);
    goal.getInput('TERM').connection.connect(lam.outputConnection);
    const uid = lam.ttBinds.BODY[0];
    const v = ws.newBlock('tt_var');
    v.initSvg(); v.render(); v.moveBy(160, 220);
    v.setFieldValue(uid + '\u241Fx', 'REF');
    lam.getInput('BODY').connection.connect(v.outputConnection);
    return { uid, varRef: v.getFieldValue('REF'), blocks: ws.getAllBlocks(false).length };
  });
  console.log('BUILT', JSON.stringify(built));

  await page.waitForTimeout(500);
  await page.click('#checkBtn');
  await page.waitForTimeout(500);
  const status = await page.textContent('#status');
  console.log('STATUS', status.replace(/\s+/g, ' '));
  const win = await page.evaluate(() => document.getElementById('overlay').classList.contains('show'));
  console.log('WIN', win);

  await page.screenshot({ path: path.join(__dirname, 'shot-l0.png'), fullPage: false });

  // Drag out of scope: move the variable block to top level (simulate escape)
  await page.click('#winClose');
  const escaped = await page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const v = ws.getBlocksByType('tt_var', false)[0];
    v.unplug();
    v.moveBy(-80, 260);
    return { warning: v.warning ? v.warning.getText() : null };
  });
  await page.waitForTimeout(300);
  await page.click('#checkBtn');
  await page.waitForTimeout(300);
  console.log('ESCAPE', JSON.stringify(escaped));
  console.log('STATUS2', (await page.textContent('#status')).replace(/\s+/g, ' '));
  await page.screenshot({ path: path.join(__dirname, 'shot-escape.png') });

  console.log('LOGS', JSON.stringify(logs.filter((l) => !l.includes('favicon')), null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
