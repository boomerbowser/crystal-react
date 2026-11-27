import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { PrismataProvider } from './PrismataProvider.js';

/* Every custom property this library reads must be one Prismata writes.
 *
 * A custom property that resolves to nothing throws no error and logs no
 * warning, so no other test notices one. When the library read
 * `--pr-focus-core` and `--pr-focus-ring` and nothing defined them,
 * `outline: 2px solid var(--pr-focus-core)` was invalid at computed-value time
 * and fell back to `outline-style: none`. Prismata's focus is a crisp 2px primary
 * core inside a four-layer feathered halo and one of the system's stated
 * invariants, and it did not paint on a single field in the library.
 *
 * So the stylesheets are read, every `var(--pr-…)` in them collected, and each
 * checked against what a mounted provider publishes. */

const PUBLISHED = (() => {
  const { container } = render(<PrismataProvider><span /></PrismataProvider>);
  const scope = container.querySelector('[data-prismata-scope]') as HTMLElement;
  const declared = new Set<string>();
  for (const name of Array.from(scope.style)) declared.add(name);
  /* Plus the static theme sheet, which is the other half of what a consumer gets. */
  const theme = readFileSync(
    resolve(process.cwd(), 'node_modules/@prismata/core/assets/prismata-theme.css'),
    'utf8',
  );
  for (const match of theme.matchAll(/(--pr-[a-z0-9-]+)\s*:/g)) declared.add(match[1]!);
  return declared;
})();

/* Properties a component sets on itself, inline, where it also reads them: a
   grid's column count, a rating's fill fraction, a title's step of the scale.
   These are the component's own plumbing and not Prismata's to publish. They are
   named here and not pattern-matched, so that adding one takes an edit to this
   list and a property nobody defined cannot pass this gate unnoticed. */
const LOCAL = new Set([
  '--pr-angle', '--pr-arc', '--pr-arc-from', '--pr-aspect', '--pr-progress', '--pr-fraction', '--pr-strength',
  '--pr-strength-colour', '--pr-clamp-lines', '--pr-fill-start', '--pr-fill-size',
  '--pr-cell-min', '--pr-cell-span', '--pr-cell-span-sm', '--pr-cell-span-md',
  '--pr-grid-columns', '--pr-grid-gap', '--pr-masonry-columns',
  '--pr-masonry-columns-md', '--pr-masonry-gap', '--pr-container-max',
  '--pr-shell-sidebar', '--pr-stack-gap', '--pr-toolbar-gap', '--pr-overflow-gap',
  '--pr-text-size', '--pr-text-leading', '--pr-text-tracking',
  '--pr-title-size', '--pr-title-leading', '--pr-title-tracking',
  '--pr-watermark-image', '--pr-watermark-opacity', '--pr-watermark-size',
  '--pr-scroll-fade-start', '--pr-scroll-fade-end',
  /* A colour control's value, handed from React Aria's inline background to the
     layer that draws it: the Resin thumb's disc and a swatch's top layer. */
  '--pr-picked', '--pr-swatch',
  /* Depth, written per row as a number so one CSS rule indents every level and
     one gradient draws every guide. It cannot be a Prismata token, because it
     records which row this is. */
  '--pr-tree-level', '--pr-toc-level',
  /* The on-screen keyboard's height, measured from the visual viewport and set
     inline by the rich text surface while it has focus. */
  '--pr-keyboard-inset',
  /* Spacing a product sets: on a carousel through its `gap` and `padding`
     props, and on every block and commerce card through `BlockSpacing`. */
  '--pr-carousel-gap', '--pr-carousel-padding', '--pr-block-gap', '--pr-block-padding',
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
  it('are all properties Prismata publishes', () => {
    const files = stylesheetsUnder(resolve(process.cwd(), 'src'));
    const missing = new Map<string, string[]>();

    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      for (const match of css.matchAll(/var\(\s*(--pr-[a-z0-9-]+)/g)) {
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
     and because Prismata states the focus recipe as an invariant. */
  it('includes the whole focus recipe', () => {
    expect(PUBLISHED.has('--pr-focus-core')).toBe(true);
    expect(PUBLISHED.has('--pr-focus-ring')).toBe(true);
  });
});
