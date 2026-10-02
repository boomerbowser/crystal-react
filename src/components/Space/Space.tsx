'use client';

/* Space.
 *
 * An explicit gap from the scale.
 *
 * It exists for the cases a parent's `gap` cannot express: one larger break in an
 * otherwise even rhythm, or space between two things that are not siblings in the
 * same flex container.
 *
 * The catalogue says a Space is "never used to convey grouping to assistive
 * technology", and some screen readers announce an empty div as a blank item in
 * a list. So it carries `aria-hidden` and is removed from the accessibility tree.
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
