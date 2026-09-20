'use client';

/* The spacing scale, as a prop.
 *
 * Every layout component takes the same seven steps, so they are named once here
 * rather than seven times. The values are Crystal's — `@crystal-ui/core` publishes
 * them as `--cr-spacing-*` — and this file translates a step name into the custom
 * property that holds it. Nothing here decides what a step is worth.
 *
 * `space` is the density-aware padding step (`--cr-space`), and is offered
 * alongside the scale because it is what a surface's own padding uses: a stack
 * inside a card that wants to match the card's padding asks for `space`, not for
 * a step that happens to equal it at one density.
 */

/** A step on Crystal's spacing scale, or the density-aware padding step. */
export type CrystalSpacing = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'space' | 'none';

/** The CSS length for a spacing step. `none` is a real zero, not a missing value. */
export function spacingValue(step: CrystalSpacing | undefined): string | undefined {
  if (step === undefined) return undefined;
  if (step === 'none') return '0';
  if (step === 'space') return 'var(--cr-space)';
  return `var(--cr-spacing-${step})`;
}
