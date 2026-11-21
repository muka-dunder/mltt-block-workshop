import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packSite } from './archive.mjs';
import { releaseDecision, validateVersion } from './version.mjs';
import { gh, listReleases, repository } from './github.mjs';

export function publishRelease({ repo, version, commit, releases, run = gh,
  dist = path.resolve('dist'), out = path.resolve('release-files') }) {
  validateVersion(version);
  if (!/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('GITHUB_SHA must name the tested commit');
  releases ||= listReleases(repo);
  const decision = releaseDecision(version, releases), tag = 'v' + version;
  if (decision === 'reuse') {
    return 'reuse';
  } else {
    const draft = releases.find(release => release.tag_name === tag);
    if (draft && draft.target_commitish !== commit) throw new Error('The unfinished release belongs to a different commit; rerun its original workflow');
    // Reject an existing tag pointing elsewhere, including annotated tags.
    const refs = JSON.parse(run(['api', `repos/${repo}/git/matching-refs/tags/${tag}`]));
    if (refs.some(ref => ref.ref === 'refs/tags/' + tag)) {
      const target = JSON.parse(run(['api', `repos/${repo}/commits/${tag}`])).sha;
      if (target !== commit) throw new Error('Release tag already points at another commit: ' + tag);
    }
    const files = packSite({ dist, out, version, commit });
    if (decision === 'create') run(['release', 'create', tag, '--repo', repo, '--target', commit,
      '--title', `MLTT Block Workshop ${version}`, '--draft', '--generate-notes']);
    // Only drafts may be repaired. Published version assets are never overwritten.
    run(['release', 'upload', tag, files.archive, files.metadata, '--repo', repo, '--clobber']);
    run(['release', 'edit', tag, '--repo', repo, '--draft=false', `--prerelease=${version.includes('-')}`, `--latest=${!version.includes('-')}`]);
    return decision;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = publishRelease({ repo: repository(), version: process.env.RELEASE_VERSION, commit: process.env.GITHUB_SHA });
  console.log('Release: ' + result);
}
