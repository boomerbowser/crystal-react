'use client';

/* ChartTooltip — values at a position, following the pointer or the focused item.
 *
 * "Mirrors the tooltip contract: reachable by keyboard, dismissible with
 * Escape." The first half is what separates a chart tooltip from an ordinary one
 * and it is why this is not `Tooltip` with different content: an ordinary tooltip
 * describes *the element that has focus*, and a chart tooltip describes the mark
 * the roving cursor is on — which is inside a single focusable plot, so there is
 * no per-element hover or focus to hang it from.
 *
 * So it is a panel the chart positions, and it is `aria-hidden`. That is
 * deliberate rather than an oversight: every value in it is already on the mark
 * it describes, as that mark's own label, and announcing both would read every
 * number twice. The tooltip is the *sighted* reader's version of what the mark
 * already says.
 *
 * "Never covers the point it describes": it is offset from the point, and it
 * flips to the other side rather than being clipped when the point is near an
 * edge. Escape hides it, which is the contract, and it comes back on the next
 * move.
 */
import { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { seriesColour } from '../../charts/channel.js';
import { cx } from '../../styles/cx.js';
import styles from './ChartTooltip.module.scss';

export interface ChartTooltipRow {
  name: string;
  value: string;
  /** Which series, for the swatch. Omitted for a row that is not one. */
  index?: number;
}

export interface ChartTooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Hidden when there is nothing under the cursor, or after Escape. */
  shown: boolean;
  /** Where the point is, in pixels within the plot. */
  x: number;
  y: number;
  /** The plot's own size, so the panel can turn rather than be clipped. */
  bounds: { width: number; height: number };
  title?: ReactNode;
  rows: readonly ChartTooltipRow[];
}

/* How far the panel sits from the point it describes. Not a token: it is the
   distance that keeps the panel clear of a mark drawn at Crystal's largest point
   size, which is what it is derived from rather than chosen. */
const CLEARANCE = 14;

export function ChartTooltip({
  shown, x, y, bounds, title, rows, className, style, ...props
}: ChartTooltipProps): ReactNode {
  /* Turned rather than clipped. The panel is positioned from whichever side
     leaves it inside the plot, which is a decision made from the point's
     position rather than after measuring the panel — measuring would need a
     layout pass, and a tooltip that appears one frame late under a moving
     pointer is a tooltip that trails. */
  const right = x > bounds.width / 2;
  const below = y < bounds.height / 2;

  return (
    <div
      {...props}
      aria-hidden="true"
      data-shown={shown ? '' : undefined}
      data-side={right ? 'start' : 'end'}
      className={cx(styles['tooltip'], 'cr-frost', className)}
      style={{
        ...style,
        '--tooltip-x': `${x}px`,
        '--tooltip-y': `${y}px`,
        '--tooltip-clearance': `${CLEARANCE}px`,
        '--tooltip-translate-x': right ? '-100%' : '0',
        '--tooltip-translate-y': below ? '0' : '-100%',
        '--tooltip-offset-x': right ? `calc(-1 * ${CLEARANCE}px)` : `${CLEARANCE}px`,
        '--tooltip-offset-y': below ? `${CLEARANCE}px` : `calc(-1 * ${CLEARANCE}px)`,
      } as CSSProperties}
    >
      {title ? <p className={styles['title']}>{title}</p> : null}
      <dl className={styles['rows']}>
        {rows.map((row) => (
          <div key={row.name} className={styles['row']}>
            {row.index === undefined ? null : (
              <span
                className={styles['swatch']}
                style={{ '--series-colour': seriesColour(row.index) } as CSSProperties}
              />
            )}
            <dt className={styles['name']}>{row.name}</dt>
            <dd className={styles['value']}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
