'use strict';
const { chooseLanguage } = require('./header-controls.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const { build } = await import('vite');
  const { packSite, unpackSite } = await import('../release/archive.mjs');
  const { assembleSite } = await import('../release/assemble.mjs');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mltt-version-browser-'));
  let browser, server;
  try {
    const archives = path.join(temp, 'archives'), site = path.join(temp, 'site'), commit = 'b'.repeat(40);
    for (const version of ['0.0.1', '0.0.2']) {
      const dist = path.join(temp, 'build-' + version);
      await build({ root: path.resolve(__dirname, '../..'), logLevel: 'silent',
        build: { outDir: dist } });
      const index = path.join(dist, 'index.html');
      fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace(/window.MLTT_APP_VERSION="[^"]+"/, 'window.MLTT_APP_VERSION=' + JSON.stringify(version)));
      fs.writeFileSync(path.join(dist, 'build.json'), JSON.stringify({ version, commit }));
      packSite({ dist, out: archives, version, commit });
    }
    assembleSite({ archives, out: site });
    assert.equal(fs.readdirSync(path.join(site, 'shared/assets')).length, 3, 'Identical builds share vendor, application and styles');
    assert.equal(fs.readdirSync(path.join(site, 'shared/media')).length, 1, 'Versions share identical Blockly media');
    server = http.createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      let name;
      try { name = decodeURIComponent(url.pathname).replace(/^\/workshop\//, ''); } catch { response.writeHead(400).end(); return; }
      if (name.endsWith('/') || !name) name += 'index.html';
      const file = path.resolve(site, name);
      if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
      response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      response.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push('HTTP ' + response.status() + ': ' + response.url()); });
    const base = `http://127.0.0.1:${server.address().port}/workshop/`;
    await page.goto(base + '?level=L13#workshop=discard-old-payload');
    await page.waitForFunction(() => window.__mltt?.workspace);
    assert(new URL(page.url()).pathname.endsWith('/v/0.0.2/'));
    assert.equal(await page.evaluate(() => __mltt.state.level.id), 'L0');
    assert(!page.url().includes('discard-old-payload'));
    const createDraft = async version => {
      await page.goto(base + 'v/' + version + '/');
      await page.waitForFunction(() => window.__mltt?.custom);
      assert((await page.title()).includes('v' + version));
      await page.selectOption('#modeSelect', 'custom');
      const id = await page.evaluate(() => {
        const block = __mltt.workspace.newBlock('tt_zero'); block.initSvg(); block.render(); return block.id;
      });
      await page.waitForFunction(({ version, id }) =>
        (localStorage.getItem('mltt.' + version + '.custom.workspace') || '').includes(id) && location.hash.startsWith('#workshop='), { version, id });
      return { id, url: page.url() };
    };
    const first = await createDraft('0.0.1'), second = await createDraft('0.0.2');
    assert(new URL(first.url).pathname.endsWith('/v/0.0.1/'));
    assert.equal(await page.evaluate(id => !!__mltt.workspace.getBlockById(id), first.id), false);
    await page.goto(first.url); await page.waitForFunction(id => !!window.__mltt?.workspace.getBlockById(id), first.id);
    assert.equal(await page.evaluate(id => !!__mltt.workspace.getBlockById(id), second.id), false);
    assert((await page.title()).includes('v0.0.1'));
    const offline = path.join(temp, '离线 game with spaces');
    unpackSite({ archive: path.join(archives, 'mltt-workshop-0.0.1.zip'), metadata: path.join(archives, 'mltt-workshop-0.0.1.json'), out: offline, version: '0.0.1' });
    const local = await browser.newPage(), localErrors = [], network = [];
    local.on('pageerror', error => localErrors.push(error.message));
    local.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    await local.goto(pathToFileURL(path.join(offline, 'index.html')).href);
    await local.waitForFunction(() => window.__mltt?.answerPreview);
    assert((await local.title()).includes('v0.0.1'));
    const levels = await local.locator('#levelSelect option').evaluateAll(options => options.map(option => option.value));
    for (const i of levels) {
      await local.selectOption('#levelSelect', i);
      await local.click('#viewAnswerBtn');
      await local.waitForFunction(() => __mltt.answerPreview.active);
      await local.evaluate(() => __mltt.check());
      assert(await local.locator('#status').evaluate(element => element.classList.contains('ok')), 'Offline answer checks for level ' + i);
      await local.click('#viewAnswerBtn');
      await local.waitForFunction(() => !__mltt.answerPreview.active);
      assert(await local.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return __mltt.workspace.getBlocksByType('tt_problem')[0].getDescendants(false).every(block =>
          block.getHeightWidth().width > 0 && !!block.pathObject.svgPath.getAttribute('d'));
      }), 'Returning from the offline answer must draw every block for level ' + i);
    }
    await local.selectOption('#modeSelect', 'custom');
    const offlineId = await local.evaluate(() => {
      const block = __mltt.workspace.newBlock('tt_zero'); block.initSvg(); block.render(); return block.id;
    });
    await local.waitForFunction(id => (localStorage.getItem('mltt.0.0.1.custom.workspace') || '').includes(id) && location.hash.startsWith('#workshop='), offlineId);
    const offlineUrl = local.url();
    await local.goto(offlineUrl);
    await local.waitForFunction(id => !!window.__mltt?.workspace.getBlockById(id), offlineId);
    await chooseLanguage(local, 'zh-CN');
    const link = local.locator('.github-link');
    assert.equal(await link.getAttribute('href'), 'https://github.com/muka-dunder/mltt-block-workshop');
    for (const width of [1440, 1000, 390]) {
      await local.setViewportSize({ width, height: 900 });
      assert(await local.evaluate(() => {
        const link = document.querySelector('.github-link').getBoundingClientRect(), check = document.querySelector('#checkBtn').getBoundingClientRect();
        return link.bottom < check.top && link.right <= innerWidth;
      }), 'GitHub stays in the application bar at ' + width);
    }
    assert.deepEqual(localErrors, []);
    assert.deepEqual(network, [], 'Offline ZIP must not request a server or CDN');
    assert.deepEqual(errors, []);
    console.log('PASS: versioned sharing/storage, shared assets, offline ZIP file:// play/check/restore/language and GitHub layout');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (path.dirname(temp) !== path.resolve(os.tmpdir())) throw new Error('Unexpected temporary directory');
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
