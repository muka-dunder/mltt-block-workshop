import { execFileSync } from 'node:child_process';
export const gh = args => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
export const listReleases = repo => JSON.parse(gh(['api', `repos/${repo}/releases`, '--paginate', '--slurp'])).flat();
export function repository(value = process.env.GITHUB_REPOSITORY) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(value || '')) throw new Error('GITHUB_REPOSITORY must name owner/repository');
  return value;
}
