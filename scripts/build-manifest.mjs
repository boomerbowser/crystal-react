/* Generate the machine-readable component manifest and llms.txt.
 *
 * Meridian's brief asks that the library "can be integrated with … LLMs". That
 * needs a description an assistant can read without opening the source: what
 * each component is, what states it has, which materials and recipes it uses,
 * what it does not do, and which of its peers in other libraries it corresponds
 * to.
 *
 * All of that is in Crystal's catalogue, and a second hand-written description
 * would drift from it (CONTRACT §1). So this reads the catalogue, and takes
 * implementation status from what the package exports instead of from a list
 * maintained by hand.
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

/* The closed vocabulary every catalogue entry's `surface` is drawn from, beside
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

/* What is implemented, read from what the package exports. A hand-maintained
   list of finished components goes stale when one is deleted.
 *
   This reads exported names, not directory names, because the two do not
   always agree: `Stack` and `Group` are one box turned ninety degrees and share
   a file, so a directory scan would miss Group. A component is implemented when
   a consumer can import it. */
const componentsDir = join(ROOT, 'src/components');
const exported = new Set();
/* The theme provider is a catalogue component but lives with the theme, so its
   barrel is read alongside the component barrels. */
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
/* Exports whose name differs from the catalogue id. Status still comes from the
   exports; this table only translates names where the library's vocabulary is
   better than the catalogue's generic one. `CrystalProvider` is the theme
   provider, and also exporting `ThemeProvider` would give one thing two names. */
