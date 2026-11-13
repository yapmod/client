import { fileURLToPath } from 'node:url';

import { buildPlugin } from '../src/index.ts';

const entry = fileURLToPath(new URL('./hello/index.tsx', import.meta.url));
const outfile = fileURLToPath(new URL('./hello/dist/plugin.js', import.meta.url));

const expression = await buildPlugin({ entry, outfile });
console.log(`built ${outfile} (${expression.length} bytes)`);
