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
  filesWithComponent: 26,
  filesWithArgs: 18,
  filesWithArgTypes: 10,
  storiesWithPlay: 4,
  actionArgs: 9,
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
  counts.actionArgs += (source.match(/\baction: '/g) ?? []).length;
}

for (const [key, floor] of Object.entries(FLOOR)) {
  if (counts[key] < floor) {
    failures.push(
      `${key} fell from ${floor} to ${counts[key]}. This is a ratchet: if the drop `
      + 'is deliberate, lower the floor in the same commit and say why.',
    );
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
