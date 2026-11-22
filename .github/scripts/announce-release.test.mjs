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

test('announcements identify each component, preserve notes, in one embed', () => {
  for (const [tag, title] of [
    ['v1.3.0', 'Yapmod v1.3.0'],
    ['builder-v1.4.0', 'Yapmod Builder v1.4.0'],
    ['types-v1.4.0', 'Yapmod Types v1.4.0'],
  ]) {
    const message = releaseMessage({ ...release, tag_name: tag }, roleId);
    assert.equal(message.embeds.length, 1);
    assert.ok(message.embeds[0].title.includes(title));
    assert.ok(message.content.includes(`<@&${roleId}>`));
    assert.ok(message.embeds[0].description.includes('**plugins:** add collections'));
    assert.equal(
      message.components[0].components.at(-1).url,
      `https://yapmod.vercel.app/releases/client/${tag}`,
    );
    assert.equal(message.embeds[0].url, `https://yapmod.vercel.app/releases/client/${tag}`);
    assert.deepEqual(message.allowed_mentions, { parse: [], roles: [roleId] });
  }
  assert.match(
    releaseMessage({ ...release, prerelease: true }, roleId).embeds[0].title,
    /pre-release/,
  );
  assert.match(
    releaseMessage({ ...release, body: null }, roleId).embeds[0].description,
    /notes are available/,
  );
  assert.throws(() => releaseMessage({ ...release, draft: true }, roleId), /draft/);
});

test('oversized notes keep whole entries and always link to the complete changelog', () => {
  const body = '### Features\n\n' + '- **plugins:** A useful feature 🚀\n'.repeat(200);
  const { description: content } = releaseMessage({ ...release, body }, roleId).embeds[0];
  assert.ok(content.length <= 4096);
  assert.ok(content.includes('- **plugins:** A useful feature 🚀\n'));
  assert.ok(content.includes('See full release notes'));
  assert.equal(
    releaseMessage({ ...release, body }, roleId).components[0].components.at(-1).url,
    'https://yapmod.vercel.app/releases/client/v1.3.0',
  );
  const hugeLine = releaseMessage(
    { ...release, body: '### Features\n' + 'x'.repeat(5000) },
    roleId,
  );
  assert.ok(hugeLine.embeds[0].description.length <= 4096);
  assert.ok(!hugeLine.embeds[0].description.includes('### ✨ New features'));
});

test('delivery uses JSON and fails clearly without exposing the webhook credential', async () => {
  const url = 'https://www.yapin.gg/api/webhooks/test/secret';
  await sendAnnouncement(release, url, roleId, async (target, options) => {
    assert.equal(target.searchParams.get('wait'), 'true');
    assert.equal(options.method, 'POST');
    const { nonce, ...payload } = JSON.parse(options.body);
    assert.match(nonce, /^[A-Za-z0-9_-]{8,64}$/);
    assert.deepEqual(payload, releaseMessage(release, roleId));
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

test('a release batch combines all components into one bounded embed and one ping', () => {
  const releases = ['types-v2.0.0', 'v1.3.0', 'builder-v1.4.0'].map((tag) => ({
    ...release,
    tag_name: tag,
    html_url: `https://github.com/yapmod/client/releases/tag/${tag}`,
    body: '### Features\n\n' + '- A complete feature entry\n'.repeat(200),
  }));
  const message = releaseMessage(releases, roleId);
  assert.equal(message.embeds.length, 1);
  assert.equal(message.content, `Hey <@&${roleId}>!`);
  const description = message.embeds[0].description;
  assert.ok(description.length <= 4096);
  for (const item of releases)
    assert.ok(description.includes(`(https://yapmod.vercel.app/releases/client/${item.tag_name})`));
  assert.ok(description.indexOf('Yapmod v1.3.0') < description.indexOf('Yapmod Builder'));
  assert.ok(description.indexOf('Yapmod Builder') < description.indexOf('Yapmod Types'));
  assert.equal(description.match(/See full release notes/g).length, 3);
  assert.throws(() => releaseMessage([], roleId), /one to three/);
  assert.throws(() => releaseMessage([release, release], roleId), /one release per component/);
  assert.throws(() => releaseMessage([release, { ...releases[0], draft: true }], roleId), /draft/);
});

test('release banners are attached as HTTPS embed images', () => {
  const url =
    'https://raw.githubusercontent.com/yapmod/client/abc123/v1.3.0/yapmod-release-banner.png';
  assert.deepEqual(releaseMessage(release, roleId, url).embeds[0].image, { url });
  assert.throws(() => releaseMessage(release, roleId, 'file:///tmp/banner.png'), /HTTPS/);
});

test('buttons provide version-specific downloads and release links within one row', () => {
  const releases = ['v1.3.0', 'builder-v1.4.0', 'types-v2.0.0'].map((tag) => ({
    ...release,
    tag_name: tag,
    html_url: `https://github.com/yapmod/client/releases/tag/${tag}`,
    published_at: '2026-11-22T13:34:53Z',
  }));
  const message = releaseMessage(releases, roleId);
  assert.equal(message.components.length, 1);
  assert.equal(message.components[0].type, 1);
  const buttons = message.components[0].components;
  assert.equal(buttons.length, 2);
  assert.equal(
    buttons[0].url,
    'https://github.com/yapmod/client/releases/download/v1.3.0/yapmod-client.js',
  );
  for (const button of buttons) {
    assert.equal(button.type, 2);
    assert.equal(button.style, 5);
    assert.ok(button.url.startsWith('https://'));
  }
  assert.equal(message.embeds[0].timestamp, undefined);
  const typesOnly = releaseMessage(releases[2], roleId);
  assert.equal(typesOnly.components[0].components.length, 1);
  assert.ok(
    !typesOnly.components[0].components.some((button) => button.label === 'Download client'),
  );
});

test('retries can reuse the same nonce', async () => {
  const nonce = 'yapmod-workflow-123';
  const request = async (_, options) => {
    assert.equal(JSON.parse(options.body).nonce, nonce);
    return { ok: true };
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    await sendAnnouncement(
      release,
      'https://www.yapin.gg/api/webhooks/test/secret',
      roleId,
      request,
      undefined,
      nonce,
    );
  }
});

test('compact announcements omit duplicate metadata and stay within embed limits', () => {
  const releases = ['v1.3.0', 'builder-v1.4.0', 'types-v2.0.0'].map((tag) => ({
    ...release,
    tag_name: tag,
    body: '- Feature description\n'.repeat(1000),
  }));
  const embed = releaseMessage(releases, roleId).embeds[0];
  assert.equal(embed.fields, undefined);
  assert.equal(embed.author, undefined);
  assert.equal(embed.footer, undefined);
  assert.ok(embed.description.length <= 1954);
  assert.ok(embed.title.length + embed.description.length <= 6000);
});
