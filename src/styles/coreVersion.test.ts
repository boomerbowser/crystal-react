/* The test whose only job is to fail on the day Crystal 2.2.0 is installed.
 *
 * R-24 in `docs/open-issues.md`: Crystal 2.2.0 publishes the recipes this
 * library rebuilt locally — `.cr-bare` for the `bare-control` mixin, `.cr-nav-item`
 * for `NavLink` and the rail item, `.cr-drag-handle`, `.cr-resin.panel`, the
 * native switch — and names every component's surface. The migration in
 * `docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md` cannot run until
 * the installed core carries them, and must run as soon as it does, or the
 * library goes on shipping a second copy of a recipe Crystal now owns.
 *
 * This is the R-20 pattern: a shim that announces its own obsolescence. It reads
 * the installed package rather than the dependency range, because the range is
 * what was asked for and the installed version is what is true.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/* The package does not export its manifest, so it is found from a file it does
   export: `./css` is `assets/crystal.css`, and the manifest is two levels up. */
const require = createRequire(import.meta.url);
const stylesheetPath = require.resolve('@crystal-ui/core/css');
const stylesheet = readFileSync(stylesheetPath, 'utf8');
const installed = JSON.parse(readFileSync(join(dirname(stylesheetPath), '..', 'package.json'), 'utf8')) as { version: string };

const [major = 0, minor = 0] = installed.version.split('.').map(Number);
const hasSurfaceRecipes = major > 2 || (major === 2 && minor >= 2);

describe('the installed @crystal-ui/core', () => {
  it('does not yet publish the recipes this library restates (R-24 — when this fails, run the 2.2 migration)', () => {
    expect(hasSurfaceRecipes, `@crystal-ui/core ${installed.version} is installed. Crystal 2.2.0 publishes .cr-bare, `
      + '.cr-nav-item, .cr-drag-handle, .cr-resin.panel and the native switch. Wear them and delete the local copies — '
      + 'docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md, phase B — then delete this test.').toBe(false);
    /* The version could move without the recipes, or the recipes could land in
       a patch. Both halves are checked so neither can pass for the wrong reason. */
    for (const selector of ['.cr-bare', '.cr-nav-item', '.cr-drag-handle']) {
      expect(stylesheet.includes(selector), `${selector} is in the installed crystal.css; the migration is due`).toBe(false);
    }
  });
});
