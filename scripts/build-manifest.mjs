/* Generate the machine-readable component manifest and llms.txt.
 *
 * Meridian's brief asks that the library "can be integrated with … LLMs". What
 * that needs in practice is a description an assistant can read without opening
 * the source: what each component is, what states it has, which materials and
 * recipes it uses, what it does *not* do, and which of its peers in other
 * libraries it corresponds to.
 *
 * All of that already exists in Crystal's catalogue. Writing it a second time by
 * hand would create a second description of the same thing, which is the drift
 * CONTRACT §1 is about — so this reads the catalogue and reports implementation
 * status from what the package actually exports, rather than from a list somebody
 * remembers to update.
 *
 * Two outputs:
 *
 *   dist/component-manifest.json  the full specification plus live status
 *   dist/llms.txt                 a compact orientation for an assistant
 *
 *   node scripts/build-manifest.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CANDIDATES = [
  join(ROOT, 'node_modules/@crystal-ui/core/tokens/catalogue.json'),
  resolve(ROOT, '../crystal-design-system/design-system/tokens/catalogue.json'),
];
const SOURCE = CANDIDATES.find((path) => existsSync(path));
if (!SOURCE) {
  console.error('Cannot find the Crystal catalogue. Looked in:\n  ' + CANDIDATES.join('\n  '));
  process.exit(1);
}

const catalogue = JSON.parse(readFileSync(SOURCE, 'utf8'));

/* The closed vocabulary every catalogue entry's \`surface\` is drawn from, beside
   the catalogue it describes. Crystal's build fails closed on an entry whose
   surface is not in it, so this fails closed too rather than writing an
   unexplained name into the manifest. */
const SURFACES_SOURCE = SOURCE.replace('catalogue.json', 'surfaces.json');
const surfaces = existsSync(SURFACES_SOURCE) ? JSON.parse(readFileSync(SURFACES_SOURCE, 'utf8')).surfaces : [];
const surfaceIds = new Set(surfaces.map((surface) => surface.id));
const unknown = catalogue.categories.flatMap((category) => category.components)
  .flatMap((component) => (component.surface ?? []).filter((id) => !surfaceIds.has(id)).map((id) => `${component.id}: ${id}`));
if (unknown.length) {
  console.error('Catalogue entries name surfaces surfaces.json does not define:\n  ' + unknown.join('\n  '));
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/* What is actually implemented, read from what the package exports rather than
   declared. A list of "done" components maintained by hand goes stale the first
   time somebody deletes one.
 *
   This reads exported names, not directory names, because the two stopped
   agreeing: `Stack` and `Group` are one box turned ninety degrees and share a
   file, so a directory scan reported Group as not started while it was exported,
   documented and tested. A component is implemented when a consumer can import
   it — that is the only definition that matches what "implemented" means to
   somebody reading the manifest. */
const componentsDir = join(ROOT, 'src/components');
const exported = new Set();
/* The theme provider is a component of the catalogue but lives with the theme,
   so its barrel is read alongside the component ones rather than moved to keep a
   script happy. */
const barrels = [join(ROOT, 'src/theme/index.ts')];
for (const entry of existsSync(componentsDir) ? readdirSync(componentsDir) : []) {
  const dir = join(componentsDir, entry);
  if (!statSync(dir).isDirectory()) continue;
  const barrel = join(dir, 'index.ts');
  if (existsSync(barrel)) barrels.push(barrel);
}
for (const barrel of barrels) {
  if (!existsSync(barrel)) continue;
  for (const match of readFileSync(barrel, 'utf8').matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const name of match[1].split(',')) {
      const symbol = name.trim().split(/\s+as\s+/).pop()?.trim();
      if (symbol && /^[A-Z]/.test(symbol)) exported.add(symbol);
    }
  }
}
/* Where Crystal's name for a thing is not the catalogue's id. This is not a list
   of what is done — status still comes from the exports — it is a translation
   table for the handful of cases where the library's own vocabulary is better
   than the catalogue's generic one. `CrystalProvider` is the theme provider, and
   calling it `ThemeProvider` as well would be two names for one thing. */
