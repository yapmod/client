import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { releaseBanner } from '../../apps/docs/scripts/release-banner.mjs';

const releases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const output = process.argv[3];
const repository = process.env.GITHUB_REPOSITORY;
if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '')) throw new Error('Missing GitHub repository');
if (releases.some((release) => release.draft)) throw new Error('Cannot announce draft releases');
const png = await releaseBanner(releases);
writeFileSync(output, png);

const endpoint = `repos/${repository}/git`;
const api = (path, body, method = 'POST') =>
  JSON.parse(
    execFileSync(
      'gh',
      ['api', `${endpoint}/${path}`, ...(body ? ['--method', method, '--input', '-'] : [])],
      { encoding: 'utf8', input: body ? JSON.stringify(body) : undefined },
    ),
  );
const branch = 'release-banners';
const ref = spawnSync('gh', ['api', `${endpoint}/ref/heads/${branch}`], { encoding: 'utf8' });
let parent;
let baseTree;
if (ref.status === 0) {
  parent = JSON.parse(ref.stdout).object.sha;
  baseTree = api(`commits/${parent}`).tree.sha;
} else if (!ref.stderr.includes('(HTTP 404)')) {
  throw new Error(`Cannot read banner branch: ${ref.stderr}`);
}

// A dedicated orphan branch keeps generated assets out of main. Commit-pinned raw
// URLs serve image/png directly and avoid GitHub release download redirects.
const path = `${releases[0].tag_name}/yapmod-release-banner.png`;
const blob = api('blobs', { content: Buffer.from(png).toString('base64'), encoding: 'base64' });
const tree = api('trees', {
  ...(baseTree ? { base_tree: baseTree } : {}),
  tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }],
});
const commit = api('commits', {
  message: `chore: render release banner for ${releases.map((release) => release.tag_name).join(', ')}`,
  tree: tree.sha,
  parents: parent ? [parent] : [],
});
if (parent) {
  // A concurrent update fails rather than discarding another batch's assets.
  api(`refs/heads/${branch}`, { sha: commit.sha, force: false }, 'PATCH');
} else {
  api('refs', { ref: `refs/heads/${branch}`, sha: commit.sha });
}
const url = `https://raw.githubusercontent.com/${repository}/${commit.sha}/${path}`;
appendFileSync(process.env.GITHUB_ENV, `YAPIN_RELEASE_BANNER_URL=${url}\n`);
console.log(`Published release banner: ${url}`);
