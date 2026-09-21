/* The review surface, checked.
 *
 * Meridian has now reported a broken review surface three times: components that
 * did not look like Crystal because the ground was flat, an environment that
 * could not be reached, and a Controls panel reading "This story has no
 * controls". Each was visible to anyone who opened Storybook and invisible to
 * every check in the repository, because nothing here had ever looked at a story
 * file and asked whether it was reviewable.
 *
 * So this is not a lint. It is a ratchet: the counts below are the floor the
 * library is at today, and a change that lowers one fails. New stories may be
 * added freely — the floor only stops the total going backwards — and raising
 * the floor is a deliberate edit somebody makes in the same commit.
 *
 *   node scripts/verify-stories.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');

/* What the library is at today. Raise these when you add; never lower them to
   make a build pass, which is the one way a ratchet stops being one. */
const FLOOR = {
  filesWithComponent: 31,
  filesWithArgs: 23,
  filesWithArgTypes: 15,
  storiesWithPlay: 5,
  actionArgs: 17,
};

/* A story file that is not about a component, and says so. `Parity` renders one
   bare specimen per *material* for `verify-materials` to measure; there is no
   component to point docgen at, and inventing one would make the gate pass by
   naming something the file is not about. An exemption is a named list, not a
   pattern — a pattern would quietly excuse the next file somebody forgot. */
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

/* The callbacks in `.storybook/react-aria.ts`, read from it rather than listed
   here: a second copy of that list is the thing the table exists to avoid.
   Read from its flat `ARIA_EVENTS` array, which exists in that shape because a
   regex over the nested table got this wrong — see the note beside it there. */
const ARIA_SOURCE = readFileSync(resolve(process.cwd(), '.storybook/react-aria.ts'), 'utf8');
const ARIA_EVENTS = new Set(
  [...(/export const ARIA_EVENTS = \[([\s\S]*?)\] as const/.exec(ARIA_SOURCE)?.[1] ?? '')
    .matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map(([, name]) => name),
);

/* A floor on the *table*, not just on the stories. This counter reads another
   file by regex, and the failure that matters is not it finding the wrong
   number — it is finding none, reporting zero action args, and blaming the
   stories. Verified by mutation: reshaping the array drops the count below
   this and the run stops here rather than three lines later with a wrong
   diagnosis. */
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

const files = storyFiles(ROOT).sort();
for (const file of files) {
  const name = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');

  /* `component:` at meta's own indent. Matching it anywhere also matches
     `docs: { description: { component: … } }`, which is a documentation string
     and not a component reference — an earlier count of this was wrong by eight
     for exactly that reason, and a gate that counts the wrong thing is the
     failure mode this whole file exists for. */
  const hasComponent = /^ {2}component: [A-Za-z0-9_]+,/m.test(source);
  if (hasComponent) counts.filesWithComponent += 1;
  else if (!NOT_A_COMPONENT.has(name)) {
    failures.push(
      `${name} declares no meta.component, so docgen has nothing to read and `
      + 'Storybook generates no controls at all. Add one, or add the file to '
      + 'NOT_A_COMPONENT with the reason.',
    );
  }

  if (/^ {2}args: \{/m.test(source)) counts.filesWithArgs += 1;
  if (/^ {2}argTypes: \{/m.test(source)) counts.filesWithArgTypes += 1;
  counts.storiesWithPlay += (source.match(/^ {2}play: /gm) ?? []).length;
  /* Both forms, because both put a callback in the Actions panel and counting
     one of them understates the library. `argTypes: { onPress: { action: … } }`
     wires a callback docgen cannot see — nearly every callback here is inherited
     from a React Aria interface, and this Storybook uses `react-docgen`, which
     does not resolve what an interface extends. `fn()` in `args` does the same
     job and additionally gives a `play` function something to assert against. */
  counts.actionArgs += (source.match(/\baction: '/g) ?? []).length
    + (source.match(/: fn\(\)/g) ?? []).length
    /* Third form, and the reason it had to be added: the shared React Aria
       table declares `action` centrally, so a story that switches an event on
       through `ariaArgTypes` has an Actions entry with neither literal in it.
       Counting only the literals made this ratchet fall from 15 to 6 the moment
       nine stories stopped repeating themselves — a gate reporting a
       *reduction* in the very thing that had just increased, because it was
       counting the spelling rather than the substance. */
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
 * This is a rule the hard way. A `play` runs whenever the story *loads*, not
 * only under the test runner, so a gate that opens one is measuring whatever the
 * play is in the middle of doing — or whatever it left behind. Adding a play to
 * the tree's `Files` story cost `verify-targets` three of its twenty-nine probes
 * and it stayed green, measuring six rows where there had been nine. Restoring
 * the tree was not enough either: the gate then arrived mid-keystroke and
 * reported three rows whose own centre did not belong to them.
 *
 * `overlays-drawer--modal` then did the same thing and passed, by luck, which is
 * why this is a check and not a note. The ids are read out of the gate scripts
 * themselves, so a gate that starts probing a new story is covered without
 * anybody remembering to come back here. */
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
   `name` takes its export name split at the capitals — `TabStrip` is
   "Tab Strip" is `tab-strip`. */
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

/* The environment must reach every story, and from one place. Declaring it in
   `preview.ts` is what makes it per-component without twenty-seven authors
   having remembered — which is what Meridian asked for, twice. */
const preview = readFileSync(resolve(process.cwd(), '.storybook/preview.ts'), 'utf8');
for (const needed of ['args: environmentArgs', 'argTypes: environmentArgTypes']) {
  if (!preview.includes(needed)) {
    failures.push(
      `.storybook/preview.ts no longer declares \`${needed}\`, so the Crystal `
      + 'environment is not on every story’s Controls panel.',
    );
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
