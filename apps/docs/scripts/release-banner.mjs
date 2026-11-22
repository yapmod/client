import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createElement as h } from 'react';
import { ImageResponse } from 'takumi-js/response';

const require = createRequire(import.meta.url);
const font = (path) =>
  readFileSync(new URL(`./fonts/${path}`, pathToFileURL(require.resolve('geist/font/sans'))));
const box = (style, ...children) => h('div', { style: { display: 'flex', ...style } }, ...children);

export async function releaseBanner(releases) {
  if (!Array.isArray(releases) || !releases.length || releases.length > 3) {
    throw new Error('Expected one to three releases');
  }
  const labels = releases.map(({ tag_name: tag }) => {
    if (!/^(?:(?:builder|types)-)?v\d+\.\d+\.\d+$/.test(tag))
      throw new Error('Invalid release tag');
    return `${tag.startsWith('builder-') ? 'Builder' : tag.startsWith('types-') ? 'Types' : 'Client'} ${tag.replace(/^(builder|types)-/, '')}`;
  });
  const logo = `data:image/svg+xml;base64,${readFileSync(new URL('../public/logo.svg', import.meta.url)).toString('base64')}`;
  const response = new ImageResponse(
    box(
      {
        width: '100%',
        height: '100%',
        backgroundColor: '#0c0c0c',
        color: '#fafafa',
        position: 'relative',
        overflow: 'hidden',
        padding: 64,
        flexDirection: 'column',
        fontFamily: 'Geist',
      },
      box({
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff10 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }),
      box({
        position: 'absolute',
        width: 500,
        height: 500,
        right: -120,
        top: -70,
        borderRadius: 250,
        backgroundImage: 'radial-gradient(circle, #dd5a8c22 0%, transparent 70%)',
      }),
      box(
        { alignItems: 'center', gap: 18 },
        h('img', { src: logo, width: 55, height: 40 }),
        box({ fontSize: 26, fontWeight: 600, color: '#DD5A8C' }, 'Yapmod'),
      ),
      box(
        {
          marginTop: 44,
          fontFamily: 'Geist Pixel',
          fontSize: 76,
          lineHeight: 1.1,
          letterSpacing: -2,
        },
        'Fresh updates.',
      ),
      box({ marginTop: 18, fontSize: 28, color: '#a1a1aa' }, 'Your Yapin. More possibilities.'),
      box(
        { marginTop: 'auto', gap: 16 },
        ...labels.map((label) =>
          box(
            {
              padding: '12px 20px',
              border: '1px solid #dd5a8c55',
              borderRadius: 10,
              backgroundColor: '#dd5a8c0d',
              fontSize: 22,
              color: '#f4ccdc',
            },
            label,
          ),
        ),
      ),
      box({
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 10,
        backgroundColor: '#DD5A8C',
      }),
    ),
    {
      width: 1200,
      height: 480,
      format: 'png',
      fonts: [
        { name: 'Geist', data: font('geist-sans/Geist-Regular.ttf'), weight: 400 },
        { name: 'Geist', data: font('geist-sans/Geist-SemiBold.ttf'), weight: 600 },
        { name: 'Geist Pixel', data: font('geist-pixel/GeistPixel-Square.woff2'), weight: 400 },
      ],
    },
  );
  return new Uint8Array(await response.arrayBuffer());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2] || !process.argv[3])
    throw new Error('Usage: node apps/docs/scripts/release-banner.mjs releases.json banner.png');
  writeFileSync(
    process.argv[3],
    await releaseBanner(JSON.parse(readFileSync(process.argv[2], 'utf8'))),
  );
}
