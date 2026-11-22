import { execFileSync } from 'node:child_process';
import { GitHub, Manifest, registerReleaseType } from 'release-please';
import { ManualChangelog } from './manual-changelog.mjs';

registerReleaseType('manual-node', (options) => new ManualChangelog(options));
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const github = await GitHub.create({ owner, repo, token: process.env.GH_TOKEN });
const manifest = await Manifest.fromManifest(github, 'main');
const dispatch = (workflow, ref, inputs = []) =>
  execFileSync('gh', ['workflow', 'run', workflow, '--ref', ref, ...inputs], { stdio: 'inherit' });
const components = {
  '.': 'client',
  'packages/builder': 'builder',
  'packages/types': 'types',
};
// Publish the whole merged proposal before sending its single announcement.
const releases = (await manifest.createReleases()).filter(Boolean);
if (releases.length) {
  dispatch(
    'publish-release.yml',
    'main',
    releases.flatMap((release) => ['-f', `${components[release.path]}=${release.tagName}`]),
  );
}
for (const pr of await manifest.createPullRequests()) {
  if (pr) dispatch('checks.yml', pr.headBranchName);
}
