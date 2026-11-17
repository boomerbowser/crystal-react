/* R-28 phase 2: the computed material of each converted element, in every mode,
 * so wearing a Crystal variant in place of a hand-written rule can be shown to
 * change nothing. Run before and after the conversion, then compare.
 *
 *   node scripts/snapshot-material.mjs targets.json before.json   # Storybook on 6006
 *   node scripts/snapshot-material.mjs --diff before.json after.json
 *
 * targets.json: [{ "dir": "Alert", "base": "alert" }, ...]. `base` is the CSS
 * module class; every element whose class contains `_base_` in the first story
 * that renders one is captured, up to four per story.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

if (process.argv[2] === '--diff') {
  const a = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const b = JSON.parse(readFileSync(process.argv[4], 'utf8'));
  let n = 0;
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(key in a) || !(key in b)) { console.log(`${key}: only in ${key in a ? 'before' : 'after'}`); n++; continue; }
    /* Wearing a Crystal surface makes an element `position: relative` and
       `isolation: isolate`. With no offsets that moves nothing on screen, so a
       static element that becomes relative is reported once, not per inset. */
    const moved = a[key].position === 'static' && b[key].position === 'relative';
    if (moved) console.log(`${key} position static -> relative (no offsets; layout-neutral)`);
    for (const prop of Object.keys(a[key])) {
      if (moved && ['position', 'isolation', 'top', 'left', 'right', 'bottom'].includes(prop)) continue;
      if (a[key][prop] !== b[key][prop]) { console.log(`${key} ${prop}\n  before ${a[key][prop]}\n  after  ${b[key][prop]}`); n++; }
    }
  }
  console.log(`${n} difference(s)`);
  process.exit(n ? 1 : 0);
}

const targets = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const index = await (await fetch('http://localhost:6006/index.json')).json();
const stories = Object.values(index.entries).filter((e) => e.type === 'story');
const PROPS = ['display', 'position', 'isolation', 'background-color', 'background-image', 'backdrop-filter', 'filter', 'opacity',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'transform-origin', 'z-index', 'top', 'left', 'right', 'bottom', 'content', 'width', 'height',
  'color', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'column-gap', 'row-gap', 'font-weight'];
const MODES = {
  light: { globals: 'mode:light' },
  dark: { globals: 'mode:dark' },
  opaque: { globals: 'mode:light;effects:opaque' },
  reducedTransparency: { globals: 'mode:light', media: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] },
  forcedColors: { globals: 'mode:light', media: [{ name: 'forced-colors', value: 'active' }] },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const cdp = await page.context().newCDPSession(page);
const out = {};
for (const t of targets) {
  const dir = 'src/components/' + t.dir + '/';
  /* A component shown only inside a grouped story is found by the story files
     that import it, as `measure-material.mjs` finds them. */
  const importRe = new RegExp("from '(\\.\\./" + t.dir + "/|\\./)" + t.dir + "\\.js'");
  const importers = new Set([...new Set(stories.map((s) => s.importPath))].filter((file) => importRe.test(readFileSync(file, 'utf8'))));
  const mine = [...stories.filter((s) => (s.componentPath ?? s.importPath ?? '').replace('./', '').startsWith(dir)), ...stories.filter((s) => importers.has(s.importPath))]
    .filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i).slice(0, 8);
  if (t.story) mine.unshift({ id: t.story });
  let found = false;
  for (const [mode, m] of Object.entries(MODES)) {
    await cdp.send('Emulation.setEmulatedMedia', { features: m.media ?? [] });
    for (const s of found ? [found] : mine) {
      await page.goto(`http://localhost:6006/iframe.html?id=${s.id}&viewMode=story&globals=${m.globals}`, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(700);
      const sel = `[class*="_${t.base}_"]`;
      if (!(await page.$(sel)) && t.open !== false) {
        const trigger = page.locator(t.trigger ?? '#storybook-root [aria-haspopup], #storybook-root button').first();
        if (await trigger.count()) { await trigger.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(800); }
      }
      if (!(await page.$(sel))) continue;
      found = s;
      const shots = await page.$$eval(sel, (els, PROPS) => els.slice(0, 4).map((el) => {
        const rec = {};
        for (const L of ['', '::before', '::after']) {
          const c = getComputedStyle(el, L || null);
          /* A layer that is not drawn is absent, whichever way it was removed. */
          if (L && (c.content === 'none' || c.display === 'none')) { rec[L + ' content'] = 'none'; continue; }
          for (const p of PROPS) rec[(L ? L + ' ' : '') + p] = c.getPropertyValue(p);
        }
        return rec;
      }), PROPS);
      shots.forEach((rec, i) => { out[`${t.dir}.${t.base}#${i}|${mode}`] = { story: s.id, ...rec }; });
      break;
    }
    if (!found) { console.error(`${t.dir}.${t.base}: no story renders it`); break; }
  }
}
await browser.close();
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(`${Object.keys(out).length} element-mode records`);
