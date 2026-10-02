/* Checks that every story file is reviewable in Storybook: it names a component,
 * reaches the Crystal environment, and has a Controls panel that moves something.
 *
 * It is a ratchet. The counts below are the floor the library is at today, and a
 * change that lowers one fails. New stories may be added freely, since the floor
 * only stops the total going backwards. Raising the floor is an edit made in the
 * same commit.
 *
 *   node scripts/verify-stories.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');

/* What the library is at today. Raise these when you add; never lower them to
   make a build pass. */
const FLOOR = {
  filesWithComponent: 161,
  filesWithArgs: 155,
  filesWithArgTypes: 15,
  storiesWithPlay: 5,
  actionArgs: 18,
};

/* Story files that are not about a component. `Parity` renders one bare
   specimen per material for `verify-materials` to measure, so there is no
   component to point docgen at. Exemptions are a named list, because a pattern
   would also excuse the next file that forgets its component. */
const NOT_A_COMPONENT = new Set(['styles/parity/Parity.stories.tsx']);

function storyFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...storyFiles(path));
    else if (entry.name.endsWith('.stories.tsx')) found.push(path);
  }
  return found;
}

/* The callbacks in `.storybook/react-aria.ts`, read from it rather than copied
   here. The script reads the flat `ARIA_EVENTS` array, because a regex over the
   nested table does not parse reliably; see the note beside it there. */
const ARIA_SOURCE = readFileSync(resolve(process.cwd(), '.storybook/react-aria.ts'), 'utf8');
const ARIA_EVENTS = new Set(
  [...(/export const ARIA_EVENTS = \[([\s\S]*?)\] as const/.exec(ARIA_SOURCE)?.[1] ?? '')
    .matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map(([, name]) => name),
);

/* A floor on the table as well as on the stories. This counter reads another
   file by regex. If the array is reshaped, the regex finds fewer names (or
   none), and the run would report too few action args and blame the stories.
   This floor stops the run here with the right diagnosis instead. */
const LEAST_ARIA_EVENTS = 9;
if (ARIA_EVENTS.size < LEAST_ARIA_EVENTS) {
  console.error(
    `verify-stories: found ${ARIA_EVENTS.size} names in ARIA_EVENTS and expected at least `
    + `${LEAST_ARIA_EVENTS}. The array was reshaped and this counter is reading it wrong — `
    + 'the story counts below would be understated, not the stories worse.',
  );
  process.exit(1);
}

/** Event props a story switched on via `ariaArgTypes<…>({ onPress: true })`. */
function ariaEventArgs(source) {
  let found = 0;
  for (const block of source.matchAll(/ariaArgTypes<[^>]+>\(\{([\s\S]*?)\}\)/g)) {
    for (const [, name] of block[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*): true,/gm)) {
      if (ARIA_EVENTS.has(name)) found += 1;
    }
  }
  return found;
}

const failures = [];
const counts = {
  filesWithComponent: 0, filesWithArgs: 0, filesWithArgTypes: 0,
  storiesWithPlay: 0, actionArgs: 0,
};

/* A story whose whole subject is one instance of the component must take args.
 *
 * Most `render:` closures that ignore their args are compositions (R-17): a
 * strip shown beside a segmented control, the same destinations in three shells,
 * seven gaps of the spacing scale at once. Their subject is the relationship, and
 * giving one of several components live controls would make it disagree with its
 * neighbours. Compositions are not checked.
 *
 * What is checked is a story that renders exactly one of its own
 * `meta.component` and hard-codes its props, because its Controls panel moves
 * nothing.
 *
 * Exceptions are listed by name with a reason rather than counted, because a
 * floor would let this get worse one story at a time.
 */
