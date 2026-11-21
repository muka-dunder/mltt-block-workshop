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
      await page.evaluate(() => __mltt.workspace.setScale(1));
      for (let i = 0; i < count; i++) {
        await page.selectOption('#levelSelect', String(i));
        await page.selectOption('#languageSelect', 'zh-CN');
        const note = page.locator('.note-card[data-kind="tutorial"]');
        assert.equal(await note.count(), 1);
        assert((await note.locator('textarea').inputValue()).length >= 100, 'Every lesson needs a full explanation');
        await page.waitForFunction(() => {
          const card = document.querySelector('.note-card[data-kind="tutorial"]').getBoundingClientRect();
          const answer = __mltt.workspace.getBlocksByType('tt_problem')[0].getSvgRoot().getBoundingClientRect();
          const host = document.querySelector('#blocklyDiv').getBoundingClientRect();
          const beside = card.left >= answer.right + 15 && card.bottom <= host.bottom;
          const below = card.top >= answer.bottom + 15 && Math.abs(card.left - answer.left) < 2;
          return (beside || below) && card.right <= host.right + 2 && card.top >= host.top;
        });
        assert.equal(await page.evaluate(() => __mltt.workspace.scale), 1, 'Lesson layout must preserve the chosen zoom');
        await page.waitForFunction(() => {
          const w = __mltt.workspace, host = document.querySelector('#blocklyDiv');
          const expected = Math.round(Math.min(520, Math.max(220, (host.clientWidth - w.getFlyout().getWidth() - 32) * 0.55)));
          return document.querySelector('.note-card[data-kind="tutorial"]').offsetWidth === expected;
        });
        assert((await note.boundingBox()).height >= 320);
        await page.selectOption('#languageSelect', 'en');
        assert((await note.locator('textarea').inputValue()).length >= 100);
      }
    }
    await page.setViewportSize({ width: 1920, height: 1300 });
    await page.selectOption('#levelSelect', String(count - 1));
    await page.evaluate(() => {
      const note = __mltt.notes.notes.find(note => note.tutorial);
      note.width = 220;
      __mltt.notes.refresh();
    });
    await page.waitForFunction(() => document.querySelector('.note-card[data-kind="tutorial"]').offsetWidth === 520);
    const handle = await page.locator('.note-card[data-kind="tutorial"] .note-resize-handle').boundingBox();
    await page.mouse.move(handle.x + 8, handle.y + 8); await page.mouse.down();
    await page.mouse.move(handle.x - 72, handle.y - 12); await page.mouse.up();
    const manualWidth = await page.locator('.note-card[data-kind="tutorial"]').evaluate(card => card.offsetWidth);
    assert.equal(manualWidth, 440);
    await page.evaluate(() => __mltt.notes.focusTutorial());
    assert.equal(await page.locator('.note-card[data-kind="tutorial"]').evaluate(card => card.offsetWidth), manualWidth);
    await page.selectOption('#levelSelect', '13');
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-tutorials.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: all 19 bilingual tutorials, shared adaptive sizing, R1 width recovery, manual sizing, placement and preserved zoom');
  } finally { if (browser) await browser.close(); await server.close(); }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
