/* Fail the build on a name the installed @crystal-ui/core does not publish.
 *
 * Every fact the site states about Crystal is generated from the package, but a
 * page can still name a class in its markup (`cr-haze`, `cr-nav-item`) or a
 * surface by its id. Each must exist in the installed core, so a page written
 * against a vocabulary core has since changed fails here rather than rendering a
 * class that paints nothing (§3.10: parity is structural, not a review).
 *
 *   node scripts/check-names.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require = createRequire(import.meta.url);
const coreCss = readFileSync(require.resolve('@crystal-ui/core/css'), 'utf8');
const vocabulary = require('@crystal-ui/core/surfaces').surfaces;
const catalogue = require('@crystal-ui/core/catalogue');

const published = new Set([...coreCss.matchAll(/\.(cr-[a-z0-9-]+)/g)].map((m) => m[1]));
const surfaceIds = new Set(vocabulary.map((s) => s.id));

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : /\.(tsx?|mdx)$/.test(name) ? [path] : [];
});

const failures = [];
for (const path of [...files(join(ROOT, 'app')), ...files(join(ROOT, 'lib'))]) {
  const code = readFileSync(path, 'utf8');
  for (const [, name] of code.matchAll(/["'`\s](cr-[a-z0-9-]+)(?=["'`\s.])/g)) {
    if (!published.has(name)) failures.push(`${relative(ROOT, path)}: class "${name}" is not in @crystal-ui/core's stylesheet`);
  }
  for (const [, id] of code.matchAll(/\b(?:surface|madeOf)\(\s*'([a-z-]+)'\s*\)/g)) {
    if (!surfaceIds.has(id)) failures.push(`${relative(ROOT, path)}: surface "${id}" is not in @crystal-ui/core's vocabulary`);
  }
}
for (const category of catalogue.categories) for (const entry of category.components) {
  for (const id of entry.surface) if (!surfaceIds.has(id)) failures.push(`catalogue ${entry.id}: surface "${id}" is not in the vocabulary`);
}

console.log(JSON.stringify({ suite: 'names the installed core publishes', core: catalogue.version, classes: published.size, surfaces: surfaceIds.size, failures }, null, 2));
if (failures.length) process.exit(1);
