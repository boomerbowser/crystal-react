'use client';

/* Masonry.
 *
 * Items of unequal height packed into columns without being stretched to match.
 *
 * The accessibility note the catalogue gives it — "a list when the items are a
 * set; otherwise presentational" — is doing real work here, because the layout
 * order and the reading order genuinely differ: a multi-column layout fills each
 * column top to bottom, so item two is below item one rather than beside it. For
 * a gallery that is what a reader expects and there is nothing to announce. For
 * an ordered set it matters, and `as="ul"` makes the set explicit so a screen
 * reader says "list, 12 items" and the positions are followable even though the
 * visual order is columnar.
 *
 * Reduced motion: nothing animates here. The catalogue asks for "reduced-motion
 * reflow", and the honest answer is that CSS columns reflow instantly rather than
 * animating, so there is nothing to remove — which is better than an animated
 * reflow that has to be suppressed.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';
import styles from './Masonry.module.scss';

export interface MasonryProps extends HTMLAttributes<HTMLElement> {
  /** Columns at the widest. Narrows to two and then one at Crystal's breakpoints. */
  columns?: number;
  /** Columns below the `md` breakpoint. Defaults to two. */
  columnsMd?: number;
  /** Gap between items, from Crystal's scale. Defaults to `md`. */
  gap?: CrystalSpacing;
  /** Render as a list when the items are a set. Presentational otherwise. */
  as?: ElementType;
  children?: ReactNode;
}

export const Masonry = forwardRef<HTMLElement, MasonryProps>(function Masonry(
  { columns, columnsMd, gap, as: Element = 'div', className, style, children, ...props },
  ref,
) {
  const layout: CSSProperties = {
    ...(columns !== undefined ? { '--cr-masonry-columns': columns } as CSSProperties : {}),
    ...(columnsMd !== undefined ? { '--cr-masonry-columns-md': columnsMd } as CSSProperties : {}),
    ...(gap !== undefined ? { '--cr-masonry-gap': spacingValue(gap) } as CSSProperties : {}),
    ...style,
  };

  return (
    <Element {...props} ref={ref} className={cx(styles['masonry'], className)} style={layout}>
      {children}
    </Element>
  );
});
