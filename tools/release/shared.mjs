import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

function filesIn(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(item => {
    const name = prefix + item.name;
    if (item.isDirectory()) return filesIn(path.join(root, item.name), name + '/');
    if (!item.isFile()) throw new Error('Shared resources must be regular files');
    return [name];
  });
}

/** Only portable builds opt in. Existing modular releases remain byte-for-byte intact. */
export function shareResources(versionRoot, siteRoot) {
  const index = path.join(versionRoot, 'index.html');
  let html = fs.readFileSync(index, 'utf8');
  if (!html.includes('window.MLTT_MEDIA_PATH="./media/"')) return;
  for (const folder of ['assets', 'media']) {
    const source = path.join(versionRoot, folder);
    if (!fs.existsSync(source)) continue;
    const files = filesIn(source);
    if (folder === 'assets') {
      for (const name of files) {
        const from = path.join(source, name), content = fs.readFileSync(from);
        const key = createHash('sha256').update(content).digest('hex') + path.extname(name);
        const target = path.join(siteRoot, 'shared', 'assets', key);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (!fs.existsSync(target)) fs.renameSync(from, target);
        else {
          if (!fs.readFileSync(target).equals(content)) throw new Error('Shared resource hash collision');
          fs.unlinkSync(from);
        }
        html = html.replaceAll('./assets/' + name, '../../shared/assets/' + key);
      }
    } else {
      const hash = createHash('sha256');
      for (const name of files) {
        hash.update(JSON.stringify(name));
        hash.update(createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest());
      }
      const key = hash.digest('hex'), target = path.join(siteRoot, 'shared', folder, key);
      fs.mkdirSync(target, { recursive: true });
      for (const name of files) {
        const from = path.join(source, name), to = path.join(target, name);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        if (!fs.existsSync(to)) fs.renameSync(from, to);
        else {
          if (!fs.readFileSync(to).equals(fs.readFileSync(from))) throw new Error('Shared resource hash collision');
          fs.unlinkSync(from);
        }
      }
      html = html.replaceAll('./' + folder + '/', '../../shared/' + folder + '/' + key + '/');
    }
    // All entries were enumerated above; remove only the now-empty directories.
    function removeEmpty(directory) {
      for (const item of fs.readdirSync(directory)) removeEmpty(path.join(directory, item));
      fs.rmdirSync(directory);
    }
    removeEmpty(source);
  }
  fs.writeFileSync(index, html);
}
