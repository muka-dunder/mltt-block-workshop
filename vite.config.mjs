import { defineConfig, build } from 'vite';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const mediaRoot = join(dirname(require.resolve('blockly')), 'media');
const mediaFiles = readdirSync(mediaRoot);
const lexicalNotices = `${require.resolve('@mit-app-inventor/blockly-block-lexical-variables/core')}.LICENSE.txt`;
const contentTypes = { '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' };
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const vendorGlobals = {
  'blockly/core': 'MLTT_VENDOR.Blockly',
  'blockly/msg/en': 'MLTT_VENDOR.en',
  'blockly/msg/zh-hans': 'MLTT_VENDOR.zhCN',
  '@mit-app-inventor/blockly-block-lexical-variables/core': 'MLTT_VENDOR',
};
let vendorFile;

export default defineConfig(({ command }) => ({
  base: './',
  publicDir: false,
  define: { __APP_VERSION__: command === 'serve' ? JSON.stringify(version) : 'window.MLTT_APP_VERSION' },
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { external: Object.keys(vendorGlobals),
      output: { format: 'iife', inlineDynamicImports: true, globals: vendorGlobals } },
  },
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
  }, {
    name: 'portable-html',
    apply: 'build',
    enforce: 'post',
    async buildStart() {
      const result = await build({ configFile: false, logLevel: 'silent', publicDir: false,
        build: { write: false, minify: 'esbuild', lib: { entry: fileURLToPath(new URL('./src/vendor.js', import.meta.url)),
          name: 'MLTT_VENDOR', formats: ['iife'] } } });
      const code = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === 'chunk').code;
      vendorFile = 'assets/vendor-' + createHash('sha256').update(code).digest('hex').slice(0, 16) + '.js';
      this.emitFile({ type: 'asset', fileName: vendorFile, source: code });
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/type="module"\s*/g, 'defer ').replace(/\s+crossorigin(?:="[^"]*")?/g, '')
          .replace('<script defer ', `<script defer src="./${vendorFile}"></script>\n<script defer `)
          .replace('</head>', `<script>window.MLTT_APP_VERSION=${JSON.stringify(version)};window.MLTT_MEDIA_PATH="./media/";</script></head>`);
      },
    },
  }],
  server: { host: '127.0.0.1', port: 8000 },
  preview: { host: '127.0.0.1', port: 8000 },
}));
