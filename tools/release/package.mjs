import fs from 'node:fs';
import path from 'node:path';
import { zipDirectory } from './archive.mjs';
import { releaseNames } from './version.mjs';

const { version } = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const archive = path.resolve('release-files', releaseNames(version).archive);
zipDirectory(path.resolve('dist'), archive);
console.log('Offline ZIP: ' + archive + '\nExtract all files and open index.html in Chrome or Edge.');
