'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '../..'), server: { host: '127.0.0.1', port: 0 } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await page.waitForFunction(() => window.__mltt?.notes);
    const count = await page.locator('#levelSelect option').count();
    assert.equal(count, 19);
    for (const width of [1280, 988]) {
      await page.setViewportSize({ width, height: 900 });
      for (let i = 0; i < 17; i++) {
        await page.selectOption('#levelSelect', String(i));
        await page.selectOption('#languageSelect', 'zh-CN');
        const note = page.locator('.note-card[data-kind="tutorial"]');
        assert.equal(await note.count(), 1);
        assert((await note.locator('textarea').inputValue()).length >= 100, 'Every lesson needs a full explanation');
        await page.waitForFunction(() => {
          const card = document.querySelector('.note-card[data-kind="tutorial"]').getBoundingClientRect();
          const answer = __mltt.workspace.getBlocksByType('tt_problem')[0].getSvgRoot().getBoundingClientRect();
          const host = document.querySelector('#blocklyDiv').getBoundingClientRect();
          return card.left >= answer.right + 15 && card.right <= host.right + 2 && card.top >= host.top && card.bottom <= host.bottom;
        });
        assert((await note.boundingBox()).height >= 320);
        await page.selectOption('#languageSelect', 'en');
        assert((await note.locator('textarea').inputValue()).length >= 100);
      }
    }
    await page.selectOption('#levelSelect', '13');
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-tutorials.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: all 17 bilingual tutorials, larger cards, right-side placement at 1280 and 988 pixels');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
