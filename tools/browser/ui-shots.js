'use strict';
const { chromium } = require('playwright');
const path = require('path');

const shot = (p, n) => p.screenshot({ path: path.join(__dirname, n) });

async function buildL0(page) {
  return page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const lam = ws.newBlock('tt_lam'); lam.initSvg(); lam.render(); lam.moveBy(70, 120);
    const uid = lam.ttBinds.BODY[0];
    const v = ws.newBlock('tt_var'); v.initSvg(); v.render();
    v.setFieldValue(uid + '\u241Fx', 'REF');
    lam.getInput('BODY').connection.connect(v.outputConnection);
    return ws.getAllBlocks(false).length;
  });
}

async function buildL4(page) {
  return page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    let term = ws.newBlock('tt_eliminator_J'); term.initSvg(); term.render();
    for (let i = 0; i < 6; i++) {
      const application = ws.newBlock('tt_app'); application.initSvg(); application.render();
      application.getInput('F').connection.connect(term.outputConnection); term = application;
    }
    term.moveBy(70, 90);
    return { blocks: ws.getAllBlocks(false).length };
  });
}

async function buildL10(page) {
  return page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const mkLam = (name, x, y) => {
      const b = ws.newBlock('tt_lam'); b.initSvg(); b.render(); b.moveBy(x, y);
      b.setFieldValue(name, 'XNAME'); return b;
    };
    const mkV = (uid, name) => {
      const b = ws.newBlock('tt_var'); b.initSvg(); b.render();
      b.setFieldValue(uid + '\u241F' + name, 'REF'); return b;
    };
    const plug = (p, input, c) => p.getInput(input).connection.connect(c.outputConnection);
    const mk = (t) => { const b = ws.newBlock(t); b.initSvg(); b.render(); return b; };

    const h = mkLam('h', 70, 110);
    const p = mkLam('p', 110, 190);
    plug(h, 'BODY', p);
    const app1 = mk('tt_app');
    plug(p, 'BODY', app1);
    plug(app1, 'F', mkV(h.ttBinds.BODY[0], 'h'));
    const k = mkLam('k', 160, 260);
    plug(app1, 'A', k);
    const app2 = mk('tt_app');
    plug(k, 'BODY', app2);
    plug(app2, 'F', mkV(k.ttBinds.BODY[0], 'k'));
    plug(app2, 'A', mkV(p.ttBinds.BODY[0], 'p'));
    return ws.getAllBlocks(false).length;
  });
}

async function submitAnswer(page) {
  return page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const ans = ws.getBlocksByType('tt_problem', false)[0];
    if (!ans) return { error: 'no answer slot' };
    const tops = ws.getTopBlocks(false).filter((b) => b !== ans && b.outputConnection);
    if (tops.length === 1) {
      ans.getInput('TERM').connection.connect(tops[0].outputConnection);
      ans.render();
    }
    return { tops: tops.length };
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
  const logs = [];
  page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('[console] ' + m.text()); });

  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  await buildL0(page);
  console.log('L0 SUBMIT:', JSON.stringify(await submitAnswer(page)));
  await page.waitForTimeout(400);
  await shot(page, 'shot-l0.png');
  await page.click('#checkBtn');
  await page.waitForTimeout(400);
  console.log('L0:', (await page.textContent('#status')).replace(/\s+/g, ' '));
  await page.click('#winClose');
  await page.waitForTimeout(200);

  // Escape: put a top-level var pointing at a lambda
  await page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const lam = ws.getBlocksByType('tt_lam', false)[0];
    const v = ws.newBlock('tt_var'); v.initSvg(); v.render(); v.moveBy(330, 300);
    v.setFieldValue(lam.ttBinds.BODY[0] + '\u241Fx', 'REF');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__mltt.refreshVars());
  await page.waitForTimeout(300);
  console.log('WARN:', JSON.stringify(await page.evaluate(() => {
    const ws = Blockly.common.getMainWorkspace();
    const v = ws.getBlocksByType('tt_var', false).find((b) => b.getParent() === null);
    return {
      icons: v && v.icons ? v.icons.length : -1,
      dom: document.querySelectorAll('.blocklyWarningIcon').length,
      colour: v && v.getColour(),
    };
  })));
  await shot(page, 'shot-escape.png');

  // L4
  await page.selectOption('#levelSelect', '4');
  await page.waitForTimeout(500);
  console.log('L4 BUILD:', JSON.stringify(await buildL4(page)));
  console.log('L4 SUBMIT:', JSON.stringify(await submitAnswer(page)));
  await page.waitForTimeout(400);
  await shot(page, 'shot-l4.png');
  await page.click('#checkBtn');
  await page.waitForTimeout(400);
  console.log('L4:', (await page.textContent('#status')).replace(/\s+/g, ' '));
  await shot(page, 'shot-l4-win.png');
  await page.click('#winClose');
  await page.waitForTimeout(200);

  // L10 triple negation
  await page.selectOption('#levelSelect', '10');
  await page.waitForTimeout(500);
  console.log('L10 BUILD:', JSON.stringify(await buildL10(page)));
  console.log('L10 SUBMIT:', JSON.stringify(await submitAnswer(page)));
  await page.waitForTimeout(400);
  await shot(page, 'shot-l10.png');
  await page.click('#checkBtn');
  await page.waitForTimeout(400);
  console.log('L10:', (await page.textContent('#status')).replace(/\s+/g, ' '));
  await shot(page, 'shot-l10-win.png');

  const mob = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1.5 });
  await mob.goto('http://127.0.0.1:8000/', { waitUntil: 'load' });
  await mob.waitForTimeout(600);
  await mob.screenshot({ path: path.join(__dirname, 'shot-mobile.png') });

  console.log('LOGS', JSON.stringify(logs));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