const NAMED_DIFFERENTLY = {
  CrystalProvider: 'theme-provider',
  /* The component is the element; the transition is what it does to it. */
  SharedElement: 'shared-element-transition',
  /* React Aria's name, and the catalogue's since 2.3.0, which removed the
     duplicate `virtual-scroller` entry (D-29). The export and the id agree;
     this line records that. verify-behaviour checks the entry's promises: the set counts
     and the focused row kept through recycling. */
  Virtualizer: 'virtualizer',
  Abbr: 'abbreviation',
  TextArea: 'textarea',
  /* The catalogue spells these as one word; Crystal spells them the way React
     and the DOM do. */
  ComboBox: 'combobox',
  DropZone: 'dropzone',
  /* The catalogue lists `title` (the levels with display tracking) and `heading`
     (levels two to six) separately. They are one component with a different
     default, so one export covers both, as with `CrystalProvider`. */
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

/* Every recipe and preset Crystal ships, so the scan below matches real names
   instead of guessing at call syntax. Matching `play('name')` literally would
   miss `play(invalid ? 'field-invalid' : 'field-valid')`. */
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
   so `textarea` is looked for as `TextArea` and not as a `Textarea` that does
   not exist. */
const EXPORT_FOR = Object.fromEntries(Object.entries(NAMED_DIFFERENTLY)
  .flatMap(([name, ids]) => (Array.isArray(ids) ? ids : [ids]).map((id) => [id, name])));

function motionUsed(componentId) {
  const pascal = EXPORT_FOR[componentId]
    ?? componentId.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  /* A component may live in a neighbour's directory (Group is in Stack's), so
     the source is found by looking for the directory that exports it. */
  /* A directory named after it counts only if it has a barrel. An empty
     directory left behind by a move (ActionBar, CloseButton, Mentions,
     SpeedDial and SplitButton once had one) must not be taken for the component,
     which lives beside its neighbour. */
  const dir = existsSync(join(componentsDir, pascal, 'index.ts'))
    ? join(componentsDir, pascal)
    : (readdirSync(componentsDir)
      .map((entry) => join(componentsDir, entry))
      .find((candidate) => statSync(candidate).isDirectory()
        && existsSync(join(candidate, 'index.ts'))
        && new RegExp(`\\b${pascal}\\b`).test(readFileSync(join(candidate, 'index.ts'), 'utf8'))) ?? '');
  if (!dir || !existsSync(dir)) return { recipes: [], presets: [] };
  const recipes = new Set();
  const presets = new Set();
  /* The neighbouring components it renders, by directory, for composition
     credit (below). Recorded here and credited separately, so `recipes` keeps
     meaning "what this component's own source plays". */
  const renders = new Set();
  /* A component's own files, and one level of what they import from the library's
     shared modules. Motion that plays through a shared piece is still this
     component's: the loader turns through `feedback/ActivityArc`, and three charts
     arrive through `charts/useMarkArrival`. Only one level is read, not the whole
     graph: a component that imports another component is credited with its own
     motion only, because the other one is reported under its own name. */
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
    /* A helper in a neighbour's directory, such as `../FormField/FieldShell`
       (which plays the field recipes for every text field), is shared in the
       same sense, and so is what that helper imports from its own directory
       (`FieldShell` plays through `./useInvalidMotion`). A neighbour's component
       file, such as `../Button/Button`, is not shared: it is reported under its
       own name. */
    /* The collection recipes live in `motion/ListPresence`, which plays exactly
       `list-in` and `list-out` for whatever uses it. `useContinuous` is not
       followed, because it names all three continuous recipes as a type and
       would credit every caller with all three. `motion/ListPresence` is
       followed from a component or from a helper it uses, but only when the
       import is one of the parts that play those two recipes. The module also
       exports `usePresenceMotion`, which plays whatever its caller names; those
       names are in the caller and already read there, and following the module
       for it would credit callers such as a dialog, a hint or an onboarding
       sequence with a collection's arrival they never play. */
    const followListPresence = (from) => {
      const found = resolveFrom(from, from.includes('/components/') ? '../../motion/ListPresence' : '../motion/ListPresence');
      const imported = /import\s*\{([^}]*)\}\s*from '[./]*\/?motion\/ListPresence\.js'/.exec(readFileSync(from, 'utf8'))?.[1] ?? '';
      if (found && /\b(ListPresence|PresenceItem|useListItemMotion)\b/.test(imported)) shared.add(found);
    };
    followListPresence(file);
    for (const [, neighbour, name] of source.matchAll(/from '\.\.\/([A-Z]\w*)\/(\w+)\.js'/g)) {
      if (name === neighbour) { renders.add(neighbour); continue; }
      const helper = resolveFrom(file, `../${neighbour}/${name}`);
      if (!helper) continue;
      shared.add(helper);
      followListPresence(helper);
      /* A component the helper renders is rendered by this component too:
         the players' settings menu is `MediaControls/MediaSettings`, which
         renders `Menu`. */
      for (const [, child, childName] of readFileSync(helper, 'utf8').matchAll(/from '\.\.\/([A-Z]\w*)\/(\w+)\.js'/g)) {
        if (child === childName) renders.add(child);
      }
      for (const [, local] of readFileSync(helper, 'utf8').matchAll(/from '\.\/(\w+)\.js'/g)) {
        const next = resolveFrom(helper, `./${local}`);
        if (next) shared.add(next);
      }
    }
  }
  const PLAYS = /\buse(?!\w*Reduced)(\w*Motion|Continuous|MarkArrival)\b|<Arrival\b|\brecipe="[a-z]/;
  const componentPlays = files.some((file) => PLAYS.test(readFileSync(file, 'utf8')));
  for (const file of [...files, ...shared]) {
    const source = readFileSync(file, 'utf8');
    /* Only count a name in a file that uses a hook that plays it, so a string
       that matches a preset name, such as Button's `variant="resin"`, is not
       counted as a preset. A shared file of names, such as `feedback/status.ts`
       (which maps a status to the recipe that marks it), counts when the
       component that imports it plays. */
    const playsRecipes = PLAYS.test(source) || (componentPlays && shared.has(file));
    const playsPresets = source.includes('usePreset');
    if (!playsRecipes && !playsPresets) continue;
    /* Single-quoted names, and a recipe handed to `<Arrival recipe="menu-in" />`,
       which is JSX and double-quoted. Menus, popovers and tooltips arrive this
       way. Double-quoted names count only as a `recipe=` attribute, so
       `slot="selection"` is not read as a binding. */
    const names = [
      ...[...source.matchAll(/'([a-z][a-z-]*)'/g)].map((match) => match[1]),
      ...[...source.matchAll(/\brecipe="([a-z][a-z-]*)"/g)].map((match) => match[1]),
    ];
    for (const name of names) {
      if (playsRecipes && RECIPE_IDS.has(name)) recipes.add(name);
      else if (playsPresets && PRESET_IDS.has(name)) presets.add(name);
    }
  }
  return { recipes: [...recipes].sort(), presets: [...presets].sort(), renders: [...renders].sort() };
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
       front. Each id names a class in `surfaces` below. */
    surface: component.surface ?? [],
    geometry: component.geometry,
    semantics: component.semantics,
    /* The split that tells a consumer what they still have to decide. */
    crystalOwns: component.crystal,
    productOwns: component.product,
    equivalentTo: component.parity,
    ...(implemented.has(component.id) ? motionUsed(component.id) : {}),
  })));

