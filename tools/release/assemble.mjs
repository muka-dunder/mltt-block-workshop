import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpackSite } from './archive.mjs';
import { compareVersions, releaseNames, releaseVersion, publishedNames } from './version.mjs';
import { shareResources } from './shared.mjs';
import { gh, listReleases, repository } from './github.mjs';

export function assembleSite({ archives, out }) {
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error('Site output must be empty');
  const versions = fs.readdirSync(archives).filter(file => /^mltt-workshop-.*\.json$/.test(file)).map(file => {
    const record = JSON.parse(fs.readFileSync(path.join(archives, file), 'utf8'));
    if (releaseNames(record.version).metadata !== file) throw new Error('Release metadata filename differs from its version');
    return record.version;
  }).sort((a, b) => compareVersions(b, a));
  if (!versions.length) throw new Error('No published site releases found');
  fs.mkdirSync(out, { recursive: true });
  for (const version of versions) {
    const names = releaseNames(version), metadata = path.join(archives, names.metadata);
    const record = JSON.parse(fs.readFileSync(metadata, 'utf8'));
    if (![names.archive, releaseNames(version, true).archive].includes(record.archive)) throw new Error('Invalid archive filename');
    unpackSite({ archive: path.join(archives, record.archive), metadata,
      out: path.join(out, 'v', version), version });
    shareResources(path.join(out, 'v', version), out);
  }
  const latest = versions.find(version => !version.includes('-')) || versions[0];
  const target = './v/' + latest + '/';
  fs.writeFileSync(path.join(out, 'versions.json'), JSON.stringify({ latest, releases: versions }) + '\n');
  // Unversioned links intentionally start fresh. Old unversioned payloads are discarded.
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MLTT Block Workshop</title><meta http-equiv="refresh" content="0;url=${target}"></head>
<body><a id="latest" href="${target}">Open MLTT Block Workshop ${latest}</a>
<script>location.replace(document.getElementById('latest').href);</script></body></html>\n`);
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  return { latest, releases: versions };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = repository(), archives = path.resolve('release-archives');
  fs.mkdirSync(archives, { recursive: true });
  for (const release of listReleases(repo).filter(release => !release.draft)) {
    const version = releaseVersion(release); if (!version) continue;
    const names = Object.values(publishedNames(release));
    gh(['release', 'download', release.tag_name, '--repo', repo, '--dir', archives, ...names.flatMap(name => ['--pattern', name])]);
  }
  console.log(JSON.stringify(assembleSite({ archives, out: path.resolve('site') })));
}
