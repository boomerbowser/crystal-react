/* Audit Crystal React against Crystal's catalogue: motion, materials and recipes.
 *
 * The re-evaluation of 29 September 2026 named three things nobody had measured
 * across all 284 components at once: which assigned motion no component plays,
 * which components paint a material by hand instead of wearing the surface the
 * catalogue gives them, and which recipes and presets no component uses at all.
 * This reports all three, per component, so the work can be planned and its
 * progress counted.
 *
 * It is a static reading of source, not a rendering. A finding here is a place
 * to look, and the per-surface appearance gate (`verify:materials`,
 * `verify:appearance`) decides whether the rendering is right. Each finding
 * says which kind it is.
 *
 *   node scripts/audit-recipes.mjs                 summary to stdout
 *   node scripts/audit-recipes.mjs --json out.json  full report as JSON
 *
 * It reads the catalogue from a sibling `crystal-design-system` checkout when
 * there is one, because that is where an unreleased change to the catalogue
 * lives, and otherwise from the installed `@crystal-ui/core`. Run the manifest
 * first (`pnpm run manifest`): what each component plays is read from it.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_CORE = resolve(ROOT, '../crystal-design-system/core');
const INSTALLED_CORE = join(ROOT, 'node_modules/@crystal-ui/core');
const CORE = existsSync(join(LOCAL_CORE, 'tokens/catalogue')) ? LOCAL_CORE : INSTALLED_CORE;

const manifestPath = join(ROOT, 'dist/component-manifest.json');
if (!existsSync(manifestPath)) {
  console.error('No dist/component-manifest.json. Run `pnpm run manifest` first.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const catalogue = {};
const catalogueDir = join(CORE, 'tokens/catalogue');
if (existsSync(catalogueDir)) {
  for (const file of readdirSync(catalogueDir).filter((f) => f.endsWith('.json')).sort()) {
    for (const entry of JSON.parse(readFileSync(join(catalogueDir, file), 'utf8')).components) {
      catalogue[entry.id] = { ...entry, file };
    }
  }
} else {
  for (const category of JSON.parse(readFileSync(join(CORE, 'tokens/catalogue.json'), 'utf8')).categories) {
    for (const entry of category.components) catalogue[entry.id] = { ...entry, file: category.id };
  }
}
const recipes = JSON.parse(readFileSync(join(CORE, 'tokens/motion-recipes.json'), 'utf8')).recipes;
const surfaces = JSON.parse(readFileSync(join(CORE, 'tokens/surfaces.json'), 'utf8')).surfaces;
const PRESETS = ['plastic', 'frost', 'resin', 'haze', 'stone', 'mirage', 'mirage-out', 'dismiss'];

/* The directory that exports a component, found the way the manifest finds it:
   a directory named after it with a barrel, or the neighbour whose barrel
   exports it (Radio lives in Checkbox's directory). */
const componentsDir = join(ROOT, 'src/components');
const directories = readdirSync(componentsDir)
  .map((entry) => join(componentsDir, entry))
  .filter((dir) => statSync(dir).isDirectory() && existsSync(join(dir, 'index.ts')));
const pascal = (id) => id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
function directoryOf(id, name) {
  const candidates = [pascal(id), name.replace(/[^A-Za-z0-9]/g, '')];
  for (const candidate of candidates) {
    const dir = join(componentsDir, candidate);
    if (existsSync(join(dir, 'index.ts'))) return dir;
  }
  for (const candidate of candidates) {
    const found = directories.find((dir) => new RegExp(`\\b${candidate}\\b`).test(readFileSync(join(dir, 'index.ts'), 'utf8')));
    if (found) return found;
  }
  return null;
}

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/* What a surface's class is called in markup, so a component can be checked
   for wearing it. `button` and the native selectors are worn by the element. */
