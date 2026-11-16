/* R-28 (ruled 16 November 2026): each hand-painted element against a twin wearing its Crystal surface, in the built stories.
 * Evidence for Crystal's proposals/2026-11-16-library-material-upstream.md.
 *
 *   node scripts/inventory-material.mjs inventory.json
 *   node scripts/measure-material.mjs inventory.json measured.json   # Storybook on 6006
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const inv = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const index = await (await fetch('http://localhost:6006/index.json')).json();
const stories = Object.values(index.entries).filter((e) => e.type === 'story');
const CLASS = { 'field.shell': 'cr-field-shell', 'material.resin': 'cr-resin', 'material.frost': 'cr-frost', 'material.haze-fill': 'cr-haze', 'fill:haze': 'cr-haze' };
function classFor(rule, entries) {
  const s = entries.join(' '), sel = rule.selector;
  for (const h of rule.hits) { const k = h.split('(')[0]; if (CLASS[k]) return CLASS[k]; }
  if (/scrim/i.test(sel)) return 'cr-mirage';
  if (/resin-panel/.test(s)) return 'cr-resin panel';
  if (/\[table\]/.test(s)) return 'cr-table-scroll';
  if (/frost/.test(s) && /(panel|sidebar|appBar|rail|popover|tooltip|arrow)/i.test(sel)) return 'cr-frost';
  if (/choice/.test(s)) return null; // element-painted
  if (/control/.test(s) || /(button|page|arrow|burger|floating)/i.test(sel)) return 'cr-button';
  if (/resin/.test(s)) return 'cr-resin';
  if (/frost/.test(s)) return 'cr-frost';
  return null;
}
const PROPS = ['backgroundColor', 'backgroundImage', 'backdropFilter', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'boxShadow'];
const LAYER = ['content', 'backgroundColor', 'backgroundImage', 'filter', 'top', 'left', 'opacity', 'boxShadow'];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];
for (const d of inv) {
  const dir = 'src/components/' + d.dir + '/';
  const importRe = new RegExp("from '(\\.\\./" + d.dir + "/|\\./)" + d.dir + "\\.js'");
  const importers = [...new Set(stories.map((s) => s.importPath))].filter((file) => file.replace('./', '').startsWith(dir) || importRe.test(readFileSync(file, 'utf8')));
  const mine = [...stories.filter((s) => (s.componentPath ?? '').replace('./', '').startsWith(dir)), ...stories.filter((s) => importers.includes(s.importPath))]
    .filter((s, i, a) => a.findIndex((t) => t.id === s.id) === i).slice(0, 6);
  const seen = new Set();
  for (const rule of d.rules) {
    const base = rule.selector.replace(/:global\([^)]*\)\s*/g, '').match(/\.([a-zA-Z][\w-]*)/)?.[1];
    if (!base || seen.has(base + rule.hits.join())) continue; seen.add(base + rule.hits.join());
    const cls = classFor(rule, d.entries);
    const row = { dir: d.dir, selector: rule.selector, hits: rule.hits, core: cls };
    if (!cls) { row.result = 'element-painted (choice): compared separately'; results.push(row); continue; }
    let done = false;
    for (const s of mine) {
      await p.goto(`http://localhost:6006/iframe.html?id=${s.id}&viewMode=story`, { waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(600);
      let found = await p.$(`[class*="_${base}_"]`);
      if (!found) { const t = p.locator('#storybook-root [aria-haspopup], #storybook-root button').first(); if (await t.count()) { await t.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(700); found = await p.$(`[class*="_${base}_"]`); } }
      if (!found) continue;
      row.story = s.id;
      row.diff = await p.evaluate(([el, cls, PROPS, LAYER]) => {
        const twin = document.createElement(el.tagName); twin.className = cls; twin.textContent = 'x';
        twin.style.cssText = `position:absolute;left:-9999px;width:${el.offsetWidth}px;height:${el.offsetHeight}px`;
        el.parentElement.append(twin);
        const out = [];
        const a = getComputedStyle(el), c = getComputedStyle(twin);
        for (const k of PROPS) if (a[k] !== c[k]) out.push(`${k}: ${a[k].slice(0, 70)} | core ${c[k].slice(0, 70)}`);
        for (const L of ['::before', '::after']) { const x = getComputedStyle(el, L), y = getComputedStyle(twin, L); if (x.content === 'none' && y.content === 'none') continue; for (const k of LAYER) if (x[k] !== y[k]) out.push(`${L} ${k}: ${String(x[k]).slice(0, 60)} | core ${String(y[k]).slice(0, 60)}`); }
        twin.remove(); return out;
      }, [found, cls, PROPS, LAYER]);
      done = true; break;
    }
    if (!done) row.result = mine.length ? 'element not found in its stories' : 'no stories';
    results.push(row);
  }
}
await b.close();
writeFileSync(process.argv[3], JSON.stringify(results, null, 1));
const same = results.filter((r) => r.diff && r.diff.length === 0).length, diff = results.filter((r) => r.diff?.length).length;
console.log(results.length, 'elements;', same, 'identical to core;', diff, 'differ;', results.filter((r) => r.result).length, 'unmeasured');
