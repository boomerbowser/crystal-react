'use client';

/* SimpleGrid.
 *
 * Equal-width cells that flow into as many columns as fit. No breakpoint props:
 * the column count follows the space available, so the same grid works in a
 * sidebar and across a page.
 *
 * The `min(..., 100%)` inside the template is what keeps it from overflowing. A
 * plain `minmax(240px, 1fr)` cannot go below 240px, so in a 200px column the grid
 * is wider than its container and the page scrolls sideways — the classic
 * auto-fit defect.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';
import styles from './SimpleGrid.module.scss';

export interface SimpleGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Gutter between cells. Defaults to `md`. */
  gap?: CrystalSpacing;
  /** Narrowest a cell may become before the grid drops a column. CSS length. */
  minCellWidth?: string;
  children?: ReactNode;
}

export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(function SimpleGrid(
  { gap, minCellWidth, className, style, children, ...props },
  ref,
) {
  const layout: CSSProperties = {
    ...(gap !== undefined ? { '--cr-grid-gap': spacingValue(gap) } as CSSProperties : {}),
    ...(minCellWidth ? { '--cr-cell-min': minCellWidth } as CSSProperties : {}),
    ...style,
  };

  return (
    <div {...props} ref={ref} className={cx(styles['simpleGrid'], className)} style={layout}>
      {children}
    </div>
  );
});
