/* R-28 (ruled 16 November 2026): every rule that paints material by hand, per component directory.
 * Evidence for Prismata's proposals/2026-11-16-library-material-upstream.md.
 *
 *   node scripts/inventory-material.mjs inventory.json
 *   node scripts/measure-material.mjs inventory.json measured.json   # Storybook on 6006
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const audit = JSON.parse(readFileSync('docs/proposals/2026-10-02-media-text-and-recipe-parity/audit.json', 'utf8'));
const byDir = new Map();
for (const c of audit.components) if (c.directory) { if (!byDir.has(c.directory)) byDir.set(c.directory, []); byDir.get(c.directory).push(c); }
const out = [];
for (const [dir, entries] of byDir) {
  const scss = readdirSync(dir).filter((f) => f.endsWith('.scss')).map((f) => [f, readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')]);
  const rules = [];
  for (const [file, src] of scss) {
    // crude block scan: selector { body } at any depth, keep innermost blocks with material
    const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    while ((m = re.exec(src))) {
      const body = m[2], sel = m[1].trim().split('\n').pop().trim();
      const hits = [];
      if (/backdrop-filter\s*:(?!\s*none\b)/.test(body)) hits.push('backdrop-filter');
      for (const x of body.matchAll(/@include\s+(?:material\.)?(resin|frost|haze-fill|stone|plastic|field\.shell)\b[^;]*/g)) hits.push(x[0].replace('@include ', ''));
      if (/var\(--pr-(haze|stone|frost|resin)-fill\)/.test(body) && !hits.length) hits.push('fill:' + body.match(/var\(--pr-(haze|stone|frost|resin)-fill\)/)[1]);
      if (hits.length) rules.push({ file, selector: sel.slice(0, 80), hits });
    }
  }
  if (rules.length) out.push({ dir: dir.replace('src/components/', ''), entries: entries.map((e) => `${e.id}[${e.surfaces.join(',')}]`), rules });
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const n = out.reduce((a, d) => a + d.rules.length, 0);
console.log(out.length, 'directories,', n, 'rules');
const kinds = {}; for (const d of out) for (const r of d.rules) for (const h of r.hits) { const k = h.split(/[(:]/)[0]; kinds[k] = (kinds[k] ?? 0) + 1; }
console.log(kinds);
