/* The floor under the Crystal this library plays.
 *
 * Until 28 September 2026 this file had the opposite job: the R-20 pattern, a test
 * whose only purpose was to fail the day Crystal 2.2.0 was installed, so that the
 * migration to its recipes (R-24) could not be forgotten. It failed on the bump, as
 * it was written to, and it said "run the migration".
 *
 * The migration's first step made it a floor instead. The loader, the progress
 * indicators and the skeleton now play `activity-turn`, `activity-travel` and
 * `skeleton-sweep`, and three charts play `mark-in` — recipes that exist only from
 * 2.2.0. On anything older `useMotion` throws for an unknown recipe, so a
 * dependency range that let 2.1 back in would ship components that crash the
 * moment something starts loading. The dependency says `~2.2.0`; this checks what
 * is actually installed, because the range is what was asked for and the installed
 * version is what is true.
 *
 * It has a ceiling as well, for now. Crystal 2.3.0 draws the navigation entry's
 * location dot on `.cr-nav-item` itself (D-22), and `NavLink` still draws its own:
 * a 2.3 installed under this library would put two dots beside the current link.
 * So the range stops at 2.2, and the second test fails the day 2.3 is installed
 * anyway — the R-20 pattern again — naming what the adoption has to do (R-26).
 *
 * The proposal's last step (§3.5) was to delete this file once the per-surface
 * checks existed and had each been seen red. They exist, in `verify:appearance`,
 * and `VERIFY_PLANT_RED=1` turns every one of them red on demand — but the file
 * stays, because it stopped being the migration's reminder and became the floor
 * above. R-24 closed on 28 September 2026; its record is in
 * `docs/closed-issues.md`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import motionRecipes from '@crystal-ui/core/motion-recipes' with { type: 'json' };

/* The package does not export its manifest, so it is found from a file it does
   export: `./css` is `assets/crystal.css`, and the manifest is two levels up. */
const require = createRequire(import.meta.url);
const stylesheetPath = require.resolve('@crystal-ui/core/css');
const installed = JSON.parse(readFileSync(join(dirname(stylesheetPath), '..', 'package.json'), 'utf8')) as { version: string };
const [major = 0, minor = 0] = installed.version.split('.').map(Number);

/* Every recipe this library plays that an older Crystal does not have. */
const PLAYED_FROM_2_2 = ['activity-turn', 'activity-travel', 'skeleton-sweep', 'mark-in'];

describe('the installed @crystal-ui/core', () => {
  it('is 2.2.0 or later', () => {
    expect(major > 2 || (major === 2 && minor >= 2), `@crystal-ui/core ${installed.version} is installed; this library plays recipes that exist only from 2.2.0`).toBe(true);
  });

  /* The version could move without the recipes, so both halves are checked. */
  it('publishes every recipe this library plays that 2.1 did not', () => {
    const published = new Set(motionRecipes.recipes.map((recipe) => recipe.id));
    for (const id of PLAYED_FROM_2_2) {
      expect(published.has(id), `${id} is played here and not published by the installed core`).toBe(true);
    }
  });
});

/* R-26: fails the day Crystal 2.3 is installed, which is the day to adopt it. */
describe('the installed @crystal-ui/core, until R-26', () => {
  it('is older than 2.3.0, until NavLink gives its dot to Crystal', () => {
    expect(
      major === 2 && minor < 3,
      `@crystal-ui/core ${installed.version} is installed. Adopt it (R-26): NavLink drops its own dot, which .cr-nav-item now draws; Tooltip reads $cr-overlay-tooltip-radius; the range becomes ^2.3.0; and this test goes.`,
    ).toBe(true);
  });
});
