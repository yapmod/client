import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { hasNotes, section } from './manual-changelog.mjs';

export const changelogs = [
  'CHANGELOG.md',
  'packages/builder/CHANGELOG.md',
  'packages/types/CHANGELOG.md',
];

export function requiredChangelogs(files) {
  const required = new Set();
  for (const file of files) {
    if (/^(apps\/client|packages\/(core|ui|types))\/src\//.test(file)) required.add(changelogs[0]);
    if (file.startsWith('packages/builder/src/')) required.add(changelogs[1]);
    if (file.startsWith('packages/types/src/')) required.add(changelogs[2]);
  }
  return [...required];
}

export function checkEntries(files, before, after) {
  for (const path of changelogs) section(after(path), 'Unreleased');
  for (const path of requiredChangelogs(files)) {
    const pending = section(after(path), 'Unreleased').body;
    if (!hasNotes(pending) || pending === section(before(path), 'Unreleased').body) {
      throw new Error(`Add a hand-written entry under ## [Unreleased] in ${path} for this PR.`);
    }
  }
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.env.CHANGELOG_BASE;
  if (!base) throw new Error('CHANGELOG_BASE is required');
  const files = git('diff', '--name-only', '-z', `${base}...HEAD`).split('\0').filter(Boolean);
  const ancestor = git('merge-base', base, 'HEAD').trim();
  checkEntries(
    files,
    (path) => git('show', `${ancestor}:${path}`),
    (path) => readFileSync(path, 'utf8'),
  );
  console.log('Hand-written changelog checks passed.');
}
