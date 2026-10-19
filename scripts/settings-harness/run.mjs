/**
 * Bundles entry.mjs with esbuild (defining import.meta.env exactly as Vite
 * would) and runs the Phase 11 account-settings harness in Node.
 *
 *     node scripts/settings-harness/run.mjs
 */

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.join(here, 'out', 'harness.mjs');

await build({
  entryPoints: [path.join(here, 'entry.mjs')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outdir: undefined,
  outfile,
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.example.test/api/v1'),
  },
  logLevel: 'silent',
});

await import(pathToFileURL(outfile).href);
