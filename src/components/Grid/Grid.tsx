'use client';

/* Grid and Grid.Cell.
 *
 * A twelve-column grid with one gutter, and cells that declare a span per
 * breakpoint. The spans travel as custom properties and not as generated
 * classes. Generated classes would need twelve spans times three breakpoints
 * of static CSS, 36 classes to express three numbers a caller already knows.
 *
 * The defaults fail safely. A cell with no span is full width, and a cell with
 * no phone span is full width on a phone, so a forgotten prop produces a
 * readable stack and not a page of slivers.
 *
 * Presentational. The catalogue requires reading order to match visual order,
 * so cells are never reordered with CSS. A grid that visually reorders its
 * children leaves a keyboard and a screen reader walking the original order,
 * which no longer matches what is seen.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';
import styles from './Grid.module.scss';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Gutter between cells, from Crystal's scale. Defaults to `md`. */
  gap?: CrystalSpacing;
  /** Columns in the grid. Defaults to Crystal's twelve-column reference. */
  columns?: number;
  children?: ReactNode;
}

export interface GridCellProps extends HTMLAttributes<HTMLDivElement> {
  /** Columns this cell spans. Defaults to the full width of the grid. */
  span?: number;
  /** Span below the `md` breakpoint. Defaults to `span`. */
  spanMd?: number;
  /** Span below the `sm` breakpoint. Defaults to full width. */
  spanSm?: number;
  children?: ReactNode;
}

const GridCell = forwardRef<HTMLDivElement, GridCellProps>(function GridCell(
  { span, spanMd, spanSm, className, style, children, ...props },
  ref,
) {
  const spans: CSSProperties = {
    ...(span !== undefined ? { '--cr-cell-span': span } as CSSProperties : {}),
    ...(spanMd !== undefined ? { '--cr-cell-span-md': spanMd } as CSSProperties : {}),
    ...(spanSm !== undefined ? { '--cr-cell-span-sm': spanSm } as CSSProperties : {}),
    ...style,
  };

  return (
    <div {...props} ref={ref} className={cx(styles['cell'], className)} style={spans}>
      {children}
    </div>
  );
});

const GridRoot = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { gap, columns, className, style, children, ...props },
  ref,
) {
  const layout: CSSProperties = {
    ...(gap !== undefined ? { '--cr-grid-gap': spacingValue(gap) } as CSSProperties : {}),
    ...(columns !== undefined ? { '--cr-grid-columns': columns } as CSSProperties : {}),
    ...style,
  };

  return (
    <div {...props} ref={ref} className={cx(styles['grid'], className)} style={layout}>
      {children}
    </div>
  );
});

export const Grid = Object.assign(GridRoot, { Cell: GridCell });
