/* Fail if the build vendored a dependency.
 *
 * A dependency missing from the externals list is inlined into `dist/` and the
 * build reports nothing. Vendoring `@crystal-ui/core` breaks CONTRACT §1: a
 * consumer resolves two copies of the token set, which can then drift.
 *
 * A bundled dependency leaves `node_modules` in the output paths, so that is the
 * signal.
 *
 *   node scripts/check-bundle.mjs
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('No dist/. Run the build first.');
  process.exit(1);
}

const vendored = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') { vendored.push(relative(ROOT, full)); continue; }
      walk(full);
    }
  }
})(DIST);

if (vendored.length) {
  console.error(`The build vendored ${vendored.length} dependency tree(s) into dist/:\n`);
  for (const path of vendored) console.error('  - ' + path);
  console.error('\nAdd the package to `external` in vite.config.ts. A dependency belongs in');
  console.error('package.json, not in the bundle — vendoring @crystal-ui/core in particular');
  console.error('would leave a consumer resolving two copies of the token set.');
  process.exit(1);
}
console.log('No vendored dependencies in dist/.');
