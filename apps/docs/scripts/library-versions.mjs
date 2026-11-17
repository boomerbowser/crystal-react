/* The versions this site states, resolved from the npm registry.
 *
 * The list of Crystal's component libraries is Crystal's
 * (`@crystal-ui/core/libraries`); a version is the package's own and is not in
 * that list, so it is asked of the registry here and written to
 * `lib/library-versions.json`, which the pages read at build time. Committed, so
 * a build is offline and reproducible; refreshed by
 * `.github/workflows/follow-crystal.yml` at the repository root, the same way
 * crystal-preview's is.
 *
 *   node apps/docs/scripts/library-versions.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../lib/library-versions.json');
const require = createRequire(import.meta.url);
const { libraries } = require('@crystal-ui/core/libraries');

/* The `latest` tag, or, for a package published only under a pre-release tag
   (an alpha), that tag's version. */
function published(name) {
  const tags = JSON.parse(execFileSync('npm', ['view', name, 'dist-tags', '--json'], { encoding: 'utf8' }));
  return tags.latest ?? Object.values(tags)[0] ?? null;
}

const packages = {};
for (const name of ['@crystal-ui/core', ...libraries.map((l) => l.package).filter(Boolean)]) packages[name] = published(name);
const next = `${JSON.stringify({ $description: 'Published versions of Crystal and its component libraries, from the npm registry. Written by scripts/library-versions.mjs; refreshed by follow-crystal.yml. Never edit by hand.', packages }, null, 2)}\n`;
let previous = '';
try { previous = readFileSync(OUT, 'utf8'); } catch { /* first run */ }
if (next !== previous) writeFileSync(OUT, next);
console.log(JSON.stringify({ packages, changed: next !== previous }, null, 2));
