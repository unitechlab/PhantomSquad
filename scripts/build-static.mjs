// Builds the game as a static site into out/ (STATIC_EXPORT=1 next build). Works on Windows, macOS and Linux.
// Usage: npm run build:static                 site at the root of a domain
//        npm run build:static -- /game        site in a sub-folder, e.g. https://example.com/game/
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const next = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const basePath = (process.argv[2] ?? '').replace(/\/+$/, '');
if (basePath && !/^\/[A-Za-z0-9._~\/-]+$/.test(basePath)) {
  console.error('The sub-folder must look like /game or /apps/game');
  process.exit(1);
}
const result = spawnSync(process.execPath, [next, 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, STATIC_EXPORT: '1', STATIC_BASE_PATH: basePath },
});
process.exit(result.status ?? 1);