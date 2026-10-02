/* The floor under the Crystal this library plays.
 *
 * Until 28 September 2026 this was an R-20 test, written to fail when Crystal
 * 2.2.0 was installed so the migration to its recipes (R-24) could not be
 * forgotten.
 *
 * It is now a floor. The loader, the progress indicators and the skeleton play
 * `activity-turn`, `activity-travel` and `skeleton-sweep`, and three charts play
 * `mark-in`. These recipes exist only from 2.2.0. On anything older `useMotion`
 * throws for an unknown recipe, so a dependency range that let 2.1 back in would
 * ship components that crash as soon as something starts loading. The
 * dependency says `^2.3.0`. This test checks the installed version, because the
 * range is only what was requested.
 *
 * The floor is 2.3, because the location dot, the count badge, the group, the
 * dialog body and the recessed overlay this library wears exist only from 2.3.0.
 * Crystal 2.3.0 draws the navigation entry's location dot on `.cr-nav-item`, and
 * `NavLink` no longer draws its own (R-26).
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
  it('is 2.3.0 or later', () => {
    expect(major > 2 || (major === 2 && minor >= 3), `@crystal-ui/core ${installed.version} is installed; this library wears recipes that exist only from 2.3.0 — the location dot, the count, the group, the dialog body, the recessed overlay`).toBe(true);
  });

  /* The version could move without the recipes, so both halves are checked. */
  it('publishes every recipe this library plays that 2.1 did not', () => {
    const published = new Set(motionRecipes.recipes.map((recipe) => recipe.id));
    for (const id of PLAYED_FROM_2_2) {
      expect(published.has(id), `${id} is played here and not published by the installed core`).toBe(true);
    }
  });
});