const NAMED_DIFFERENTLY = {
  CrystalProvider: 'theme-provider',
  /* The component *is* the element; the transition is what it does to it. */
  SharedElement: 'shared-element-transition',
  /* React Aria's name, and the better one: the catalogue calls it a
     `virtual-scroller` after the primereact component it lists for parity, but
     what the library re-exports is React Aria's `Virtualizer` and calling it
     anything else would send a reader looking for the wrong export. */
  Virtualizer: 'virtual-scroller',
  Abbr: 'abbreviation',
  TextArea: 'textarea',
  /* The catalogue spells these as one word; Crystal spells them the way React
     and the DOM do. */
  ComboBox: 'combobox',
  DropZone: 'dropzone',
  /* The catalogue lists `title` and `heading` separately — one for the levels
     with display tracking, one for levels two to six. They are the same component
     with a different default, and shipping both names would be two names for one
     thing, which is the mistake `ThemeProvider` was avoided for. */
  Title: ['title', 'heading'],
};

/* PascalCase export -> catalogue id. `SimpleGrid` -> `simple-grid`, `NoSsr` ->
   `no-ssr`; the second capital run is why the boundary is matched twice. */
const implemented = new Set([...exported].flatMap((name) => {
  const mapped = NAMED_DIFFERENTLY[name];
  if (mapped) return Array.isArray(mapped) ? mapped : [mapped];
  return [name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()];
}));

/* Every recipe and preset Crystal ships, so the scan below matches against real
   names rather than against a guess at call syntax. The first version matched
   `play('name')` literally and missed `play(invalid ? 'field-invalid' :
   'field-valid')` — a component that animated on validation was reported as
   animating only on focus. */
const RECIPE_IDS = new Set(
  JSON.parse(readFileSync(
    CANDIDATES.map((p) => p.replace('catalogue.json', 'motion-recipes.json')).find(existsSync),
    'utf8',
  )).recipes.map((recipe) => recipe.id),
);
const PRESET_IDS = new Set(['plastic', 'frost', 'resin', 'haze', 'stone', 'mirage', 'mirage-out', 'dismiss']);

/* What a component plays, read from its source. Stated in the manifest because
   "what moves, and when" is the question an assistant most often has to answer
   about a design system, and it is invisible from the type signature. */
/* catalogue id -> the export that implements it, the inverse of the table above,
   so \`textarea\` is looked for as \`TextArea\` and not as a \`Textarea\` that does
   not exist — which reported every text area as playing nothing. */
const EXPORT_FOR = Object.fromEntries(Object.entries(NAMED_DIFFERENTLY)
  .flatMap(([name, ids]) => (Array.isArray(ids) ? ids : [ids]).map((id) => [id, name])));