const RENDER_ONLY_BY_DESIGN = new Map([
  ['components/Menu/Overlays.stories.tsx::OnRightClick', 'the subject is the right-click gesture on a target, not the menu\'s own props'],
  ['components/Stack/Stack.stories.tsx::TheScale', 'seven gaps at once; the subject is the scale, and the single Stack is the frame around it'],
  ['components/VisuallyHidden/Utilities.stories.tsx::Hidden', 'its only prop is children, and the subject is the sentence it sits inside'],
  ['components/NavRail/Shells.stories.tsx::TheSameDestinationsInThreeShells', 'a three-way comparison; driving one shell would make it disagree with the other two'],
  ['components/Tabs/Navigation.stories.tsx::TheSameStripWithDifferentSemantics', 'the pair is the point — identical material, different semantics'],
  ['components/TreeView/Hierarchies.stories.tsx::ExpandingIsMotion', 'the subject is what plays on expand, and a play function drives it'],
  ['components/SparkLine/SparkLine.stories.tsx::Comparable', 'three spark lines sharing one fixed domain; the subject is what the shared range does to three different series, and driving one of them would break the comparison'],
  ['components/Tour/Tour.stories.tsx::AGuidedSequence', 'a tour is only itself when something is being pointed at, so the story is the page it runs over rather than the panel on its own'],
  ['components/RatingSummary/RatingSummary.stories.tsx::NothingRatedYet', 'the subject is an *omitted* prop — no average at all, which is not the same as an average of nought — and an omitted prop cannot be an arg'],
  ['components/Toast/Toast.stories.tsx::AStack', 'the subject is the provider and the stack it owns, which is raised through useToasts rather than rendered by hand'],
]);

function renderOnlySingleSubject(source, name) {
  const meta = /^ {2}component: ([A-Za-z0-9_]+),/m.exec(source)?.[1];
  if (!meta) return [];
  const found = [];
  for (const story of source.matchAll(/export const ([A-Za-z0-9_]+): Story = \{([\s\S]*?)\n\};/g)) {
    const [, id, body] = story;
    if (!/render: \(\) =>/.test(body)) continue;
    /* Exactly one instance. Zero means the component is context rather than
       subject; several means a composition of its own variants. */
    if ([...body.matchAll(new RegExp(`<${meta}\\b`, 'g'))].length !== 1) continue;
    const key = `${name}::${id}`;
    if (RENDER_ONLY_BY_DESIGN.has(key)) continue;
    found.push({ key, meta });
  }
  return found;
}

