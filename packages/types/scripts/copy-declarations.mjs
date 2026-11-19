import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * `tsc` does not emit declaration-only source files, so the ambient
 * declarations would be missing from the published package. Copy them next
 * to the compiled entry point they are referenced from.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const declarations = [
  ['src/plugin-env/yapmod.d.ts', 'dist/plugin-env/yapmod.d.ts'],
  ['src/client-env/yapmod-client.d.ts', 'dist/client-env/yapmod-client.d.ts'],
];

for (const [from, to] of declarations) {
  const target = resolve(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, from), target);
}
