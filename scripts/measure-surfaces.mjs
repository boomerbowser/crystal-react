#!/usr/bin/env node
/* Where a component's surface is actually worn (R-A2).
 *
 * `audit-recipes.mjs` reads each component's own markup for the class of every
 * surface the catalogue names for it, and reports a surface it cannot find
 * there as "not worn in its own markup". Reading source cannot follow
 * composition: a card that renders a `Card` wears `.cr-haze` through it, and an
 * overlay wears `.cr-frost` only once it is open, in a portal outside the
 * component. So this asks the built stories.
 *
 * For each implemented entry with a surface the static reading did not find, it
 * opens the stories whose component lives in the entry's directory (up to
 * four), and looks in the rendered document for the surface's class. Not found
 * at rest, it presses the story's first trigger (a control with `aria-haspopup`,
 * or else its first button) and looks again, across the whole document, because
 * an overlay is portalled. What it finds is written, with the story and the
 * element, to `surfaces-measured.json` beside the audit, and
 * `audit-recipes.mjs` gives every entry its reason from it.
 *
 * A found class says the recipe is worn, not that it renders as Crystal's:
 * `verify:materials` and `verify:appearance` measure that, for the surfaces
 * they name.
 *
 *   node scripts/measure-surfaces.mjs        # Storybook on 6006
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/measure-surfaces.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';
const PLAN = join(ROOT, 'docs/proposals/2026-10-02-media-text-and-recipe-parity');
const OUT = join(PLAN, 'surfaces-measured.json');

/* The audit's own reading, fresh, so this measures what it reports. */
const scratch = join(ROOT, 'node_modules/.cache/audit-for-surfaces.json');
execFileSync('node', [join(ROOT, 'scripts/audit-recipes.mjs'), '--json', scratch], { stdio: 'ignore' });
const audit = JSON.parse(readFileSync(scratch, 'utf8'));

const CORE = existsSync(join(ROOT, '../crystal-design-system/core/tokens/surfaces.json'))
  ? join(ROOT, '../crystal-design-system/core') : join(ROOT, 'node_modules/@crystal-ui/core');
const surfaces = JSON.parse(readFileSync(join(CORE, 'tokens/surfaces.json'), 'utf8')).surfaces;
const selectorFor = Object.fromEntries(surfaces.map((s) => [s.id, [...new Set(
  [s.class, ...(s.also ?? [])].filter((x) => x?.startsWith('.')).map((x) => `.${x.slice(1).split(/[.:\s[]/)[0]}`),
)].join(', ')]));

const index = await (await fetch(`${ORIGIN}/index.json`)).json();
const stories = Object.values(index.entries).filter((e) => e.type === 'story');
const todo = audit.components.filter((c) => c.status === 'implemented' && c.surfaceNotWorn?.length);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const describe = (selector, everywhere) => page.evaluate(([selector, everywhere]) => {
  const scope = everywhere ? document.body : document.querySelector('#storybook-root');
  const el = scope?.querySelector(selector);
  if (!el) return null;
  const module = [...el.classList].find((name) => /^_[a-zA-Z]+_[a-z0-9]+_\d+$/.test(name));
  return [el.tagName.toLowerCase(), ...[...el.classList].filter((name) => name.startsWith('cr-')), module ? `(${module.split('_')[1]})` : '']
    .filter(Boolean).join(' ');
}, [selector, everywhere]);

const entries = {};
for (const component of todo) {
  /* Its own stories, or, for a component shown in a neighbour's file (the
     popover among the overlays), the stories named after it. */
  const own = stories.filter((s) => s.componentPath?.replace('./', '').startsWith(`${component.directory}/`));
  const named = new RegExp(`\\b${component.name.replace(/[^A-Za-z0-9 ]/g, '')}\\b`, 'i');
  const mine = (own.length ? own : stories.filter((s) => named.test(s.name) || named.test(s.title.split('/').at(-1)))).slice(0, 4);
  entries[component.id] = {};
  for (const surface of component.surfaceNotWorn) {
    const selector = selectorFor[surface];
    let found = { how: mine.length ? 'not-found' : 'no-story', stories: mine.map((s) => s.id) };
    for (const story of selector ? mine : []) {
      await page.goto(`${ORIGIN}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(500);
      const atRest = await describe(selector, false);
      if (atRest) { found = { how: 'child', story: story.id, element: atRest }; break; }
      const trigger = page.locator('#storybook-root [aria-haspopup]:not([aria-disabled=true]), #storybook-root button:not([disabled])').first();
      if (await trigger.count()) {
        const name = ((await trigger.getAttribute('aria-label')) ?? (await trigger.textContent()) ?? '').trim().slice(0, 40);
        await trigger.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(700);
        const opened = await describe(selector, true);
        if (opened) { found = { how: 'opened', story: story.id, trigger: name, element: opened }; break; }
      }
    }
    entries[component.id][surface] = found;
  }
}
await browser.close();

writeFileSync(OUT, `${JSON.stringify({
  $description: 'Where each surface that audit-recipes.mjs did not find in a component\'s own markup is worn, measured in the built stories by scripts/measure-surfaces.mjs. "child": worn by an element the component renders; "opened": worn once the story\'s trigger is pressed; "not-found" and "no-story": not seen.',
  measured: new Date().toISOString().slice(0, 10),
  storybook: ORIGIN,
  entries,
}, null, 2)}\n`);
const counts = {};
for (const bySurface of Object.values(entries)) for (const { how } of Object.values(bySurface)) counts[how] = (counts[how] ?? 0) + 1;
console.log(JSON.stringify({ entries: todo.length, surfaces: counts, wrote: OUT.slice(ROOT.length + 1) }, null, 2));
