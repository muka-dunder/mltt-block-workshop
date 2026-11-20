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
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await page.waitForFunction(() => window.__mltt?.notes);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.selectOption('#levelSelect', '1');
    assert.equal(await page.locator('.note-card[data-kind="tutorial"]').count(), 1);
    await page.click('#addNote');
    const card = page.locator('.note-card[data-kind="user"]');
    const text = card.locator('textarea');
    await text.fill('输入 x，返回 x：λx. x\n<script>文字不会执行</script>');
    await page.selectOption('#languageSelect', 'en');
    assert.match(await text.inputValue(), /λx/);
    await page.selectOption('#levelSelect', '2');
    assert.equal(await page.locator('.note-card[data-kind="user"]').count(), 0);
    await page.selectOption('#levelSelect', '1');
    assert.match(await text.inputValue(), /λx/);
    page.once('dialog', dialog => dialog.accept());
    await page.click('#resetBtn');
    assert.match(await text.inputValue(), /λx/);
    await page.reload();
    await page.waitForFunction(() => window.__mltt?.notes);
    assert.match(await text.inputValue(), /λx/);
    await card.locator('[data-action="collapse"]').click();
    assert.equal(await text.isVisible(), false);
    await card.locator('[data-action="collapse"]').click();
    assert.equal(await text.isVisible(), true);
    const header = await card.locator('.note-header').boundingBox();
    const oldPosition = await card.boundingBox();
    await page.mouse.move(header.x + 35, header.y + 15);
    await page.mouse.down(); await page.mouse.move(header.x + 75, header.y + 40); await page.mouse.up();
    const moved = await card.boundingBox();
    assert(Math.abs(moved.x - oldPosition.x - 40) < 2 && Math.abs(moved.y - oldPosition.y - 25) < 2);
    const handle = await card.locator('.note-resize-handle').boundingBox();
    const handleX = handle.x + handle.width / 2, handleY = handle.y + handle.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.mouse.down(); await page.mouse.move(handleX + 40, handleY + 30); await page.mouse.up();
    const resized = await card.boundingBox();
    assert(resized.width > moved.width + 20 && resized.height > moved.height + 15, 'Card must resize using its corner');
    await page.evaluate(() => {
      const answer = __mltt.workspace.getBlocksByType('tt_answer')[0];
      __mltt.notes.add(answer.id);
    });
    const attached = page.locator('.note-card[data-kind="user"]').last();
    const before = await attached.boundingBox();
    await page.evaluate(() => __mltt.workspace.getBlocksByType('tt_answer')[0].moveBy(45, 30));
    await page.waitForFunction(({ x }) => {
      const cards = document.querySelectorAll('.note-card[data-kind="user"]');
      return Math.abs(cards[cards.length - 1].getBoundingClientRect().x - x - 45 * __mltt.workspace.scale) < 2;
    }, { x: before.x });
    await page.evaluate(() => {
      const block = __mltt.workspace.newBlock('tt_lam'); block.initSvg(); block.render(); block.moveBy(140, 120);
      const menu = Blockly.ContextMenuRegistry.registry.getItem('mltt_add_note');
      menu.callback({ block });
      block.dispose(false);
    });
    await page.waitForFunction(() => __mltt.notes.notes.filter(n => !n.tutorial).length === 3 && !__mltt.notes.notes.at(-1).blockId);
    assert.equal(await page.locator('.note-card[data-kind="user"]').count(), 3);
    page.once('dialog', dialog => dialog.accept());
    await page.click('#clearNotes');
    assert.equal(await page.locator('.note-card[data-kind="user"]').count(), 0);
    assert.equal(await page.locator('.note-card[data-kind="tutorial"]').count(), 1);
    await page.selectOption('#languageSelect', 'zh-CN');
    await page.click('#restoreTutorial');
    await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'mltt-notes.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: tutorial notes, text safety, persistence, collapse, drag, resize, attached movement, context menu, deleted target preservation, separate clearing');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
