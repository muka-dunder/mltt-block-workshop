'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  const { build } = await import('vite');
  const { packSite } = await import('../release/archive.mjs');
  const { assembleSite } = await import('../release/assemble.mjs');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mltt-version-browser-'));
  let browser, server;
  try {
    const archives = path.join(temp, 'archives'), site = path.join(temp, 'site'), commit = 'b'.repeat(40);
    for (const version of ['0.0.1', '0.0.2']) {
      const dist = path.join(temp, 'build-' + version);
      await build({ root: path.resolve(__dirname, '../..'), logLevel: 'silent',
        define: { __APP_VERSION__: JSON.stringify(version) }, build: { outDir: dist } });
      fs.writeFileSync(path.join(dist, 'build.json'), JSON.stringify({ version, commit }));
      packSite({ dist, out: archives, version, commit });
    }
    assembleSite({ archives, out: site });
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
    assert.deepEqual(errors, []);
    console.log('PASS: unversioned redirect, discarded legacy payloads, versioned resource paths, direct share reload and isolated draft storage');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (path.dirname(temp) !== path.resolve(os.tmpdir())) throw new Error('Unexpected temporary directory');
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
