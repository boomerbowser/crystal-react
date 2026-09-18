import { describe, expect, it } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { CrystalProvider } from './CrystalProvider.js';

/* Every custom property this library *reads* must be one Crystal *writes*.
 *
 * The library invented `--cr-focus-core` and `--cr-focus-ring` and nothing
 * defined them, so `outline: 2px solid var(--cr-focus-core)` was invalid at
 * computed-value time and fell back to `outline-style: none`. Crystal's focus —
 * a crisp 2px primary core inside a four-layer feathered halo, and one of the
 * system's stated invariants — did not paint on a single field in the library,
 * and 300-odd passing tests had nothing to say about it, because a custom
 * property that resolves to nothing throws no error and logs no warning.
 *
 * So the stylesheets are read, every `var(--cr-…)` in them collected, and each
 * checked against what a mounted provider actually publishes. */

const PUBLISHED = (() => {
  const { container } = render(<CrystalProvider><span /></CrystalProvider>);
  const scope = container.querySelector('[data-crystal-scope]') as HTMLElement;
  const declared = new Set<string>();
  for (const name of Array.from(scope.style)) declared.add(name);
  /* Plus the static theme sheet, which is the other half of what a consumer gets. */
  const theme = readFileSync(
    resolve(process.cwd(), 'node_modules/@crystal/core/assets/crystal-theme.css'),
    'utf8',
  );
  for (const [, name] of theme.matchAll(/(--cr-[a-z0-9-]+)\s*:/g)) declared.add(name);
  return declared;
})();

/* Properties a component sets on itself, inline, in the same breath as reading
   them — a grid's column count, a rating's fill fraction, a title's step of the
   scale. These are the component's own plumbing and not Crystal's to publish, so
   they are named rather than pattern-matched: a list somebody has to add to is a
   list somebody thinks about, and the whole point of this gate is that a property
   nobody defined should not slip past unnoticed. */
const LOCAL = new Set([
  '--cr-angle', '--cr-arc', '--cr-arc-from', '--cr-aspect', '--cr-progress', '--cr-fraction', '--cr-strength',
  '--cr-strength-colour', '--cr-clamp-lines', '--cr-fill-start', '--cr-fill-size',
  '--cr-cell-min', '--cr-cell-span', '--cr-cell-span-sm', '--cr-cell-span-md',
  '--cr-grid-columns', '--cr-grid-gap', '--cr-masonry-columns',
  '--cr-masonry-columns-md', '--cr-masonry-gap', '--cr-container-max',
  '--cr-shell-sidebar', '--cr-stack-gap', '--cr-toolbar-gap', '--cr-overflow-gap',
  '--cr-text-size', '--cr-text-leading', '--cr-text-tracking',
  '--cr-title-size', '--cr-title-leading', '--cr-title-tracking',
  '--cr-watermark-image', '--cr-watermark-opacity', '--cr-watermark-size',
  '--cr-scroll-fade-start', '--cr-scroll-fade-end',
]);

describe('the properties this library reads', () => {
  it('are all properties Crystal publishes', () => {
    const files = globSync('src/**/*.scss', { cwd: process.cwd() });
    const missing = new Map<string, string[]>();

    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      for (const [, name] of css.matchAll(/var\(\s*(--cr-[a-z0-9-]+)/g)) {
        if (PUBLISHED.has(name) || LOCAL.has(name)) continue;
        const seen = missing.get(name) ?? [];
        if (!seen.includes(file)) seen.push(file);
        missing.set(name, seen);
      }
    }

    expect(Object.fromEntries(missing)).toEqual({});
  });

  /* Named on its own, because it is the one that was wrong and because Crystal
     states it as an invariant rather than as a convenience. */
  it('includes the whole focus recipe', () => {
    expect(PUBLISHED.has('--cr-focus-core')).toBe(true);
    expect(PUBLISHED.has('--cr-focus-ring')).toBe(true);
  });
});
