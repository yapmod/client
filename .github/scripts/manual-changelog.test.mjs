import assert from 'node:assert/strict';
import test from 'node:test';
import { ManualChangelog, hasNotes, promote, section } from './manual-changelog.mjs';
import { checkEntries, requiredChangelogs } from './check-changelog.mjs';
import { parseConventionalCommits } from 'release-please/build/src/commit.js';
import { Version } from 'release-please/build/src/version.js';
import { Merge } from 'release-please/build/src/plugins/merge.js';
import { TagName } from 'release-please/build/src/util/tag-name.js';

const prose = '### Fixed\n\n- Keep **your draft** when saving fails. [#42](https://example.com/42)';
const history = '## [1.0.0] — 2026-01-01\n\n### Added\n\n- First release.\n';
const content = `# Changelog\n\n## [Unreleased]\n\n${prose}\n\n${history}`;
const empty = `# Changelog\n\n## [Unreleased]\n\n${history}`;

function strategy(source = content, path = '.') {
  const reads = [];
  const github = {
    repository: { owner: 'yapmod', repo: 'client' },
    getFileContentsOnBranch: async (file, ref) => {
      reads.push({ file, ref });
      return {
        parsedContent: file.endsWith('package.json') ? '{"name":"test","version":"1.0.0"}' : source,
      };
    },
  };
  return {
    instance: new ManualChangelog({
      github,
      path,
      targetBranch: 'main',
      component: path === '.' ? 'client' : 'types',
      includeComponentInTag: path !== '.',
    }),
    reads,
  };
}

test('promotion preserves authored prose and history, and resets Unreleased', () => {
  const entry = `## [1.0.1] — 2026-11-22\n\n${prose}`;
  const result = promote(content, entry);
  assert.equal(section(result, 'Unreleased').body, '');
  assert.equal(section(result, '1.0.1').body, prose);
  assert.ok(result.endsWith(history));
  assert.throws(() => promote(empty, entry));
  assert.throws(() => section('# Changelog', 'Unreleased'));
  assert.throws(() => section(`${content}\n## [Unreleased]\n`, 'Unreleased'));
  assert.equal(hasNotes('### Fixed\n\n<!--\n- example\n-->'), false);
});

test('release proposals use human notes while retaining version and manifest integration', async () => {
  const { instance } = strategy();
  const previous = { tag: new TagName(Version.parse('1.0.0')), sha: 'previous', notes: '' };
  const pr = await instance.buildReleasePullRequest(
    parseConventionalCommits([
      {
        sha: 'abc',
        message: 'fix: machine wording must not leak',
        files: ['apps/client/src/index.ts'],
      },
    ]),
    previous,
  );
  assert.equal(pr.version.toString(), '1.0.1');
  assert.ok(pr.body.toString().includes(prose));
  assert.ok(!pr.body.toString().includes('machine wording'));
  const updated = pr.updates
    .find((update) => update.path === 'CHANGELOG.md')
    .updater.updateContent(content);
  assert.equal(section(updated, '1.0.1').body, prose);
  assert.equal(section(updated, 'Unreleased').body, '');
  assert.equal(
    JSON.parse(
      pr.updates
        .find((update) => update.path === 'package.json')
        .updater.updateContent('{"version":"1.0.0"}'),
    ).version,
    '1.0.1',
  );
});

test('empty Unreleased does not release internal-only changes', async () => {
  const { instance } = strategy(empty);
  const pr = await instance.buildReleasePullRequest(
    parseConventionalCommits([
      { sha: 'abc', message: 'chore: update tooling', files: ['package.json'] },
    ]),
  );
  assert.equal(pr, undefined);
});

test('publishing reads the approved changelog at the merge SHA rather than PR prose', async () => {
  const { instance } = strategy(content.replaceAll('1.0.0', '0.9.0'));
  const pr = await instance.buildReleasePullRequest(
    parseConventionalCommits([
      { sha: 'abc', message: 'feat: machine wording', files: ['apps/client/src/index.ts'] },
    ]),
  );
  const updated = pr.updates
    .find((update) => update.path === 'CHANGELOG.md')
    .updater.updateContent(content.replaceAll('1.0.0', '0.9.0'));
  const { instance: publisher, reads } = strategy(updated);
  const release = await publisher.buildRelease({
    title: pr.title.toString(),
    body: pr.body.toString().replace(prose, 'Tampered PR description'),
    headBranchName: pr.headRefName,
    baseBranchName: 'main',
    sha: 'approved-merge',
    labels: [],
    files: [],
  });
  assert.ok(release.notes.includes(prose));
  assert.ok(!release.notes.includes('Tampered'));
  assert.deepEqual(reads.at(-1), { file: 'CHANGELOG.md', ref: 'approved-merge' });
});

test('SDK changes require client and types notes; docs-only changes do not', () => {
  assert.deepEqual(requiredChangelogs(['packages/types/src/index.ts']), [
    'CHANGELOG.md',
    'packages/types/CHANGELOG.md',
  ]);
  assert.deepEqual(requiredChangelogs(['packages/builder/src/index.ts']), [
    'packages/builder/CHANGELOG.md',
  ]);
  assert.deepEqual(requiredChangelogs(['apps/docs/page.tsx', '.github/workflows/checks.yml']), []);
  assert.throws(() =>
    checkEntries(
      ['apps/client/src/index.ts'],
      () => content,
      () => content,
    ),
  );
  assert.throws(() =>
    checkEntries(
      ['apps/client/src/index.ts'],
      () => content,
      () => empty,
    ),
  );
  assert.doesNotThrow(() =>
    checkEntries(
      ['apps/client/src/index.ts'],
      () => empty,
      () => content,
    ),
  );
});

test('client and SDK notes stay separate in the single rolling release PR', async () => {
  const candidates = [];
  const sources = new Map();
  for (const path of ['.', 'packages/types']) {
    const source = content
      .replaceAll('1.0.0', '0.9.0')
      .replace('Keep **your draft**', `Notes for ${path}`);
    const { instance } = strategy(source, path);
    const pullRequest = await instance.buildReleasePullRequest(
      parseConventionalCommits([
        { sha: 'abc', message: 'feat: extension API', files: ['packages/types/src/index.ts'] },
      ]),
    );
    const changelogPath = path === '.' ? 'CHANGELOG.md' : `${path}/CHANGELOG.md`;
    sources.set(
      path,
      pullRequest.updates
        .find((update) => update.path === changelogPath)
        .updater.updateContent(source),
    );
    candidates.push({ path, pullRequest, config: { releaseType: 'manual-node' } });
  }
  const [merged] = await new Merge(
    { repository: { owner: 'yapmod', repo: 'client' } },
    'main',
    {},
  ).run(candidates);
  const pr = merged.pullRequest;
  for (const path of ['.', 'packages/types']) {
    const { instance } = strategy(sources.get(path), path);
    const release = await instance.buildRelease({
      title: pr.title.toString(),
      body: pr.body.toString(),
      headBranchName: pr.headRefName,
      baseBranchName: 'main',
      sha: 'approved',
      labels: [],
      files: [],
    });
    assert.equal(release.tag.toString(), path === '.' ? 'v1.0.0' : 'types-v1.0.0');
    assert.equal(
      release.notes,
      `${section(sources.get(path), '1.0.0').heading}\n\n${section(sources.get(path), '1.0.0').body}`,
    );
  }
});
