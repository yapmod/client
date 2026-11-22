import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const tags = process.env.RELEASE_TAGS.trim().split(/\s+/);
if (
  !tags.length ||
  tags.length > 3 ||
  tags.some((tag) => !/^(?:(?:builder|types)-)?v\d+\.\d+\.\d+$/.test(tag))
) {
  throw new Error('Expected one to three stable release tags');
}
const releases = tags.map((tag) =>
  JSON.parse(
    execFileSync(
      'gh',
      ['api', `repos/${process.env.GITHUB_REPOSITORY}/releases/tags/${encodeURIComponent(tag)}`],
      { encoding: 'utf8' },
    ),
  ),
);
writeFileSync(process.argv[2], JSON.stringify(releases));
