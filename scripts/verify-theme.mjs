/* Every custom property the library reads must resolve, in a browser, on every
 * element that reads it.
 *
 * `src/theme/published-properties.test.tsx` already mounts a provider and checks
 * that each `var(--cr-…)` in the stylesheets is one the provider writes. That is
 * a real check and it catches the defect it was written for — the focus ring that
 * painted on nothing for a whole slice. It cannot catch three things:
 *
 *   1. **The overlay container.** React Aria portals a popover, a menu, a
 *      tooltip, a dialog, a drawer and the command palette to `document.body`,
 *      outside the scope element, so the provider stamps a second element for
 *      them. A property written to the scope and not to that container resolves
 *      to nothing on every overlay in the library while resolving correctly
 *      everywhere a unit test looks.
 *   2. **A value that is present but not usable.** jsdom records the property
 *      name; only a browser computes `blur(var(--cr-frost-blur))` and decides
 *      whether it is a filter or a syntax error.
 *   3. **A stale bundle.** A dev server serving an hour-old copy of
 *      `@crystal-ui/core` reports missing properties that are present in the source.
 *      That has now happened three times in this project, once far enough to
 *      start a wrong diagnosis, and it is indistinguishable from a real defect
 *      without something that checks the served page.
 *
 *   node scripts/verify-theme.mjs
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/verify-theme.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';

/* Properties a component sets on itself in the same breath as reading them — a
   grid's column count, a tree row's depth. Kept in step with the same list in
   `published-properties.test.tsx`; a property that appears in one and not the
   other is a property somebody should look at twice. */
const LOCAL = /^--cr-(angle|arc|arc-from|aspect|progress|fraction|strength|strength-colour|clamp-lines|fill-start|fill-size|cell-min|cell-span|cell-span-sm|cell-span-md|grid-columns|grid-gap|masonry-columns|masonry-columns-md|masonry-gap|container-max|shell-sidebar|stack-gap|toolbar-gap|overflow-gap|text-size|text-leading|text-tracking|title-size|title-leading|title-tracking|watermark-image|watermark-opacity|watermark-size|scroll-fade-start|scroll-fade-end|tree-level|toc-level)$/;

function stylesheetsUnder(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...stylesheetsUnder(path));
    else if (entry.name.endsWith('.scss')) found.push(path);
  }
  return found;
}

const read = new Set();
for (const file of stylesheetsUnder(resolve(process.cwd(), 'src'))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/var\((--cr-[a-z0-9-]+)/g)) {
    if (!LOCAL.test(match[1])) read.add(match[1]);
  }
}
const names = [...read].sort();

const failures = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

/* A story with an overlay open, so both the scope and the portalled container
   exist at the same moment and can be asked the same question. */
await page.goto(
  `${ORIGIN}/iframe.html?id=overlays-command-palette--palette&viewMode=story`,
  { waitUntil: 'networkidle' },
);
/* The requirement is an overlay on screen, not a particular route to one.
 *
 * Kept conditional after a lesson worth recording. A `play` function was added
 * to this story, it opened the palette on load, and this gate's click then
 * landed on the scrim and timed out. The first fix was this condition — which
 * accommodated the problem instead of removing it. The real fix was moving the
 * play to a story of its own, and `verify-stories` now fails any story that a
 * measurement gate probes and that carries a play. The condition stays because
 * it costs nothing and describes the actual requirement. */
const dialog = page.locator('[role="dialog"]');
if (await dialog.count() === 0) {
  await page.getByRole('button', { name: 'Open the palette' }).click();
}
await dialog.first().waitFor({ timeout: 10000 });

const result = await page.evaluate((wanted) => {
  const scope = document.querySelector('#storybook-root [data-crystal-scope]');
  const overlays = document.querySelector('[data-crystal-overlays]');
  const missing = { scope: [], overlays: [] };
  if (!scope) return { error: 'no themed scope in the story' };
  if (!overlays) return { error: 'no overlay container, though an overlay is open' };

  const scopeStyle = getComputedStyle(scope);
  const overlayStyle = getComputedStyle(overlays);
  for (const name of wanted) {
    if (!scopeStyle.getPropertyValue(name).trim()) missing.scope.push(name);
    if (!overlayStyle.getPropertyValue(name).trim()) missing.overlays.push(name);
  }
  return { missing, counted: wanted.length };
}, names);

if (result.error) {
  failures.push(result.error);
} else {
  if (result.missing.scope.length) {
    failures.push(
      `${result.missing.scope.length} propert(ies) the stylesheets read resolve to nothing on `
      + `the themed scope: ${result.missing.scope.join(', ')}`,
    );
  }
  if (result.missing.overlays.length) {
    failures.push(
      `${result.missing.overlays.length} propert(ies) resolve to nothing on the overlay `
      + `container, so every portalled surface loses them: ${result.missing.overlays.join(', ')}`,
    );
  }
}

/* The materials, computed rather than declared. A `backdrop-filter` built from a
   property that does not resolve is not a weaker blur — it is a syntax error, and
   the surface renders as a flat translucent fill with no diffusion at all. That
   is exactly what happened when `-webkit-backdrop-filter` was written beside the
   standard property and the minifier kept the wrong one, and it was invisible in
   every test. */
const materials = await page.evaluate(() => {
  const palette = document.querySelector('[role="dialog"]');
  const field = palette?.querySelector('[class*="field"]');
  const scrim = palette?.closest('[class*="scrim"]');
  const filterOf = (el) => (el ? getComputedStyle(el).backdropFilter : 'no element');
  return {
    resin: filterOf(field),
    mirage: filterOf(scrim),
    haze: palette ? getComputedStyle(palette, '::before').filter : 'no element',
  };
});

for (const [material, value] of Object.entries(materials)) {
  const usable = value !== 'none' && value !== '' && !value.includes('var(');
  if (!usable) {
    failures.push(
      `${material} computed to "${value}" — a filter built from a property that does not `
      + 'resolve is a syntax error, and the surface renders flat with no diffusion at all',
    );
  }
}

await browser.close();

console.log(JSON.stringify({
  suite: 'theme at runtime',
  propertiesRead: names.length,
  materials,
  failures,
}, null, 2));

if (failures.length) {
  console.error('\nThe theme a browser resolves is not the theme the stylesheets were written against.');
  console.error('If the source looks right, clear the dev server\'s cache before believing this:');
  console.error('  rm -rf node_modules/.cache/storybook node_modules/.vite');
  process.exit(1);
}
