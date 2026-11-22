import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

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

export function releaseMessage(release, roleId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleId || '')) {
    throw new Error('Missing or invalid YAPIN_RELEASE_ROLE_ID variable');
  }
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
  const title = `## 🚀 ${component} ${version} is here!${release.prerelease ? ' (pre-release)' : ''}`;
  const subject = component === 'Yapmod' ? 'the client' : component;
  const intro = `${title}\n\nHey <@&${roleId}>, here’s what’s new in ${subject}.\n\n`;
  const linkLabel = component === 'Yapmod' ? 'Read the release & download' : 'Read the release';
  const footer = `\n\n→ [${linkLabel}](${url.href})`;
  const overflow = '\n\n*More changes in the full release below.*';
  const notes = formatChangelog(release.body) || 'Release notes are available on GitHub.';
  const budget = 2000 - intro.length - footer.length;
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
  return {
    username: 'Yapmod Releases',
    content: intro + changelog + footer,
    allowed_mentions: { parse: [], roles: [roleId] },
  };
}

export async function sendAnnouncement(release, webhookUrl, roleId, request = fetch) {
  if (!webhookUrl) throw new Error('Missing YAPIN_RELEASE_WEBHOOK_URL secret');
  const url = new URL(webhookUrl);
  if (url.origin !== 'https://www.yapin.gg' || !url.pathname.startsWith('/api/webhooks/')) {
    throw new Error('Expected a Yapin webhook URL');
  }
  url.searchParams.set('wait', 'true');
  const payload = releaseMessage(release, roleId);
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
  console.log(`Announced ${release.tag_name} on Yapin`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await sendAnnouncement(
    JSON.parse(readFileSync(process.argv[2], 'utf8')),
    process.env.YAPIN_RELEASE_WEBHOOK_URL,
    process.env.YAPIN_RELEASE_ROLE_ID,
  );
}