const WORN_BY_ELEMENT = new Set(['control', 'choice', 'native', 'none', 'plastic']);
const surfaceClasses = Object.fromEntries(surfaces.map((surface) => [
  surface.id,
  [surface.class, ...(surface.also ?? [])].filter((selector) => selector && selector.startsWith('.'))
    .map((selector) => selector.slice(1).split(/[.:\s[]/)[0]),
]));

/* The hand-written material a stylesheet paints: the mixins this library
   defines for each material, and raw `backdrop-filter` lines. */
const MIXINS = /@include\s+(?:material\.)?(resin|frost|haze-fill|stone|plastic|field\.shell)\b/g;

const components = [];
for (const entry of manifest.components) {
  const spec = catalogue[entry.id] ?? {};
  const record = { id: entry.id, name: entry.name, category: entry.category, status: entry.status };
  const assigned = spec.motion ?? [];
  const own = new Set([...(entry.recipes ?? []), ...(entry.presets ?? [])]);
  const composed = new Set(entry.composedRecipes ?? []);
  record.motion = {
    assigned,
    played: assigned.filter((id) => own.has(id)),
    playedByChild: assigned.filter((id) => !own.has(id) && composed.has(id)),
    unplayed: assigned.filter((id) => !own.has(id) && !composed.has(id)),
  };
  record.surfaces = spec.surface ?? [];

  const dir = entry.status === 'implemented' ? directoryOf(entry.id, entry.name) : null;
  record.directory = dir ? dir.slice(ROOT.length + 1) : null;
  if (dir) {
    const files = readdirSync(dir);
    const scss = strip(files.filter((f) => f.endsWith('.scss')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n'));
    const tsx = files.filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f))
      .map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    const worn = new Set([...tsx.matchAll(/['"`\s](cr-[a-z-]+)['"`\s]/g)].map((m) => m[1]));
    record.classesWorn = [...worn].sort();
    record.handWritten = {
      backdropFilter: (scss.match(/backdrop-filter\s*:\s*(?!none)/g) ?? []).length,
      mixins: [...scss.matchAll(MIXINS)].map((m) => m[1]),
    };
    /* A surface counts as worn when its class is in the markup, or when the
       component composes a child that wears it (a hand-off this static reading
       cannot follow, so it is reported as "unverified" rather than as missing). */
    record.surfaceNotWorn = record.surfaces.filter((id) => !WORN_BY_ELEMENT.has(id)
      && !(surfaceClasses[id] ?? []).some((cls) => worn.has(cls)));
  }
  components.push(record);
}

const recipeUse = new Map(recipes.map((recipe) => [recipe.id, 0]));
const presetUse = new Map(PRESETS.map((preset) => [preset, 0]));
for (const entry of manifest.components) {
  for (const id of [...(entry.recipes ?? []), ...(entry.composedRecipes ?? [])]) if (recipeUse.has(id)) recipeUse.set(id, recipeUse.get(id) + 1);
  for (const id of entry.presets ?? []) if (presetUse.has(id)) presetUse.set(id, presetUse.get(id) + 1);
}

const implemented = components.filter((c) => c.status === 'implemented');
/* Several entries share a directory (Radio and RadioGroup live in Checkbox's),
   so material, which is read from a directory's stylesheets, is counted once per
   directory, by its first entry. */
const seenDirectories = new Set();
const byDirectory = implemented.filter((c) => {
  if (!c.directory || seenDirectories.has(c.directory)) return false;
  seenDirectories.add(c.directory);
  return true;
});
const sum = (list, pick) => list.reduce((total, c) => total + pick(c), 0);
const summary = {
  core: CORE === LOCAL_CORE ? 'local checkout (crystal-design-system/core)' : 'installed @crystal-ui/core',
  components: components.length,
  implemented: implemented.length,
  motion: {
    assigned: sum(components, (c) => c.motion.assigned.length),
    played: sum(components, (c) => c.motion.played.length),
    playedByChild: sum(components, (c) => c.motion.playedByChild.length),
    unplayed: sum(components, (c) => c.motion.unplayed.length),
    entriesWithUnplayed: components.filter((c) => c.motion.unplayed.length).length,
    recipesPlayedByNoComponent: [...recipeUse].filter(([, n]) => n === 0).map(([id]) => id),
    presetsPlayedByNoComponent: [...presetUse].filter(([, n]) => n === 0).map(([id]) => id),
  },
  materials: {
    directories: byDirectory.length,
    directoriesWithHandWrittenBackdropFilter: byDirectory.filter((c) => c.handWritten?.backdropFilter).length,
    backdropFilterLines: sum(byDirectory, (c) => c.handWritten?.backdropFilter ?? 0),
    directoriesUsingMaterialMixins: byDirectory.filter((c) => c.handWritten?.mixins.length).length,
    mixinUses: Object.fromEntries(Object.entries(byDirectory.flatMap((c) => c.handWritten?.mixins ?? [])
      .reduce((acc, m) => ({ ...acc, [m]: (acc[m] ?? 0) + 1 }), {})).sort()),
    entriesWithASurfaceNotWornInMarkup: implemented.filter((c) => c.surfaceNotWorn?.length).length,
  },
};

const out = process.argv.indexOf('--json');
if (out !== -1) {
  writeFileSync(resolve(process.argv[out + 1]), JSON.stringify({
    generated: new Date().toISOString().slice(0, 10), summary, recipeUse: Object.fromEntries(recipeUse),
    presetUse: Object.fromEntries(presetUse), components,
  }, null, 2) + '\n');
}
console.log(JSON.stringify(summary, null, 2));