/* Composition credit (re-evaluation of 29 September 2026, recommendation 5).
   A catalogue assignment can be played by a child: the menubar's `menu-in` is
   its menus', the cascader's field recipes are its field shell's. `recipes`
   stays what a component's own source plays; `composedRecipes` adds what the
   components it renders play, one level down, so a reader can tell the two
   apart and the coverage counts both. */
{
  const byDirectory = new Map();
  for (const component of components) {
    if (!component.recipes) continue;
    const pascal = EXPORT_FOR[component.id]
      ?? component.id.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
    byDirectory.set(pascal, component);
  }
  for (const component of components) {
    if (!component.renders) continue;
    const own = new Set(component.recipes);
    const composed = new Set();
    for (const neighbour of component.renders) {
      for (const recipe of byDirectory.get(neighbour)?.recipes ?? []) if (!own.has(recipe)) composed.add(recipe);
    }
    component.composedRecipes = [...composed].sort();
    delete component.renders;
  }
}

const counts = components.reduce((acc, component) => {
  acc[component.status] = (acc[component.status] ?? 0) + 1;
  return acc;
}, {});

const manifest = {
  $description:
    'Crystal React component manifest. Generated from Crystal\'s catalogue and from this package\'s '
    + 'source tree, so each status reflects what exists in the source.',
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

${pkg.description}

Crystal is Meridian's design system, and this library implements it for React.
Every value, material and motion recipe comes from \`@crystal-ui/core\`. A
hard-coded colour or length in this library is a defect.

## Status

${done.length} of ${components.length - (counts['not-applicable'] ?? 0)} components implemented.
\`component-manifest.json\` has the status of each component.

Implemented: ${done.map((component) => component.name).join(', ') || 'none yet'}

## How to use it

Import Crystal's stylesheets once, then this library's, and wrap the application
or any subtree in \`CrystalProvider\`. The provider scopes the theme to its own
element, so a dark region inside a light page needs no second root.

\`\`\`tsx
import '@crystal-ui/core/theme';
import '@crystal-ui/core/css';
import '${pkg.name}/styles.css';
import { CrystalProvider, Button } from '${pkg.name}';

<CrystalProvider palette="prism" mode="light">
  <Button variant="primary">Save</Button>
</CrystalProvider>
\`\`\`

\`useCrystalTheme\` throws outside a provider, so a component cannot render
without a theme unnoticed.

## Rules

- Selection is label weight. It is never a rail and never a check mark. A check
  mark means validated or informational.
- Action controls are pills. A card-shaped button is the one documented exception
  and keeps the content radius.
- Focus is a crisp 2px core at 3px offset inside a four-layer feathered halo. It is
  never delayed, blurred or replaced by a badge.
- Resin never contains Resin. A surface above Resin is a Haze content fill.
- Reduced motion removes spatial movement and keeps state feedback.
- Nothing moves at rest. Crystal 2.0 has no ambient motion.
- Text, icons, hit areas and focus rings are never blurred.

## Materials

Plastic → Frost → Resin, back to front, plus Haze (content fill), Stone (label
backing) and Mirage (modal scrim). Resin is the floating control plane. A dialog is
Haze over Mirage.

## Surfaces

Every component names what it is made of from Crystal's closed vocabulary of
${surfaces.length} surfaces, and each surface is a class in \`@crystal-ui/core\`. The
manifest's \`surface\` field lists them for each component, back to front.

${surfaces.map((surface) => `- \`${surface.id}\`, ${surface.class ?? 'no class'}: ${surface.name}`).join('\n')}

## Motion

Recipes come from Crystal and are played through Motion for React, driven by each
recipe's own spring. Motion is bound to state, so a change made by keyboard or
assistive technology animates the same way as one made by pointer.

## Machine-readable

\`component-manifest.json\` beside this file lists every component with its
anatomy, states, material, surface, geometry and semantics, the parts Crystal owns
and the parts the product owns, the recipes it plays, and the components it
corresponds to in Mantine, MUI, Ant Design and PrimeReact.
`;

writeFileSync(join(ROOT, 'dist/llms.txt'), llms);

console.log(
  `component-manifest.json: ${components.length} components `
  + `(${counts['implemented'] ?? 0} implemented, ${counts['not-started'] ?? 0} not started, `
  + `${counts['not-applicable'] ?? 0} not applicable)`,
);
console.log('llms.txt written');
