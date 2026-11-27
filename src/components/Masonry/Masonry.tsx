'use client';

/* Masonry.
 *
 * Items of unequal height packed into columns without being stretched to match.
 *
 * The catalogue's accessibility note, "a list when the items are a set;
 * otherwise presentational", matters here because the layout order and the
 * reading order differ. A multi-column layout fills each column top to bottom,
 * so item two is below item one, not beside it. In a gallery a reader expects
 * that and there is nothing to announce. For an ordered set, `as="ul"` makes the
 * set explicit, so a screen reader says "list, 12 items" and the positions can
 * be followed although the visual order is columnar.
 *
 * Reduced motion: nothing animates here. The catalogue asks for "reduced-motion
 * reflow". CSS columns reflow instantly without animating, so there is nothing
 * to remove.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type PrismataSpacing } from '../../styles/spacing.js';
import styles from './Masonry.module.scss';

export interface MasonryProps extends HTMLAttributes<HTMLElement> {
  /** Columns at the widest. Narrows to two and then one at Prismata's breakpoints. */
  columns?: number;
  /** Columns below the `md` breakpoint. Defaults to two. */
  columnsMd?: number;
  /** Gap between items, from Prismata's scale. Defaults to `md`. */
  gap?: PrismataSpacing;
  /** Render as a list when the items are a set. Presentational otherwise. */
  as?: ElementType;
  children?: ReactNode;
}

export const Masonry = forwardRef<HTMLElement, MasonryProps>(function Masonry(
  { columns, columnsMd, gap, as: Element = 'div', className, style, children, ...props },
  ref,
) {
  const layout: CSSProperties = {
    ...(columns !== undefined ? { '--pr-masonry-columns': columns } as CSSProperties : {}),
    ...(columnsMd !== undefined ? { '--pr-masonry-columns-md': columnsMd } as CSSProperties : {}),
    ...(gap !== undefined ? { '--pr-masonry-gap': spacingValue(gap) } as CSSProperties : {}),
    ...style,
  };

  return (
    <Element {...props} ref={ref} className={cx(styles['masonry'], className)} style={layout}>
      {children}
    </Element>
  );
});
