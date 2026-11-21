import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateVersion(version) {
  if (typeof version !== 'string' || version.length > 100 ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.test(version) ||
      (version.split('-').slice(1).join('-').split('.').some(part => /^0\d+$/.test(part)))) {
    throw new Error('Invalid release version: ' + version);
  }
  return version;
}
export function compareVersions(a, b) {
  validateVersion(a); validateVersion(b);
  const left = a.split('-'), right = b.split('-');
  const x = left[0].split('.'), y = right[0].split('.');
  for (let i = 0; i < 3; i++) if (BigInt(x[i]) !== BigInt(y[i])) return BigInt(x[i]) > BigInt(y[i]) ? 1 : -1;
  if (left.length === 1 || right.length === 1) return (left.length === 1 ? 1 : 0) - (right.length === 1 ? 1 : 0);
  const preA = left.slice(1).join('-').split('.'), preB = right.slice(1).join('-').split('.');
  for (let i = 0; i < Math.min(preA.length, preB.length); i++) {
    const a = preA[i], b = preB[i]; if (a === b) continue;
    const numberA = /^\d+$/.test(a), numberB = /^\d+$/.test(b);
    if (numberA && numberB) return BigInt(a) > BigInt(b) ? 1 : -1;
    if (numberA !== numberB) return numberA ? -1 : 1;
    return a > b ? 1 : -1;
  }
  return Math.sign(preA.length - preB.length);
}
export const releaseNames = version => {
  validateVersion(version);
  return { archive: `mltt-workshop-${version}.tar.gz`, metadata: `mltt-workshop-${version}.json` };
};
export function releaseVersion(release) {
  if (!release.tag_name?.startsWith('v')) return null;
  try { return validateVersion(release.tag_name?.replace(/^v/, '')); } catch { return null; }
}
export function releaseDecision(version, releases) {
  validateVersion(version);
  const existing = releases.find(release => release.tag_name === 'v' + version);
  if (existing && !existing.draft) {
    const required = Object.values(releaseNames(version));
    if (!required.every(name => existing.assets.some(asset => asset.name === name))) throw new Error('Published release is missing its site archive: ' + version);
    return 'reuse';
  }
  const published = releases.filter(release => !release.draft).map(releaseVersion).filter(Boolean);
  if (published.some(other => compareVersions(other, version) > 0)) throw new Error('Release version is below an already published version: ' + version);
  return existing ? 'resume' : 'create';
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { version } = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  validateVersion(version); console.log(version);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}
