'use client';

/* SparkLine.
 *
 * A small trend line with no axes, sized to sit inside text or a cell.
 *
 * "Needs a text summary beside it; it is never the only carrier of the value."
 * The API enforces this: `summary` is required and it is rendered. A spark line
 * with no axes, no labels and no scale shows only a shape, and the shape means
 * nothing without a number beside it. Implementations that make the summary
 * optional end up shipping the chart without it.
 *
 * This is the one chart in the slice that is not a `ChartSurface`. It has no
 * caption, no legend, no plot fill and no disclosure, because it is a word in
 * somebody else's sentence. Giving it a figure and a table would turn a table
 * row containing six of them into six figures and six tables. The summary is the
 * text equivalent, which is why it is mandatory.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { seriesPath, type ChartCurve, type PlotPoint } from '../../charts/Cartesian.js';
import { scaleLinear } from '../../charts/scales.js';
import { cx } from '../../styles/cx.js';
import styles from './SparkLine.module.scss';

export interface SparkLineProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  values: readonly (number | null)[];
  /** The value in words, shown beside the line. Required, because the line
   *  alone cannot be read. */
  summary: ReactNode;
  /** The summary before the line rather than after it. */
  summaryFirst?: boolean;
  curve?: ChartCurve;
  /** Drawn size. Fixed aspect: a spark line has no padding of its own. */
  width?: number;
  height?: number;
  /** Fix the vertical range, so several spark lines can be compared. */
  domain?: [number, number];
}

export function SparkLine({
  values, summary, summaryFirst = false, curve = 'linear',
  width = 72, height = 20, domain, className, ...props
}: SparkLineProps): ReactNode {
  const numbers = values.filter((value): value is number => value !== null);
  const [low, high] = domain ?? (numbers.length
    ? [Math.min(...numbers), Math.max(...numbers)]
    : [0, 1]);
  /* A flat series has no range to scale into, and dividing by it would put every
     point at infinity. It draws down the middle, which is what flat looks like. */
  const value = scaleLinear()
    .domain(low === high ? [low - 1, high + 1] : [low, high])
    .range([height - 1, 1]);
  const across = scaleLinear().domain([0, Math.max(1, values.length - 1)]).range([0, width]);

  const points = values.map((datum, index): PlotPoint | null => (
    datum === null ? null : { x: across(index), y: value(datum), label: '' }
  ));

  const line = (
    <svg
      aria-hidden="true"
      className={styles['line']}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path className={styles['path']} d={seriesPath(points, curve)} />
    </svg>
  );

  return (
    <span {...props} className={cx(styles['spark'], className)}>
      {summaryFirst ? <span className={styles['summary']}>{summary}</span> : null}
      {line}
      {summaryFirst ? null : <span className={styles['summary']}>{summary}</span>}
    </span>
  );
}
