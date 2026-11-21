import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packSite } from '../tools/release/archive.mjs';
import { assembleSite } from '../tools/release/assemble.mjs';
import { publishRelease } from '../tools/release/publish.mjs';
import { compareVersions, releaseDecision, releaseNames, validateVersion } from '../tools/release/version.mjs';

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
  fs.appendFileSync(corrupt, 'corrupted');
  assert.throws(() => assembleSite({ archives, out: path.join(temp, 'corrupt-site') }), /integrity/);
  console.log('PASS: release versions, immutable archive reuse, interrupted drafts, ordering, integrity and complete multi-version assembly');
} finally {
  if (path.dirname(temp) !== path.resolve(os.tmpdir())) throw new Error('Unexpected temporary directory');
  fs.rmSync(temp, { recursive: true, force: true });
}
