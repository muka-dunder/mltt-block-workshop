import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { zipSync } from 'fflate';
import { packSite } from '../tools/release/archive.mjs';
import { assembleSite } from '../tools/release/assemble.mjs';
import { publishRelease } from '../tools/release/publish.mjs';
import { compareVersions, releaseDecision, releaseNames, validateVersion } from '../tools/release/version.mjs';
import { shareResources } from '../tools/release/shared.mjs';

for (const version of ['0.0.1', '1.2.3-beta.2', '1.2.3-beta-rc.1']) assert.equal(validateVersion(version), version);
for (const version of ['../1.0.0', '01.0.0', '1.0', '1.0.0-beta.01', '1.0.0+build']) assert.throws(() => validateVersion(version));
assert(compareVersions('1.0.0-beta.2', '1.0.0-beta.11') < 0);
assert(compareVersions('1.0.0', '1.0.0-beta.11') > 0);
assert(compareVersions('2.0.0', '10.0.0') < 0);
const release = (version, draft = false) => ({ tag_name: 'v' + version, draft,
  assets: Object.values(releaseNames(version)).map(name => ({ name })) });
assert.equal(releaseDecision('0.0.1', []), 'create');
assert.equal(releaseDecision('0.0.1', [release('0.0.1', true)]), 'resume');
assert.equal(releaseDecision('0.0.1', [release('0.0.1')]), 'reuse');
assert.equal(releaseDecision('0.0.1', [release('0.0.1'), release('0.0.2')]), 'reuse');
assert.throws(() => releaseDecision('0.0.1', [release('0.0.2')]));
assert.throws(() => releaseDecision('0.0.1', [{ ...release('0.0.1'), assets: [] }]));
assert.equal(releaseDecision('0.0.1', [{ ...release('0.0.1'), assets: Object.values(releaseNames('0.0.1', true)).map(name => ({ name })) }]), 'reuse');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mltt-release-test-')), archives = path.join(temp, 'archives');
try {
  for (const version of ['0.0.1', '0.0.2', '0.0.3-beta.1']) {
    const dist = path.join(temp, 'build-' + version), commit = 'a'.repeat(40);
    fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(dist, 'index.html'), `<script src="./assets/game.js"></script>${version}`);
    fs.writeFileSync(path.join(dist, 'assets/game.js'), '/* fixed version ' + version + ' */');
    fs.writeFileSync(path.join(dist, 'build.json'), JSON.stringify({ version, commit }));
    packSite({ dist, out: archives, version, commit });
    assert.throws(() => packSite({ dist, out: archives, version, commit }));
  }
  const out = path.join(temp, 'site'), manifest = assembleSite({ archives, out });
  assert.deepEqual(manifest, { latest: '0.0.2', releases: ['0.0.3-beta.1', '0.0.2', '0.0.1'] });
  assert.match(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /\.\/v\/0\.0\.2\//);
  for (const version of manifest.releases) {
    assert.equal(fs.readFileSync(path.join(out, 'v', version, 'assets/game.js'), 'utf8'), '/* fixed version ' + version + ' */');
  }
  const sharedSite = path.join(temp, 'shared-site');
  for (const version of ['one', 'two']) {
    const root = path.join(sharedSite, 'v', version);
    fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(root, 'media'));
    fs.writeFileSync(path.join(root, 'media/icon.svg'), '<svg/>');
    fs.writeFileSync(path.join(root, 'assets/vendor.js'), 'fixed dependency');
    fs.writeFileSync(path.join(root, 'assets/game.js'), version);
    fs.writeFileSync(path.join(root, 'index.html'), '<script>window.MLTT_MEDIA_PATH="./media/"</script><script src="./assets/vendor.js"></script><script src="./assets/game.js"></script>');
    shareResources(root, sharedSite);
  }
  assert.equal(fs.readdirSync(path.join(sharedSite, 'shared/assets')).length, 3, 'Two apps reuse one vendor');
  assert.equal(fs.readdirSync(path.join(sharedSite, 'shared/media')).length, 1);
  const htmlOne = fs.readFileSync(path.join(sharedSite, 'v/one/index.html'), 'utf8');
  const scripts = [...htmlOne.matchAll(/src="([^"]+)"/g)].map(match => path.resolve(sharedSite, 'v/one', match[1]));
  assert.deepEqual(scripts.map(file => fs.readFileSync(file, 'utf8')), ['fixed dependency', 'one']);
  // Published tar.gz versions remain readable alongside the new ZIP versions.
  const legacyArchives = path.join(temp, 'legacy'); fs.mkdirSync(legacyArchives);
  const legacyNames = releaseNames('0.0.1', true), legacyArchive = path.join(legacyArchives, legacyNames.archive);
  execFileSync('tar', ['-czf', legacyArchive, '-C', path.join(temp, 'build-0.0.1'), '.']);
  const legacyRecord = { version: '0.0.1', commit: 'a'.repeat(40), archive: legacyNames.archive,
    sha256: createHash('sha256').update(fs.readFileSync(legacyArchive)).digest('hex') };
  fs.writeFileSync(path.join(legacyArchives, legacyNames.metadata), JSON.stringify(legacyRecord));
  assert.equal(assembleSite({ archives: legacyArchives, out: path.join(temp, 'legacy-site') }).latest, '0.0.1');
  assert.throws(() => assembleSite({ archives, out }));
  const commit = 'a'.repeat(40), calls = [];
  const run = args => { calls.push(args); return '[]'; };
  const options = { repo: 'owner/workshop', version: '0.0.1', commit, dist: path.join(temp, 'build-0.0.1'), run };
  assert.equal(publishRelease({ ...options, releases: [], out: path.join(temp, 'new-release') }), 'create');
  const actions = calls.filter(args => args[0] === 'release').map(args => args[1]);
  assert.deepEqual(actions, ['create', 'upload', 'edit']);
  assert(calls.find(args => args[1] === 'create').includes('--draft'));
  calls.length = 0;
  assert.equal(publishRelease({ ...options, releases: [release('0.0.1')] }), 'reuse');
  assert.deepEqual(calls, [], 'A published version must never upload or overwrite assets');
  assert.equal(publishRelease({ ...options, releases: [{ ...release('0.0.1', true), target_commitish: commit }], out: path.join(temp, 'resumed-release') }), 'resume');
  assert(!calls.some(args => args[1] === 'create'), 'An interrupted draft must resume without another release');
  assert.throws(() => publishRelease({ ...options, releases: [{ ...release('0.0.1', true), target_commitish: 'b'.repeat(40) }] }), /different commit/);
  assert.throws(() => publishRelease({ ...options, releases: [], run: args => args[1].includes('matching-refs')
    ? JSON.stringify([{ ref: 'refs/tags/v0.0.1' }]) : JSON.stringify({ sha: 'b'.repeat(40) }) }), /another commit/);
  const corrupt = path.join(archives, releaseNames('0.0.1').archive);
  // A valid checksum must not allow archive paths to escape the destination.
  const badArchive = zipSync({ '../escaped.js': new Uint8Array([1]) });
  const badArchives = path.join(temp, 'bad'); fs.mkdirSync(badArchives);
  fs.writeFileSync(path.join(badArchives, releaseNames('0.0.1').archive), badArchive);
  fs.writeFileSync(path.join(badArchives, legacyNames.metadata), JSON.stringify({ ...legacyRecord,
    archive: releaseNames('0.0.1').archive, sha256: createHash('sha256').update(badArchive).digest('hex') }));
  assert.throws(() => assembleSite({ archives: badArchives, out: path.join(temp, 'bad-site') }), /Unsafe archive path/);
  fs.appendFileSync(corrupt, 'corrupted');
  assert.throws(() => assembleSite({ archives, out: path.join(temp, 'corrupt-site') }), /integrity/);
  console.log('PASS: release versions, immutable archive reuse, interrupted drafts, ordering, integrity and complete multi-version assembly');
} finally {
  if (path.dirname(temp) !== path.resolve(os.tmpdir())) throw new Error('Unexpected temporary directory');
  fs.rmSync(temp, { recursive: true, force: true });
}