function motionUsed(componentId) {
  const pascal = EXPORT_FOR[componentId]
    ?? componentId.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  /* A component may live in a neighbour's directory — Group is in Stack's — so
     the source is found by looking for the directory that exports it rather than
     by assuming one is named after it. */
  const dir = existsSync(join(componentsDir, pascal))
    ? join(componentsDir, pascal)
    : (readdirSync(componentsDir)
      .map((entry) => join(componentsDir, entry))
      .find((candidate) => statSync(candidate).isDirectory()
        && existsSync(join(candidate, 'index.ts'))
        && new RegExp(`\\b${pascal}\\b`).test(readFileSync(join(candidate, 'index.ts'), 'utf8'))) ?? '');
  if (!dir || !existsSync(dir)) return { recipes: [], presets: [] };
  const recipes = new Set();
  const presets = new Set();
  /* A component's own files, and one level of what they import from the library's
     shared modules. Motion that plays through a shared piece is still this
     component's: the loader turns through `feedback/ActivityArc`, and three charts
     arrive through `charts/useMarkArrival`. Reading only the component's directory
     reported both as playing nothing. One level, not a walk of the graph — a
     component that imports another *component* is credited with its own motion
     only, because the other one is reported under its own name. */
  const files = readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file) && !/\.(test|stories)\./.test(file))
    .map((file) => join(dir, file));
  const shared = new Set();
  const resolveFrom = (from, spec) => ['.tsx', '.ts'].map((extension) => join(dirname(from), spec + extension)).find(existsSync);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const [, spec] of source.matchAll(/from '(\.\.\/\.\.\/(?:feedback|charts|media|overlays|commerce|form)\/[^']+)\.js'/g)) {
      const found = resolveFrom(file, spec);
      if (found) shared.add(found);
    }
    /* A helper that lives in a neighbour's directory — \`../FormField/FieldShell\`,
       which plays the field recipes for every text field — is shared in the same
       sense, and so is what that helper imports from its own directory
       (\`FieldShell\` plays through \`./useInvalidMotion\`). A neighbour's *component*
       file, \`../Button/Button\`, is not: it is reported under its own name. */
    for (const [, neighbour, name] of source.matchAll(/from '\.\.\/([A-Z]\w*)\/(\w+)\.js'/g)) {
      if (name === neighbour) continue;
      const helper = resolveFrom(file, `../${neighbour}/${name}`);
      if (!helper) continue;
      shared.add(helper);
      for (const [, local] of readFileSync(helper, 'utf8').matchAll(/from '\.\/(\w+)\.js'/g)) {
        const next = resolveFrom(helper, `./${local}`);
        if (next) shared.add(next);
      }
    }
  }
  for (const file of [...files, ...shared]) {
    const source = readFileSync(file, 'utf8');
    /* Only count a name in a file that actually uses a hook that plays it.
       Without this, Button's `variant="resin"` was reported as a Resin preset:
       a string that happens to match a preset name is not a call. */
    const playsRecipes = /\buse(?!\w*Reduced)(\w*Motion|Continuous|MarkArrival)\b|<Arrival\b|\brecipe="[a-z]/.test(source);
    const playsPresets = source.includes('usePreset');
    if (!playsRecipes && !playsPresets) continue;
    /* Single-quoted names, and a recipe handed to \`<Arrival recipe="menu-in" />\`,
       which is JSX and double-quoted — the one form the first pattern missed,
       and the reason every menu, popover and tooltip read as arriving with
       nothing. Only as a \`recipe=\` attribute: \`slot="selection"\` is not a
       binding. */
    const names = [
      ...[...source.matchAll(/'([a-z][a-z-]*)'/g)].map((match) => match[1]),
      ...[...source.matchAll(/\brecipe="([a-z][a-z-]*)"/g)].map((match) => match[1]),
    ];
    for (const name of names) {
      if (playsRecipes && RECIPE_IDS.has(name)) recipes.add(name);
      else if (playsPresets && PRESET_IDS.has(name)) presets.add(name);
    }
  }
  return { recipes: [...recipes].sort(), presets: [...presets].sort() };
}

const components = catalogue.categories.flatMap((category) =>
  category.components.map((component) => ({
    id: component.id,
    name: component.name,
    category: category.id,
    status: component.status === 'not-applicable'
      ? 'not-applicable'
      : implemented.has(component.id) ? 'implemented' : 'not-started',
    ...(component.why ? { why: component.why } : {}),
    anatomy: component.anatomy,
    states: component.states,
    material: component.material,
    /* What the component is made of, from Crystal's closed vocabulary, back to
       front — each id names a class in \`surfaces\` below. */
    surface: component.surface ?? [],
    geometry: component.geometry,
    semantics: component.semantics,
    /* The split that tells a consumer what they still have to decide. */
    crystalOwns: component.crystal,
    productOwns: component.product,
    equivalentTo: component.parity,
    ...(implemented.has(component.id) ? motionUsed(component.id) : {}),
  })));

