'use client';

/* Space — an explicit gap from the scale.
 *
 * It exists for the cases a parent's `gap` cannot express: one larger break in an
 * otherwise even rhythm, or space between two things that are not siblings in the
 * same flex container.
 *
 * `aria-hidden` is not decoration here. The catalogue says a Space is "never used
 * to convey grouping to assistive technology", and an empty div is announced by
 * some screen readers as a blank item in a list — so it is removed from the
 * accessibility tree rather than left to be read as nothing.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';

export interface SpaceProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** How much space. Defaults to `md`. */
  size?: CrystalSpacing;
  /** Space along the inline axis instead of the block one. */
  axis?: 'block' | 'inline';
}

export const Space = forwardRef<HTMLDivElement, SpaceProps>(function Space(
  { size = 'md', axis = 'block', style, ...props },
  ref,
) {
  const length = spacingValue(size);
  const box: CSSProperties = axis === 'inline'
    ? { display: 'inline-block', inlineSize: length }
    : { blockSize: length };

  return <div {...props} ref={ref} aria-hidden="true" style={{ ...box, ...style }} />;
});
