import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { CrystalProvider } from './CrystalProvider.js';

/* Every custom property this library reads must be one Crystal writes.
 *
 * A custom property that resolves to nothing throws no error and logs no
 * warning, so no other test notices one. When the library read
 * `--cr-focus-core` and `--cr-focus-ring` and nothing defined them,
 * `outline: 2px solid var(--cr-focus-core)` was invalid at computed-value time
 * and fell back to `outline-style: none`. Crystal's focus is a crisp 2px primary
 * core inside a four-layer feathered halo and one of the system's stated
 * invariants, and it did not paint on a single field in the library.
 *
 * So the stylesheets are read, every `var(--cr-…)` in them collected, and each
 * checked against what a mounted provider publishes. */

const PUBLISHED = (() => {
  const { container } = render(<CrystalProvider><span /></CrystalProvider>);
  const scope = container.querySelector('[data-crystal-scope]') as HTMLElement;
  const declared = new Set<string>();
  for (const name of Array.from(scope.style)) declared.add(name);
  /* Plus the static theme sheet, which is the other half of what a consumer gets. */
  const theme = readFileSync(
    resolve(process.cwd(), 'node_modules/@crystal-ui/core/assets/crystal-theme.css'),
    'utf8',
  );
  for (const match of theme.matchAll(/(--cr-[a-z0-9-]+)\s*:/g)) declared.add(match[1]!);
  return declared;
})();

/* Properties a component sets on itself, inline, where it also reads them: a
   grid's column count, a rating's fill fraction, a title's step of the scale.
   These are the component's own plumbing and not Crystal's to publish. They are
   named here and not pattern-matched, so that adding one takes an edit to this
   list and a property nobody defined cannot pass this gate unnoticed. */
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
  /* Depth, written per row as a number so one CSS rule indents every level and
     one gradient draws every guide. It cannot be a Crystal token, because it
     records which row this is. */
  '--cr-tree-level', '--cr-toc-level',
  /* The media stage's shape and fit, set inline by the players from their
     props, and the transport height the caption cue clears. Crystal's `.cr-media`
     recipe (core, after 2.3.1) publishes all three; they come off this list when
     the installed core does (`src/media/coreRecipes.test.ts`). */
  '--cr-media-aspect', '--cr-media-fit', '--cr-media-transport',
  /* The on-screen keyboard's height, measured from the visual viewport and set
     inline by the rich text surface while it has focus. */
  '--cr-keyboard-inset',
]);

/** Every stylesheet in the library, found rather than listed. */
function stylesheetsUnder(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...stylesheetsUnder(path));
    else if (entry.name.endsWith('.scss')) found.push(path);
  }
  return found;
}

describe('the properties this library reads', () => {
  it('are all properties Crystal publishes', () => {
    const files = stylesheetsUnder(resolve(process.cwd(), 'src'));
    const missing = new Map<string, string[]>();

    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      for (const match of css.matchAll(/var\(\s*(--cr-[a-z0-9-]+)/g)) {
        const name = match[1]!;
        if (PUBLISHED.has(name) || LOCAL.has(name)) continue;
        const seen = missing.get(name) ?? [];
        if (!seen.includes(file)) seen.push(file);
        missing.set(name, seen);
      }
    }

    expect(Object.fromEntries(missing)).toEqual({});
  });

  /* Named on its own, because these two properties have been undefined before
     and because Crystal states the focus recipe as an invariant. */
  it('includes the whole focus recipe', () => {
    expect(PUBLISHED.has('--cr-focus-core')).toBe(true);
    expect(PUBLISHED.has('--cr-focus-ring')).toBe(true);
  });
});
