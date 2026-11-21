import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareVersions, hasClientBundle, releaseVersion, shouldPublish } from './release.mjs';

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

test('release tags identify exactly one stable component version', () => {
  assert.equal(releaseVersion('client', 'v1.2.0'), '1.2.0');
  assert.equal(releaseVersion('builder', 'builder-v1.4.0'), '1.4.0');
  assert.equal(releaseVersion('types', 'types-v1.3.0'), '1.3.0');
  for (const tag of ['main', 'v1.2.0-beta.1', 'v01.2.0', 'v1.2', 'types-v1.2.0']) {
    assert.throws(() => releaseVersion('client', tag));
  }
  assert.throws(() => releaseVersion('unknown', 'v1.0.0'));
});

test('retries skip published versions and cannot downgrade npm latest', () => {
  const metadata = { versions: { '1.2.0': {} }, 'dist-tags': { latest: '1.2.0' } };
  assert.equal(shouldPublish('1.2.0', metadata), false);
  assert.equal(shouldPublish('1.3.0', metadata), true);
  assert.throws(() => shouldPublish('1.1.0', metadata));
  assert.throws(() => shouldPublish('1.3.0', {}));
  assert.equal(compareVersions('1.10.0', '1.9.9'), 1);
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0);
  assert.equal(compareVersions('1.9.9', '2.0.0'), -1);
});

test('release manifest and package versions stay consistent', () => {
  const manifest = json('.release-please-manifest.json');
  assert.equal(manifest['.'], json('package.json').version);
  assert.equal(manifest['.'], json('apps/client/package.json').version);
  for (const path of ['packages/builder', 'packages/types']) {
    assert.equal(manifest[path], json(`${path}/package.json`).version);
  }
});

test('partial uploads cannot make a client release public', () => {
  const asset = { name: 'yapmod-client.js', state: 'uploaded', size: 123 };
  assert.equal(hasClientBundle({ assets: [asset] }), true);
  assert.equal(hasClientBundle({ assets: [] }), false);
  assert.equal(hasClientBundle({ assets: [{ ...asset, state: 'starter' }] }), false);
  assert.equal(hasClientBundle({ assets: [{ ...asset, size: 0 }] }), false);
});
