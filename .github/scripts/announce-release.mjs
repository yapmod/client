import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const siteReleases = 'https://yapmod.vercel.app/releases';
const notesUrl = (release) => `${siteReleases}/client/${encodeURIComponent(release.tag_name)}`;

const headings = {
  Features: '✨ New features',
  'Bug Fixes': '🛠️ Fixes',
  'Performance Improvements': '⚡ Performance',
  'Breaking Changes': '⚠️ Breaking changes',
};

export function formatChangelog(body) {
  return (
    (body || '')
      .replace(/\r\n/g, '\n')
      // Release Please already includes the version/date in its opening heading.
      .replace(/^## \[[^\n]+\n+/, '')
      .replace(/ \(\[[\da-f]{7,40}\]\(https:\/\/github\.com\/[^)]+\/commit\/[^)]+\)\)/g, '')
      .replace(/^\* /gm, '- ')
      .replace(/^#{2,6} (.+)$/gm, (_, heading) => `### ${headings[heading] || heading}`)
      .trim()
  );
}

function releaseEmbed(release, limit, combined) {
  if (release.draft) throw new Error('Cannot announce a draft release');
  const tag = release.tag_name;
  if (typeof tag !== 'string' || !tag || tag.length > 100 || /[\r\n]/.test(tag)) {
    throw new Error('Invalid release tag');
  }
  const url = new URL(release.html_url);
  if (url.origin !== 'https://github.com') throw new Error('Expected a GitHub release URL');
  const component = tag.startsWith('builder-v')
    ? 'Yapmod Builder'
    : tag.startsWith('types-v')
      ? 'Yapmod Types'
      : 'Yapmod';
  const version = tag.replace(/^(builder|types)-/, '');
  const title = `${component} ${version}${release.prerelease ? ' (pre-release)' : ''}`;
  const intro = combined
    ? `**[${component} ${version}${release.prerelease ? ' (pre-release)' : ''}](${notesUrl(release)})**\n\n`
    : '';
  const overflow = '\n\n*See full release notes for more.*';
  const notes =
    formatChangelog(release.body)
      .replace(/^#{1,6} .+\n*/gm, '')
      .trim() || 'Release notes are available on the website.';
  const budget = limit - intro.length;
  if (budget < overflow.length) throw new Error('Release links exceed embed size limit');
  let changelog = notes;
  if (notes.length > budget) {
    // Never cut in the middle of a link or a bullet; keep room for the release link.
    const lines = [];
    for (const line of notes.split('\n')) {
      const candidate = [...lines, line].join('\n');
      if (candidate.length > budget - overflow.length) break;
      lines.push(line);
    }
    // Avoid leaving a heading without its entries or an unclosed fenced block.
    while (lines.length && (!lines.at(-1).trim() || /^#{1,6} /.test(lines.at(-1)))) {
      lines.pop();
    }
    const fence = lines.findIndex((line) => /^\s*(```|~~~)/.test(line));
    if (fence !== -1) lines.splice(fence);
    changelog = lines.join('\n').trimEnd() + overflow;
  }
  return { title, description: intro + changelog, url: notesUrl(release), color: 0xdd5a8c };
}

const component = (release) =>
  release.tag_name?.startsWith('builder-') ? 1 : release.tag_name?.startsWith('types-') ? 2 : 0;

const button = (label, url) => ({ type: 2, style: 5, label, url });

export function releaseMessage(input, roleId, bannerUrl) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleId || '')) {
    throw new Error('Missing or invalid YAPIN_RELEASE_ROLE_ID variable');
  }
  const releases = Array.isArray(input) ? input : [input];
  if (!releases.length || releases.length > 3) throw new Error('Expected one to three releases');
  if (new Set(releases.map(component)).size !== releases.length) {
    throw new Error('Expected only one release per component');
  }
  const ordered = [0, 1, 2].flatMap((index) =>
    releases.filter((item) => component(item) === index),
  );
  const combined = ordered.length > 1;
  const limit = 650;
  const embeds = ordered.map((release) => releaseEmbed(release, limit, combined));
  const embed = combined
    ? {
        title: 'Yapmod updates',
        description: embeds.map((section) => section.description).join('\n\n'),
        color: 0xdd5a8c,
      }
    : embeds[0];
  if (bannerUrl) {
    const image = new URL(bannerUrl);
    if (image.protocol !== 'https:') throw new Error('Expected an HTTPS banner URL');
    embed.image = { url: image.href };
  }
  const buttons = [];
  const clientRelease = ordered.find((item) => component(item) === 0);
  if (clientRelease) {
    const download = new URL(clientRelease.html_url);
    download.pathname =
      download.pathname.replace('/releases/tag/', '/releases/download/') + '/yapmod-client.js';
    buttons.push(button('Download client', download.href));
  }
  buttons.push(
    button('Full release notes', combined ? `${siteReleases}#client` : notesUrl(ordered[0])),
  );
  return {
    username: 'Yapmod Releases',
    content: `Hey <@&${roleId}>!`,
    embeds: [embed],
    components: [{ type: 1, components: buttons }],
    allowed_mentions: { parse: [], roles: [roleId] },
  };
}

export async function sendAnnouncement(
  release,
  webhookUrl,
  roleId,
  request = fetch,
  bannerUrl,
  nonce = randomUUID(),
) {
  if (!webhookUrl) throw new Error('Missing YAPIN_RELEASE_WEBHOOK_URL secret');
  const url = new URL(webhookUrl);
  if (url.origin !== 'https://www.yapin.gg' || !url.pathname.startsWith('/api/webhooks/')) {
    throw new Error('Expected a Yapin webhook URL');
  }
  url.searchParams.set('wait', 'true');
  const payload = releaseMessage(release, roleId, bannerUrl);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(nonce)) throw new Error('Invalid announcement nonce');
  payload.nonce = nonce;
  let response;
  try {
    response = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // Never print the request URL: it contains the webhook credential.
    throw new Error('Yapin webhook request failed; check delivery before retrying');
  }
  if (!response.ok) throw new Error(`Yapin webhook returned HTTP ${response.status}`);
  console.log(
    `Announced ${(Array.isArray(release) ? release : [release]).map((item) => item.tag_name).join(', ')} on Yapin`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await sendAnnouncement(
    JSON.parse(readFileSync(process.argv[2], 'utf8')),
    process.env.YAPIN_RELEASE_WEBHOOK_URL,
    process.env.YAPIN_RELEASE_ROLE_ID,
    fetch,
    process.env.YAPIN_RELEASE_BANNER_URL,
    process.env.YAPIN_RELEASE_NONCE,
  );
}