const files = storyFiles(ROOT).sort();
for (const file of files) {
  const name = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');

  /* `component:` at meta's own indent. Matching it anywhere also matches
     `docs: { description: { component: … } }`, which is a documentation string
     and would inflate the count. */
  const hasComponent = /^ {2}component: [A-Za-z0-9_]+,/m.test(source);
  if (hasComponent) counts.filesWithComponent += 1;
  else if (!NOT_A_COMPONENT.has(name)) {
    failures.push(
      `${name} declares no meta.component, so docgen has nothing to read and `
      + 'Storybook generates no controls at all. Add one, or add the file to '
      + 'NOT_A_COMPONENT with the reason.',
    );
  }

  for (const { key, meta } of renderOnlySingleSubject(source, name)) {
    failures.push(
      `${key} renders one \`${meta}\` with hard-coded props and takes no args, so its `
      + 'Controls panel moves nothing. Take `args` and spread `only(args)`, or add it to '
      + 'RENDER_ONLY_BY_DESIGN with the reason it is a composition rather than a subject.',
    );
  }

  if (/^ {2}args: \{/m.test(source)) counts.filesWithArgs += 1;
  if (/^ {2}argTypes: \{/m.test(source)) counts.filesWithArgTypes += 1;
  counts.storiesWithPlay += (source.match(/^ {2}play: /gm) ?? []).length;
  /* Both forms, because both put a callback in the Actions panel.
     `argTypes: { onPress: { action: … } }` wires a callback docgen cannot see:
     nearly every callback here is inherited from a React Aria interface, and
     this Storybook uses `react-docgen`, which does not resolve what an interface
     extends. `fn()` in `args` does the same job and also gives a `play` function
     something to assert against. */
  counts.actionArgs += (source.match(/\baction: '/g) ?? []).length
    + (source.match(/: fn\(\)/g) ?? []).length
    /* Third form. The shared React Aria table declares `action` centrally, so a
       story that switches an event on through `ariaArgTypes` has an Actions
       entry with neither literal in it. Counting only the literals undercounts
       every story that uses the table. */
    + ariaEventArgs(source);
}

for (const [key, floor] of Object.entries(FLOOR)) {
  if (counts[key] < floor) {
    failures.push(
      `${key} fell from ${floor} to ${counts[key]}. This is a ratchet: if the drop `
      + 'is deliberate, lower the floor in the same commit and say why.',
    );
  }
}

/* No story that a measurement gate probes may carry a `play` function.
 *
 * A `play` runs whenever the story loads, as well as under the test runner, so a
 * gate that opens the story measures whatever the play is in the middle of doing
 * or has left behind. The gate can stay green while measuring fewer elements, or
 * report elements mid-interaction.
 *
 * The ids are read out of the gate scripts themselves, so a gate that starts
 * probing a new story is covered without anybody updating this file. */
const GATES = ['verify-targets.mjs', 'verify-behaviour.mjs', 'verify-appearance.mjs', 'verify-materials.mjs', 'verify-theme.mjs'];
const probed = new Set();
for (const gate of GATES) {
  const source = readFileSync(resolve(process.cwd(), 'scripts', gate), 'utf8');
  for (const match of source.matchAll(/id=([a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
    probed.add(match[1]);
  }
  /* `verify-targets` names its stories in a `story:` field rather than in a URL. */
  for (const match of source.matchAll(/story: '([^']+)'/g)) probed.add(match[1]);
}

/* Storybook's own id rule: the title and the story's name, each lowercased with
   every run of non-alphanumerics collapsed to a dash. A story with no explicit
   `name` takes its export name split at the capitals, so `TabStrip` becomes
   "Tab Strip" and then `tab-strip`. */
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fromExport = (name) => name.replace(/_+$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const title = /title: '([^']+)'/.exec(source)?.[1];
  if (!title) continue;
  /* Each exported story, with whatever follows it up to the next export, so a
     `play:` is attributed to the story it belongs to rather than to the file. */
  const blocks = [...source.matchAll(/^export const (\w+): Story = \{([\s\S]*?)^\};$/gm)];
  for (const [, exported, body] of blocks) {
    if (!/^ {2}play: /m.test(body)) continue;
    const named = /^ {2}name: '([^']+)'/m.exec(body)?.[1] ?? fromExport(exported);
    const id = `${slug(title)}--${slug(named)}`;
    if (probed.has(id)) {
      failures.push(
        `${relative(ROOT, file)} → ${id} has a play function and is probed by a `
        + 'measurement gate. A play runs when the story loads, so the gate measures '
        + 'it mid-interaction or after it. Give the play its own story.',
      );
    }
  }
}

/* The environment must reach every story, from one place. Declaring it in
   `preview.ts` puts it on every component's stories without each story file
   having to declare it, as Meridian asked. */
const preview = readFileSync(resolve(process.cwd(), '.storybook/preview.ts'), 'utf8');
for (const needed of ['args: environmentArgs', 'argTypes: environmentArgTypes']) {
  if (!preview.includes(needed)) {
    failures.push(
      `.storybook/preview.ts no longer declares \`${needed}\`, so the Crystal `
      + 'environment is not on every story’s Controls panel.',
    );
  }
}

/* An exception must name an existing story. A stale exception would excuse a
   different story that later reuses the name. */
{
  const known = new Set();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const story of source.matchAll(/export const ([A-Za-z0-9_]+): Story = \{/g)) {
      known.add(`${relative(ROOT, file)}::${story[1]}`);
    }
  }
  for (const key of RENDER_ONLY_BY_DESIGN.keys()) {
    if (!known.has(key)) failures.push(`RENDER_ONLY_BY_DESIGN names ${key}, which is not a story any more`);
  }
}

console.log(JSON.stringify({
  suite: 'stories are reviewable',
  files: files.length,
  counts,
  floor: FLOOR,
  failures,
}, null, 2));

if (failures.length) {
  console.error('\nA story nobody can operate is half a review surface.');
  process.exit(1);
}
