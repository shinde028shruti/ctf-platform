/**
 * Bundles entry.mjs with esbuild (defining import.meta.env exactly as Vite
 * would) and runs the Admin Users service harness in Node.
 *
 *     node scripts/admin-users-harness/run.mjs
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
    // Vite exposes env vars through import.meta.env; mirror that here so
    // api.js resolves the base URL the same way it does in the browser.
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.example.test/api/v1'),
  },
  logLevel: 'silent',
});

await import(pathToFileURL(outfile).href);