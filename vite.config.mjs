import { defineConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const mediaRoot = join(dirname(require.resolve('blockly')), 'media');
const mediaFiles = readdirSync(mediaRoot);
const lexicalNotices = `${require.resolve('@mit-app-inventor/blockly-block-lexical-variables/core')}.LICENSE.txt`;
const contentTypes = { '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' };
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: './',
  publicDir: false,
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [{
    name: 'blockly-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (!pathname.startsWith('/media/')) return next();
        const name = pathname.slice('/media/'.length);
        if (!mediaFiles.includes(name)) return next();
        res.setHeader('Content-Type', contentTypes[name.slice(name.lastIndexOf('.'))] || 'application/octet-stream');
        res.end(readFileSync(join(mediaRoot, name)));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build.json', source: JSON.stringify({ version, commit: process.env.GITHUB_SHA || null }) + '\n' });
      this.emitFile({ type: 'asset', fileName: 'licenses/lexical-variables.txt', source: readFileSync(lexicalNotices) });
      for (const name of mediaFiles) {
        this.emitFile({ type: 'asset', fileName: `media/${name}`, source: readFileSync(join(mediaRoot, name)) });
      }
    },
  }],
  server: { host: '127.0.0.1', port: 8000 },
  preview: { host: '127.0.0.1', port: 8000 },
});