const counts = components.reduce((acc, component) => {
  acc[component.status] = (acc[component.status] ?? 0) + 1;
  return acc;
}, {});

const manifest = {
  $description:
    'Crystal React component manifest. Generated from Crystal\'s catalogue and from this package\'s '
    + 'source tree, so status reflects what exists rather than what was remembered.',
  package: pkg.name,
  version: pkg.version,
  generated: new Date().toISOString().slice(0, 10),
  counts,
  categories: catalogue.categories.map(({ id, name, description }) => ({ id, name, description })),
  surfaces: surfaces.map(({ id, name, materials, class: className, also, use }) => ({
    id, name, materials, class: className, ...(also ? { also } : {}), use,
  })),
  components,
};

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist/component-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const byStatus = (status) => components.filter((component) => component.status === status);
const done = byStatus('implemented');

const llms = `# ${pkg.name}

Crystal Design System for React. ${pkg.description}

Crystal is Meridian's design system; this library implements it for React. It does
not invent visual decisions — every value, material and motion recipe comes from
\`@crystal-ui/core\`, and a hard-coded colour or length in this library is a defect.

## Status

${done.length} of ${components.length - (counts['not-applicable'] ?? 0)} components implemented.
This is early: check \`component-manifest.json\` for per-component status rather
than assuming a component exists because it is named here.

Implemented: ${done.map((component) => component.name).join(', ') || 'none yet'}

## How to use it

Wrap the application — or any subtree — in \`CrystalProvider\`. It scopes to its own
element, so a dark island inside a light page needs no second root.

\`\`\`tsx
import { CrystalProvider, Button } from '${pkg.name}';

<CrystalProvider palette="prism" mode="light">
  <Button variant="primary">Save</Button>
</CrystalProvider>
\`\`\`

\`useCrystalTheme\` throws outside a provider. That is deliberate: a component
rendering silently un-themed is the failure that produces "it looks nothing like
the design system" reports.

## Rules that are not style preferences

- **Selection is label weight.** Never a rail, never a check mark. A check mark
  means validated or informational.
- **Action controls are pills.** A card-shaped button is the one documented
  exception and keeps the content radius.
- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo.
  Never delayed, never blurred, never replaced by a badge.
- **Resin never contains Resin.** A surface above Resin is a Haze content fill.
- **Reduced motion** removes spatial movement and keeps state feedback.
- **Ambient motion does not exist** in Crystal 2.0. Nothing moves at rest.
- Text, icons, hit areas and focus rings are never blurred.

## Materials

Plastic → Frost → Resin, back to front, plus Haze (content fill), Stone (label
backing) and Mirage (modal scrim). A dialog is Haze over Mirage, not Resin —
Resin is the floating control plane.

## Surfaces

Every component names what it is made of from Crystal's closed vocabulary of
${surfaces.length} surfaces, and each surface is a class in \`@crystal-ui/core\`. The
manifest's \`surface\` field lists them for each component, back to front.

${surfaces.map((surface) => `- \`${surface.id}\` — ${surface.class ?? 'no class'}: ${surface.name}`).join('\n')}

## Motion

Recipes come from Crystal and are played through Motion for React, driven by each
recipe's own spring. Motion binds to **state**, not to events, so keyboard and
assistive technology get what a pointer user gets.

## Machine-readable

\`component-manifest.json\` beside this file carries every component: its anatomy,
states, material, surface, geometry, semantics, which parts Crystal owns versus the
product, the recipes it plays, and the components it corresponds to in Mantine,
MUI, Ant Design and PrimeReact.
`;

writeFileSync(join(ROOT, 'dist/llms.txt'), llms);

console.log(
  `component-manifest.json: ${components.length} components `
  + `(${counts['implemented'] ?? 0} implemented, ${counts['not-started'] ?? 0} not started, `
  + `${counts['not-applicable'] ?? 0} not applicable)`,
);
console.log('llms.txt written');
