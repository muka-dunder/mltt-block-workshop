import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { zipSync, unzipSync } from 'fflate';
import { releaseNames, validateVersion } from './version.mjs';

const tar = args => execFileSync('tar', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function regularFiles(directory, prefix = '', files = {}) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (/[\r\n]/.test(item.name) || !item.isFile() && !item.isDirectory()) throw new Error('Unsupported archive entry: ' + item.name);
    const name = prefix + item.name, file = path.join(directory, item.name);
    if (item.isDirectory()) regularFiles(file, name + '/', files);
    else files[name] = fs.readFileSync(file);
  }
  return files;
}
export function zipDirectory(dist, archive) {
  if (fs.existsSync(archive)) throw new Error('Release output already exists');
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  fs.writeFileSync(archive, zipSync(regularFiles(dist), { level: 9 }));
}
export function packSite({ dist, out, version, commit }) {
  validateVersion(version);
  const build = JSON.parse(fs.readFileSync(path.join(dist, 'build.json'), 'utf8'));
  if (build.version !== version || build.commit !== commit || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('The tested build does not match the release version/commit');
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Build has no index.html');
  fs.mkdirSync(out, { recursive: true });
  const names = releaseNames(version), archive = path.join(out, names.archive), metadata = path.join(out, names.metadata);
  if (fs.existsSync(archive) || fs.existsSync(metadata)) throw new Error('Release output already exists');
  zipDirectory(dist, archive);
  fs.writeFileSync(metadata, JSON.stringify({ version, commit, archive: names.archive, sha256: digest(archive) }) + '\n');
  return { archive, metadata };
}
export function unpackSite({ archive, metadata, out, version }) {
  const record = JSON.parse(fs.readFileSync(metadata, 'utf8')), names = releaseNames(version, archive.endsWith('.tar.gz'));
  if (record.version !== version || record.archive !== names.archive || !/^[a-f0-9]{40}$/.test(record.commit) || record.sha256 !== digest(archive)) {
    throw new Error('Release archive integrity check failed: ' + version);
  }
  const legacy = archive.endsWith('.tar.gz');
  let total = 0;
  const entries = legacy ? null : unzipSync(fs.readFileSync(archive), { filter(entry) {
    total += entry.originalSize;
    if (total > 64 * 1024 * 1024) throw new Error('Release archive is too large');
    return true;
  } });
  for (const file of legacy ? tar(['-tzf', archive]).split(/\r?\n/).filter(Boolean) : Object.keys(entries)) {
    if (!file || file.startsWith('/') || file.includes('\\') || file.split('/').includes('..') || /^[A-Za-z]:/.test(file) || /[\r\n\0]/.test(file)) throw new Error('Unsafe archive path: ' + file);
  }
  if (legacy && tar(['-tvzf', archive]).split(/\r?\n/).filter(Boolean).some(line => !/^[-d]/.test(line))) throw new Error('Release archive contains links or special entries');
  fs.mkdirSync(out, { recursive: true });
  if (fs.readdirSync(out).length) throw new Error('Release destination must be empty');
  if (legacy) tar(['-xzf', archive, '-C', out, '--no-same-owner', '--no-same-permissions']);
  else for (const [name, bytes] of Object.entries(entries)) {
    if (name.endsWith('/')) fs.mkdirSync(path.join(out, name), { recursive: true });
    else {
      fs.mkdirSync(path.dirname(path.join(out, name)), { recursive: true });
      fs.writeFileSync(path.join(out, name), bytes);
    }
  }
  regularFiles(out);
  const build = JSON.parse(fs.readFileSync(path.join(out, 'build.json'), 'utf8'));
  if (build.version !== version || build.commit !== record.commit || !fs.existsSync(path.join(out, 'index.html'))) throw new Error('Invalid extracted release: ' + version);
}
