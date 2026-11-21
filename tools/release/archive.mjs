import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { releaseNames, validateVersion } from './version.mjs';

const tar = args => execFileSync('tar', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function regularFiles(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (/[\r\n]/.test(item.name) || !item.isFile() && !item.isDirectory()) throw new Error('Unsupported archive entry: ' + item.name);
    if (item.isDirectory()) regularFiles(path.join(directory, item.name));
  }
}
export function packSite({ dist, out, version, commit }) {
  validateVersion(version);
  const build = JSON.parse(fs.readFileSync(path.join(dist, 'build.json'), 'utf8'));
  if (build.version !== version || build.commit !== commit || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('The tested build does not match the release version/commit');
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Build has no index.html');
  regularFiles(dist);
  fs.mkdirSync(out, { recursive: true });
  const names = releaseNames(version), archive = path.join(out, names.archive), metadata = path.join(out, names.metadata);
  if (fs.existsSync(archive) || fs.existsSync(metadata)) throw new Error('Release output already exists');
  tar(['-czf', archive, '-C', dist, '.']);
  fs.writeFileSync(metadata, JSON.stringify({ version, commit, archive: names.archive, sha256: digest(archive) }) + '\n');
  return { archive, metadata };
}
export function unpackSite({ archive, metadata, out, version }) {
  const record = JSON.parse(fs.readFileSync(metadata, 'utf8')), names = releaseNames(version);
  if (record.version !== version || record.archive !== names.archive || !/^[a-f0-9]{40}$/.test(record.commit) || record.sha256 !== digest(archive)) {
    throw new Error('Release archive integrity check failed: ' + version);
  }
  for (const file of tar(['-tzf', archive]).split(/\r?\n/).filter(Boolean)) {
    if (file.startsWith('/') || file.includes('\\') || file.split('/').includes('..') || /^[A-Za-z]:/.test(file)) throw new Error('Unsafe archive path: ' + file);
  }
  if (tar(['-tvzf', archive]).split(/\r?\n/).filter(Boolean).some(line => !/^[-d]/.test(line))) throw new Error('Release archive contains links or special entries');
  fs.mkdirSync(out, { recursive: true });
  if (fs.readdirSync(out).length) throw new Error('Release destination must be empty');
  tar(['-xzf', archive, '-C', out, '--no-same-owner', '--no-same-permissions']);
  regularFiles(out);
  const build = JSON.parse(fs.readFileSync(path.join(out, 'build.json'), 'utf8'));
  if (build.version !== version || build.commit !== record.commit || !fs.existsSync(path.join(out, 'index.html'))) throw new Error('Invalid extracted release: ' + version);
}
