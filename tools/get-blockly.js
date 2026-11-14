'use strict';
/* Download and extract the Blockly UMD build + media for offline use. */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const opt = { rejectUnauthorized: false };
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, opt, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' ' + url));
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

(async () => {
  const tags = JSON.parse((await get('https://registry.npmjs.org/-/package/blockly/dist-tags')).toString());
  let ver = tags['latest'];
  console.log('latest blockly:', ver);
  const meta = JSON.parse((await get('https://registry.npmjs.org/blockly/' + ver)).toString());
  const tgz = await get(meta.dist.tarball);
  fs.mkdirSync(path.join(__dirname, '..', 'vendor'), { recursive: true });
  const tmp = path.join(__dirname, 'blockly.tgz');
  fs.writeFileSync(tmp, tgz);
  execSync('tar xzf ' + JSON.stringify(tmp) + ' -C ' + JSON.stringify(path.join(__dirname, '..', 'vendor')), { stdio: 'inherit' });
  fs.unlinkSync(tmp);
  console.log('extracted to vendor/package');
  console.log(fs.readdirSync(path.join(__dirname, '..', 'vendor', 'package')).slice(0, 40).join(' '));
})().catch((e) => { console.error(e); process.exit(1); });
