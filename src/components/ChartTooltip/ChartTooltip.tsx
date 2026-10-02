'use client';

/* ChartTooltip shows values at a position, following the pointer or the focused
 * item.
 *
 * "Mirrors the tooltip contract: reachable by keyboard, dismissible with
 * Escape." Keyboard reach is what separates a chart tooltip from an ordinary
 * one, and it is why this is a separate component from `Tooltip`. An ordinary
 * tooltip describes the element that has focus. A chart tooltip describes the
 * mark the roving cursor is on, which is inside a single focusable plot, so
 * there is no per-element hover or focus to hang it from.
 *
 * So it is a panel the chart positions, and it is `aria-hidden` because every
 * value in it is already on the mark it describes, as that mark's own label.
 * Announcing both would read every number twice. The tooltip is the
 * sighted reader's version of what the mark already says.
 *
 * "Never covers the point it describes." It is offset from the point, and near
 * an edge it flips to the other side instead of being clipped. Escape hides it,
 * as the contract requires, and it comes back on the next move.
 */
import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { seriesColour } from '../../charts/channel.js';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { usePlayOnChange } from '../../motion/useChangeMotion.js';
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

/* How far the panel sits from the point it describes. It is not a token. It is
   derived from Crystal's largest point size, as the distance that keeps the
   panel clear of a mark drawn at that size. */
const CLEARANCE = 14;

export function ChartTooltip({
  shown, x, y, bounds, title, rows, className, style, ...props
}: ChartTooltipProps): ReactNode {
  /* Turned instead of clipped. The panel is positioned from whichever side
     leaves it inside the plot, chosen from the point's position without
     measuring the panel. Measuring would need a layout pass, and a tooltip that
     appears one frame late under a moving pointer trails. */
  const right = x > bounds.width / 2;
  const below = y < bounds.height / 2;

  /* `tooltip-in` plays as the panel is shown and `tooltip-out` as it is hidden.
     The panel stays displayed while the exit plays, since hiding it at once
     would leave the exit nothing to move. Neither plays on the render that
     first shows the chart. */
  const [scope, play] = useMotion();
  const [leaving, setLeaving] = useState(false);
  usePlayOnChange(shown, (was, is) => (is ? 'tooltip-in' : was ? 'tooltip-out' : null), (recipe) => {
    if (recipe !== 'tooltip-out') return play(recipe);
    setLeaving(true);
    return play(recipe).finally(() => setLeaving(false));
  });

  return (
    <div
      {...props}
      ref={scope as never}
      aria-hidden="true"
      data-shown={shown || leaving ? '' : undefined}
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
