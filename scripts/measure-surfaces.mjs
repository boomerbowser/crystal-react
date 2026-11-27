#!/usr/bin/env node
/* Where a component's surface is actually worn (R-A2).
 *
 * `audit-recipes.mjs` reads each component's own markup for the class of every
 * surface the catalogue names for it, and reports a surface it cannot find
 * there as "not worn in its own markup". Reading source cannot follow
 * composition: a card that renders a `Card` wears `.pr-haze` through it, and an
 * overlay wears `.pr-frost` only once it is open, in a portal outside the
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
 * A found class says the recipe is worn, not that it renders as Prismata's:
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

const CORE = existsSync(join(ROOT, '../prismata-design-system/core/tokens/surfaces.json'))
  ? join(ROOT, '../prismata-design-system/core') : join(ROOT, 'node_modules/@prismata/core');
const surfaces = JSON.parse(readFileSync(join(CORE, 'tokens/surfaces.json'), 'utf8')).surfaces;
const selectorFor = Object.fromEntries(surfaces.map((s) => [s.id, [...new Set(
  [s.class, ...(s.also ?? [])].filter((x) => x?.startsWith('.')).map((x) => `.${x.slice(1).split(/[.:\s[]/)[0]}`),
)].join(', ')]));

/* A surface worn under another name (R-A2, 17 November 2026). Each is the
   surface's material in a published form the class list above does not name:
   a Haze reading fill inside Frost is `.pr-frost.reading` (core 2.7.0), and a
   dialog's decision surface over a scrim is raised Haze, the dialog's own
   `::before`. `PER_ENTRY` is the same for one component, where the form is
   that component's alone: a player's time readouts are painted on Haze by
   `.pr-resin.transport`, and an editor's writing surface is the Haze well of
   its `.pr-field-shell`. */
const EQUIVALENT = { haze: ['.pr-frost.reading'], dialog: ['.pr-haze.raised'] };
const PER_ENTRY = {
  'media-controls': { haze: ['.pr-resin.transport'] },
  'video-player': { haze: ['.pr-resin.transport'] },
  'editor-block': { haze: ['.pr-field-shell'] },
};
/* What a reader does to open the surface, where it is not the story's first
   control: a hover card opens on hover, a gallery's viewer from a thumbnail, a
   player's Frost menu from its settings button, the mention list on "@". */
const OPEN = {
  'hover-card': { story: 'overlays-floating-surfaces--preview', hover: '#storybook-root a' },
  gallery: { press: '#storybook-root [role=option]' },
  'product-gallery': { press: '#storybook-root [role=option], #storybook-root button' },
  'video-player': { press: '#storybook-root button[aria-label="Settings"]' },
  'audio-player': { press: '#storybook-root button[aria-label="Settings"]' },
  mentions: { story: 'inputs-richtextsurface--with-mentions', type: ['#storybook-root [contenteditable=true]', ' @'] },
  'overflow-list': { story: 'utility-marks-and-lists--into-a-menu', press: '#storybook-root button[aria-haspopup]' },
  /* Shown in a story with the cascader, whose popover would otherwise be
     found and credited to the transfer. */
  transfer: { story: 'inputs-composite--two-lists', only: true },
  cascader: { story: 'inputs-composite--hierarchy', only: true },
};
/* The catalogue says the panel is optional ("Optional Haze panel", "Haze
   panel when grouped", "Haze panel when set apart"): the component has no
   panel of its own, and a product that groups it puts it in a card. Recorded,
   not counted as missing. */
const OPTIONAL = new Set(['fieldset', 'description-list', 'blockquote']);

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
  return [el.tagName.toLowerCase(), ...[...el.classList].filter((name) => name.startsWith('pr-')), module ? `(${module.split('_')[1]})` : '']
    .filter(Boolean).join(' ');
}, [selector, everywhere]);

const entries = {};
for (const component of todo) {
  /* Its own stories, or, for a component shown in a neighbour's file (the
     popover among the overlays), the stories named after it. */
  const own = stories.filter((s) => s.componentPath?.replace('./', '').startsWith(`${component.directory}/`));
  const named = new RegExp(`\\b${component.name.replace(/[^A-Za-z0-9 ]/g, '')}\\b`, 'i');
  /* And, for a component shown only inside a grouped story, the story files
     that import it. */
  const dir = component.directory.split('/').at(-1);
  const importRe = new RegExp(`from '(\\.\\./${dir}/|\\./)[A-Za-z]+\\.js'`);
  const importers = own.length ? [] : stories.filter((s) => s.importPath.includes(`/${dir}/`) || (existsSync(join(ROOT, s.importPath)) && importRe.test(readFileSync(join(ROOT, s.importPath), 'utf8')) && readFileSync(join(ROOT, s.importPath), 'utf8').includes(`/${dir}/`)));
  const byName = stories.filter((s) => named.test(s.name) || named.test(s.title.split('/').at(-1)));
  const mine = OPEN[component.id]?.only ? [{ id: OPEN[component.id].story }] : [...(OPEN[component.id]?.story ? [{ id: OPEN[component.id].story }] : []), ...(own.length ? own : [...byName, ...importers])]
    .filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i).slice(0, 4);
  entries[component.id] = {};
  for (const surface of component.surfaceNotWorn) {
    const selector = [selectorFor[surface], ...(EQUIVALENT[surface] ?? []), ...(PER_ENTRY[component.id]?.[surface] ?? [])].filter(Boolean).join(', ');
    if (OPTIONAL.has(component.id)) { entries[component.id][surface] = { how: 'optional', note: 'the catalogue makes the panel optional; a product that groups it wears a card' }; continue; }
    let found = { how: mine.length ? 'not-found' : 'no-story', stories: mine.map((s) => s.id) };
    for (const story of selector ? mine : []) {
      await page.goto(`${ORIGIN}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(500);
      const atRest = await describe(selector, false);
      if (atRest) { found = { how: 'child', story: story.id, element: atRest }; break; }
      const open = OPEN[component.id];
      if (open && (open.hover || open.press || open.type)) {
        const target = page.locator(open.hover ?? open.press ?? open.type[0]).first();
        if (await target.count()) {
          if (open.hover) await target.hover({ timeout: 2000 }).catch(() => {});
          else if (open.press) await target.click({ timeout: 2000 }).catch(() => {});
          else { await target.click({ timeout: 2000 }).catch(() => {}); await page.keyboard.type(open.type[1]); }
          await page.waitForTimeout(900);
          const opened = await describe(selector, true);
          if (opened) { found = { how: 'opened', story: story.id, trigger: open.hover ? 'hover' : open.press ?? `typed "${open.type[1].trim()}"`, element: opened }; break; }
        }
        continue;
      }
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
