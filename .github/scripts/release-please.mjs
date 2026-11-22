import { execFileSync } from 'node:child_process';
import { GitHub, Manifest, registerReleaseType } from 'release-please';
import { ManualChangelog } from './manual-changelog.mjs';

registerReleaseType('manual-node', (options) => new ManualChangelog(options));
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const github = await GitHub.create({ owner, repo, token: process.env.GH_TOKEN });
const manifest = await Manifest.fromManifest(github, 'main');
const dispatch = (workflow, ref, inputs = []) =>
  execFileSync('gh', ['workflow', 'run', workflow, '--ref', ref, ...inputs], { stdio: 'inherit' });
const workflows = {
  '.': 'release-client.yml',
  'packages/builder': 'publish-npm.yml',
  'packages/types': 'publish-types-npm.yml',
};
// Publish merged proposals before looking for the next batch of changes.
for (const release of await manifest.createReleases()) {
  if (release) dispatch(workflows[release.path], 'main', ['-f', `tag=${release.tagName}`]);
}
for (const pr of await manifest.createPullRequests()) {
  if (pr) dispatch('checks.yml', pr.headBranchName);
}
