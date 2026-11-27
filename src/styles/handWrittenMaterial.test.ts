/* No material is painted by hand (R-28, ruled 16 November 2026).
 *
 * Every Frost, Resin, Haze and Mirage surface in this library is Prismata's: a
 * component wears the surface and the variant `@prismata/core` publishes, and
 * never restates the fill, the blur or the feathered layer in its own
 * stylesheet. Where a component needed something Prismata did not publish, the
 * difference went into Prismata first (core 2.7.0's variants, 2.8.0's
 * `.pr-choice`) and the component wore it afterwards.
 *
 * `scripts/audit-recipes.mjs` counts the same two things across the library,
 * and this test holds both counts at zero:
 *
 *   - a `backdrop-filter` that is not `none`. Turning diffusion off in a
 *     fallback is not painting a material; turning it on is.
 *   - a material mixin. The library's own (`styles/_material.scss`) is gone,
 *     and its return would be the old shape.
 *
 * A Prismata fill token used as a colour on something that is not a surface,
 * such as the stepper's 2px connector, is not counted: a line has no fill to
 * feather and a pseudo-element cannot wear a class.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..');

function scss(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return scss(path);
    return name.endsWith('.scss') ? [path] : [];
  });
}

const sheets = scss(SRC).map((path) => ({
  file: relative(SRC, path),
  code: readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
}));

describe('hand-written material', () => {
  it('writes no backdrop-filter that diffuses', () => {
    const found = sheets.flatMap(({ file, code }) =>
      (code.match(/backdrop-filter\s*:(?!\s*none\b)[^;]*/g) ?? []).map((m) => `${file}: ${m}`));
    expect(found).toEqual([]);
  });

  it('includes no material mixin', () => {
    const found = sheets.flatMap(({ file, code }) =>
      (code.match(/@include\s+(?:\w+\.)?(?:resin|frost|haze-fill|stone|plastic|opaque-fallback)\b/g) ?? []).map((m) => `${file}: ${m}`));
    expect(found).toEqual([]);
  });

  it('has no material module of its own', () => {
    expect(existsSync(join(SRC, 'styles/_material.scss'))).toBe(false);
  });
});
