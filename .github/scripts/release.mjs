import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const packages = {
  client: { path: 'apps/client', manifest: '.', prefix: 'v' },
  builder: { path: 'packages/builder', manifest: 'packages/builder', prefix: 'builder-v' },
  types: { path: 'packages/types', manifest: 'packages/types', prefix: 'types-v' },
};

export function releaseVersion(component, tag) {
  const pkg = packages[component];
  if (!pkg || !tag?.startsWith(pkg.prefix)) throw new Error('Unknown release component or tag');
  const version = tag.slice(pkg.prefix.length);
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Expected a stable ${pkg.prefix}X.Y.Z tag`);
  }
  return version;
}

export function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export function shouldPublish(version, metadata) {
  if (metadata.versions?.[version]) return false;
  const latest = metadata['dist-tags']?.latest;
  if (latest && /^\d+\.\d+\.\d+$/.test(latest) && compareVersions(latest, version) > 0) {
    throw new Error(`Refusing to move npm latest backward from ${latest} to ${version}`);
  }
  if (!metadata.versions) throw new Error('Invalid npm registry response');
  return true;
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();

// gh also resolves draft releases; the REST tag endpoint only resolves published releases.
const readRelease = (tag) =>
  JSON.parse(run('gh', ['release', 'view', tag, '--json', 'isDraft,isPrerelease,assets,tagName']));

export function hasClientBundle(release) {
  return release.assets.some(
    (asset) => asset.name === 'yapmod-client.js' && asset.state === 'uploaded' && asset.size > 0,
  );
}

async function main(command, component) {
  const tag = process.env.RELEASE_TAG;
  const version = releaseVersion(component, tag);
  const pkg = packages[component];
  const manifest = readJson('.release-please-manifest.json');
  const packageJson = readJson(`${pkg.path}/package.json`);
  if (packageJson.version !== version || manifest[pkg.manifest] !== version) {
    throw new Error('Tag, package version, and release manifest must agree');
  }

  if (command === 'verify') {
    const head = run('git', ['rev-parse', 'HEAD']);
    if (head !== run('git', ['rev-parse', `refs/tags/${tag}^{commit}`])) {
      throw new Error('Checkout must match the release tag');
    }
    run('git', ['merge-base', '--is-ancestor', head, 'origin/main']);
    const release = readRelease(tag);
    if (release.isPrerelease) throw new Error('This workflow only publishes stable releases');
    if (component === 'client' && readJson('package.json').version !== version) {
      throw new Error('Root and client versions must agree');
    }
    console.log(`Verified ${tag} at ${head}`);
  } else if (command === 'npm-status') {
    if (component === 'client') throw new Error('The client is not an npm package');
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageJson.name)}`,
    );
    // A registry/auth/network failure must never be treated as an unpublished version.
    if (!response.ok) throw new Error(`npm registry: HTTP ${response.status}`);
    const publish = shouldPublish(version, await response.json());
    appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
    console.log(
      publish ? `Publishing ${packageJson.name}@${version}` : 'Version already published',
    );
  } else if (command === 'upload' && component === 'client') {
    const release = readRelease(tag);
    if (!hasClientBundle(release)) {
      run('gh', ['release', 'upload', tag, 'apps/client/dist/yapmod-client.js', '--clobber']);
    }
  } else if (command === 'finalize') {
    const release = readRelease(tag);
    if (!release.isDraft) return;
    let latest = false;
    if (component === 'client') {
      const current = JSON.parse(run('gh', ['release', 'view', '--json', 'tagName']));
      latest = compareVersions(version, releaseVersion('client', current.tagName)) >= 0;
      if (!hasClientBundle(release)) {
        throw new Error('The client bundle must be attached before publishing');
      }
    }
    run('gh', ['release', 'edit', tag, '--draft=false', `--latest=${latest}`]);
  } else {
    throw new Error(`Unknown release command: ${command}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv[2], process.argv[3]);
}
