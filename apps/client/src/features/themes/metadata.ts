import { safeHttpUrl } from '../../lib/url';
import type { LocalTheme } from './types';

export { safeHttpUrl } from '../../lib/url';

/**
 * Metadata understood from the `/** ... *\/` header that CSS themes put at
 * the top of their files.
 */
interface ThemeHeader {
  name?: string;
  author?: string;
  description?: string;
  version?: string;
  website?: string;
  invite?: string;
}

const HEADER_FIELD = /^@([\w-]+)\s+(.*)$/;
const INVITE = /^[a-zA-Z0-9-]+$/;

/** Accepts a bare Discord invite code or a discord.gg URL, nothing else. */
export function safeInvite(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const invite = value
    .trim()
    .replace(/^https?:\/\/discord\.gg\//i, '')
    .replace(/^discord\.gg\//i, '');

  return INVITE.test(invite) ? invite : undefined;
}

function stripBom(css: string): string {
  return css.charCodeAt(0) === 0xfeff ? css.slice(1) : css;
}

function fileNameToName(fileName: string): string {
  return fileName.replace(/\.theme\.css$/i, '').replace(/\.css$/i, '');
}

/**
 * Reads the first documentation block and turns its `@field value` lines
 * into a header. Continuation lines are appended to the previous field, so
 * wrapped descriptions survive the round trip.
 */
function readHeader(css: string): ThemeHeader {
  const block = /\/\*\*([\s\S]*?)\*\//.exec(css)?.[1];
  if (!block) return {};

  const header: ThemeHeader = {};
  let field = '';

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*\*?\s?/, '').trimEnd();
    if (!line) continue;

    const match = HEADER_FIELD.exec(line);
    if (match) {
      field = match[1] ?? '';
      const value = match[2] ?? '';
      if (field) header[field as keyof ThemeHeader] = value.trim();
      continue;
    }

    if (field) {
      const previous = header[field as keyof ThemeHeader] ?? '';
      header[field as keyof ThemeHeader] = `${previous} ${line.trim()}`.trim();
    }
  }

  return header;
}

/**
 * Builds the theme record shown in the settings page from an uploaded file.
 *
 * Missing metadata falls back to the file name and consistent placeholders,
 * so every theme card has a title and an author line.
 */
export function createLocalTheme(fileName: string, rawCss: string): LocalTheme {
  const css = stripBom(rawCss);
  const header = readHeader(css);

  return {
    fileName,
    name: header.name?.trim() || fileNameToName(fileName),
    author: header.author?.trim() || 'Unknown Author',
    description: header.description?.trim() || 'A Yapin theme.',
    version: header.version?.trim() || undefined,
    website: safeHttpUrl(header.website?.trim()),
    invite: safeInvite(header.invite?.trim()),
    css,
  };
}
