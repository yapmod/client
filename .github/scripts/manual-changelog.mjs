// Initialize the public entry point before loading a strategy (upstream CJS cycles).
import 'release-please';
import { Node } from 'release-please/build/src/strategies/node.js';

// Keep the prose intact: automation owns version headings, never note contents.
export function section(content, name) {
  const headings = [...content.matchAll(/^## (.+)$/gm)];
  const matches = headings.filter((heading) => heading[1].startsWith(`[${name}]`));
  if (matches.length !== 1) throw new Error(`Expected exactly one ## [${name}] section`);
  const heading = matches[0];
  const next = headings[headings.indexOf(heading) + 1];
  const end = next?.index ?? content.length;
  return {
    start: heading.index,
    end,
    heading: heading[0],
    body: content.slice(heading.index + heading[0].length, end).trim(),
  };
}

export function hasNotes(body) {
  return /^[-*] \S/m.test(body.replace(/<!--[\s\S]*?-->/g, ''));
}

export function promote(content, entry) {
  const pending = section(content, 'Unreleased');
  if (!hasNotes(pending.body)) throw new Error('Cannot release an empty changelog');
  return `${content.slice(0, pending.start)}## [Unreleased]\n\n${entry}\n\n${content.slice(pending.end)}`;
}

export class ManualChangelog extends Node {
  async buildReleaseNotes(_commits, version) {
    const file = await this.github.getFileContentsOnBranch(
      this.addPath(this.changelogPath),
      this.targetBranch,
    );
    const pending = section(file.parsedContent, 'Unreleased');
    if (!hasNotes(pending.body)) return '';
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return `## [${version}] — ${date}\n\n${pending.body}`;
  }

  async buildUpdates(options) {
    const path = this.addPath(this.changelogPath);
    const updates = await super.buildUpdates(options);
    return updates
      .filter((update) => update.path !== 'changelog.json')
      .map((update) =>
        update.path === path
          ? {
              ...update,
              createIfMissing: false,
              updater: {
                updateContent: (content) => promote(content, options.changelogEntry),
              },
            }
          : update,
      );
  }

  async buildRelease(pullRequest, options) {
    const release = await super.buildRelease(pullRequest, options);
    if (!release) return;
    // Read the reviewed file at the merge commit, not the editable PR description.
    const file = await this.github.getFileContentsOnBranch(
      this.addPath(this.changelogPath),
      release.sha,
    );
    const notes = section(file.parsedContent, release.tag.version.toString());
    if (!hasNotes(notes.body)) throw new Error('Cannot publish an empty changelog');
    return { ...release, notes: `${notes.heading}\n\n${notes.body}` };
  }
}
