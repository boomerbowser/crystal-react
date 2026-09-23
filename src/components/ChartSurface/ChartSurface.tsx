'use client';

/* ChartSurface — the frame every chart in this library draws into.
 *
 * "Every chart owes a text equivalent of its data — a chart is a second
 * representation, never the only one." That sentence is the reason this
 * component exists and the reason it is not optional: `table` is a required
 * prop, and no chart below it renders a table of its own. A chart that could be
 * drawn without one would eventually be.
 *
 * The table is folded away behind a disclosure, and that is a real trade rather
 * than a free one: a closed `<details>` keeps its content out of the
 * accessibility tree as well as off the screen, so the numbers are one action
 * away rather than nought. The alternative — the table always in the tree, as
 * `Spoiler` does it — is right for six paragraphs and wrong here, because the
 * table equivalent of a two-hundred-point scatter read out in full is not access
 * to the data, it is the data used as a wall. What makes one action acceptable is
 * that the control is in the tab order, immediately after the plot, and named for
 * what it opens.
 *
 * What the surface owns: the figure and its caption, the Haze plot fill, the
 * measured box, the axis gutters, the legend and tooltip slots, and the empty
 * and loading states. What it does not own: scales, axes ticks, and marks. Those
 * differ per chart and are drawn by the child, which is given the frame.
 *
 * The plot is one tab stop. Marks inside it are a roving tabindex — see
 * `useMarkNavigation`, which explains why two hundred scatter points are not two
 * hundred stops.
 */
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useChartFrame } from '../../charts/useChartFrame.js';
import type { ChartFrame, ChartInsets, ChartTableData } from '../../charts/types.js';
import styles from './ChartSurface.module.scss';

/* Gutters for the axis labels. A default rather than a token because it is a
   consequence of the caller's own tick text — a chart of four-digit currency
   needs a wider left gutter than one of percentages, and only the caller knows
   which it has. */
const INSETS: ChartInsets = { top: 8, right: 8, bottom: 28, left: 44 };

export interface ChartSurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What the chart is of. Becomes the figure's caption and its accessible name. */
  label: ReactNode;
  /** A sentence under the caption, for what the title cannot carry. */
  description?: ReactNode;
  /**
   * The same data as text. Required: a chart is a second representation of
   * something, and this is the first.
   */
  table: ChartTableData;
  /** Height of the drawn area, in pixels. The width is measured. */
  height?: number;
  /** Extra room for axis labels, over the defaults. */
  insets?: Partial<ChartInsets>;
  /** Rendered above the plot — a `ChartLegend`, usually. */
  legend?: ReactNode;
  /** Rendered over the plot, positioned by the chart. */
  tooltip?: ReactNode;
  /** Nothing to draw yet. The caption, the frame and the control all stay. */
  loading?: boolean;
  /** Nothing to draw, and nothing coming. */
  empty?: boolean;
  /** What the empty state says. */
  emptyLabel?: ReactNode;
  /** What the control says. */
  tableLabel?: string;
  hideTableLabel?: string;
  /** Draws the marks. Given the measured frame. */
  children?: (frame: ChartFrame) => ReactNode;
}

export function ChartSurface({
  label, description, table, height = 260, insets, legend, tooltip,
  loading = false, empty = false, emptyLabel = 'No data to show',
  tableLabel = 'Show as table', hideTableLabel = 'Hide table',
  className, children, ...props
}: ChartSurfaceProps): ReactNode {
  const id = useId();
  const gutters: ChartInsets = { ...INSETS, ...insets };
  const [ref, frame] = useChartFrame(height, gutters);
  const state = loading ? 'loading' : empty ? 'empty' : 'at-rest';

  return (
    <figure
      {...props}
      aria-labelledby={`${id}-caption`}
      data-state={state}
      className={cx(styles['surface'], className)}
    >
      <figcaption className={styles['caption']} id={`${id}-caption`}>
        <span className={styles['title']}>{label}</span>
        {description ? <span className={styles['description']}>{description}</span> : null}
      </figcaption>

      {legend ? <div className={styles['legend']}>{legend}</div> : null}

      <div className={styles['plot']} ref={ref}>
        {/* `group`, not `img`. `img` is a leaf: everything inside it, including
            the marks a keyboard moves between, stops being reachable. `group`
            takes the chart's name and lets its children keep theirs, so tabbing
            into the plot announces what is being plotted and then what is under
            the cursor. With nothing drawn there is nothing to name. */}
        <svg
          className={styles['canvas']}
          width={frame.width}
          height={frame.height}
          viewBox={`0 0 ${frame.width} ${frame.height}`}
          {...(empty || loading
            ? { 'aria-hidden': true }
            : { role: 'group', 'aria-labelledby': `${id}-caption` })}
        >
          {empty || loading ? null : children?.(frame)}
        </svg>
        {empty ? <p className={styles['empty']}>{emptyLabel}</p> : null}
        {/* Not an animation: Crystal's rule is that nothing moves at rest, and a
            chart waiting for data is at rest. The plot is held at its size so the
            page does not jump when the numbers arrive. */}
        {loading ? <p className={styles['empty']}>{'Loading'}</p> : null}
        {tooltip}
      </div>

      <ChartTable
        data={table}
        id={`${id}-table`}
        showLabel={tableLabel}
        hideLabel={hideTableLabel}
      />
    </figure>
  );
}

interface ChartTableProps {
  data: ChartTableData;
  id: string;
  showLabel: string;
  hideLabel: string;
}

/* `<details>` rather than a button and a piece of state: open and closed is a
   platform behaviour, the summary is a real control with a real expanded state
   without anybody writing `aria-expanded`, and find-in-page reaches inside it in
   engines that have shipped that. What it costs is described above. */
function ChartTable({ data, id, showLabel, hideLabel }: ChartTableProps): ReactNode {
  return (
    <details className={styles['disclosure']} id={id}>
      <summary className={styles['summary']}>
        <span className={styles['summaryShow']}>{showLabel}</span>
        <span className={styles['summaryHide']}>{hideLabel}</span>
      </summary>
      <div className={styles['tableScroll']}>
        <table className={styles['table']}>
          {data.caption ? <caption className={styles['tableCaption']}>{data.caption}</caption> : null}
          <thead>
            <tr>
              {data.columns.map((column) => <th key={column} scope="col">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key -- a row is its position
              <tr key={index}>
                {row.map((cell, column) => (column === 0
                  // eslint-disable-next-line react/no-array-index-key -- as above
                  ? <th key={column} scope="row">{cell}</th>
                  // eslint-disable-next-line react/no-array-index-key -- as above
                  : <td key={column}>{cell === null ? '—' : cell}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
