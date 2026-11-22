import assert from 'node:assert/strict';
import test from 'node:test';
import { formatChangelog, releaseMessage, sendAnnouncement } from './announce-release.mjs';

const roleId = '33367aaa-f65b-4e1c-a870-8f0041a437dc';
const release = {
  tag_name: 'v1.3.0',
  html_url: 'https://github.com/yapmod/client/releases/tag/v1.3.0',
  draft: false,
  prerelease: false,
  body: '### Features\n\n* **plugins:** add collections',
};

test('Release Please notes keep scopes and PR links without commit noise', () => {
  const body =
    '## [1.3.0](https://github.com/yapmod/client/compare/v1.2.0...v1.3.0) (2026-11-21)\n\n' +
    '### Features\n\n* **plugins:** add collections ' +
    '([#102](https://github.com/yapmod/client/issues/102)) ' +
    '([39e4e5a](https://github.com/yapmod/client/commit/39e4e5a))';
  assert.equal(
    formatChangelog(body),
    '### ✨ New features\n\n- **plugins:** add collections ' +
      '([#102](https://github.com/yapmod/client/issues/102))',
  );
});

test('announcements identify each component, preserve notes, and contain no embeds', () => {
  for (const [tag, title] of [
    ['v1.3.0', 'Yapmod v1.3.0'],
    ['builder-v1.4.0', 'Yapmod Builder v1.4.0'],
    ['types-v1.4.0', 'Yapmod Types v1.4.0'],
  ]) {
    const message = releaseMessage({ ...release, tag_name: tag }, roleId);
    assert.ok(message.content.includes(title));
    assert.ok(message.content.includes(`<@&${roleId}>`));
    assert.ok(message.content.includes('**plugins:** add collections'));
    assert.ok(message.content.endsWith(`(${release.html_url})`));
    assert.equal(message.embeds, undefined);
    assert.deepEqual(message.allowed_mentions, { parse: [], roles: [roleId] });
  }
  assert.match(releaseMessage({ ...release, prerelease: true }, roleId).content, /pre-release/);
  assert.match(releaseMessage({ ...release, body: null }, roleId).content, /notes are available/);
  assert.throws(() => releaseMessage({ ...release, draft: true }, roleId), /draft/);
});

test('oversized notes keep whole entries and always link to the complete changelog', () => {
  const body = '### Features\n\n' + '- **plugins:** A useful feature 🚀\n'.repeat(200);
  const { content } = releaseMessage({ ...release, body }, roleId);
  assert.ok(content.length <= 2000);
  assert.ok(content.includes('- **plugins:** A useful feature 🚀\n'));
  assert.ok(content.includes('More changes'));
  assert.ok(content.endsWith(`(${release.html_url})`));
  const hugeLine = releaseMessage(
    { ...release, body: '### Features\n' + 'x'.repeat(5000) },
    roleId,
  );
  assert.ok(hugeLine.content.length <= 2000);
  assert.ok(!hugeLine.content.includes('### ✨ New features'));
});

test('delivery uses JSON and fails clearly without exposing the webhook credential', async () => {
  const url = 'https://www.yapin.gg/api/webhooks/test/secret';
  await sendAnnouncement(release, url, roleId, async (target, options) => {
    assert.equal(target.searchParams.get('wait'), 'true');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), releaseMessage(release, roleId));
    return { ok: true };
  });
  await assert.rejects(sendAnnouncement(release, ''), /Missing/);
  await assert.rejects(
    sendAnnouncement(release, url, roleId, async () => ({ ok: false, status: 429 })),
    /HTTP 429/,
  );
  await assert.rejects(
    sendAnnouncement(release, url, roleId, async () => {
      throw new Error(url);
    }),
    (error) => !error.message.includes('secret') && /check delivery/.test(error.message),
  );
});
