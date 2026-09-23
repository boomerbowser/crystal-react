'use client';

/* ScatterChart — points in two dimensions.
 *
 * "Point size is a scale, not an arbitrary radius." A third value is mapped onto
 * Crystal's point scale — between `--cr-chart-point-min` and
 * `--cr-chart-point-max` — and onto the point's **area** rather than its
 * diameter, so that equal differences in the data are equal differences in the
 * amount of ink. A point twice as wide is four times as big to the eye, so the
 * obvious mapping exaggerates the spread without saying so.
 *
 * "Dense regions remain describable; a table equivalent is required." The table
 * is the surface's and is not optional. What this chart adds is that a dense
 * region is still navigable: every point is a mark, arrow keys move between them
 * in the order given, and each one says both of its coordinates.
 *
 * Both axes fit their data. A scatter's marks are positions in both directions,
 * so the bar chart's zero rule does not apply in either.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { markerPath, seriesColour, seriesMarker } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { MARK_TARGET } from '../../charts/target.js';
import { cx } from '../../styles/cx.js';
import styles from './ScatterChart.module.scss';

export interface ScatterPoint {
  x: number;
  y: number;
  /** A third value, drawn as the point's area. */
  size?: number;
  /** What this point is, when it is a thing rather than a pair of numbers. */
  name?: string;
}

export interface ScatterSeries {
  name: string;
  points: readonly ScatterPoint[];
}

export interface ScatterChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  series: readonly ScatterSeries[];
  /** What the two axes measure, for the labels and the table. */
  xLabel: string;
  yLabel: string;
  ticks?: number;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatSize?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function ScatterChart({
  series, xLabel, yLabel, ticks = 5,
  formatX = (value) => String(value),
  formatY = (value) => String(value),
  formatSize = (value) => String(value),
  table, className, ...surface
}: ScatterChartProps): ReactNode {
  const all = series.flatMap((one) => one.points);
  const marks = useMarkNavigation(all.length);

  return (
    <ChartSurface
      {...surface}
      table={table ?? scatterTable(series, xLabel, yLabel, formatX, formatY, formatSize)}
      empty={surface.empty ?? all.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const xs = all.map((point) => point.x);
        const ys = all.map((point) => point.y);
        const sizes = all.map((point) => point.size).filter((size): size is number => size !== undefined);
        const across = scaleLinear().domain(span(xs)).nice(ticks).range([0, inner.width]);
        const up = scaleLinear().domain(span(ys)).nice(ticks).range([inner.height, 0]);
        /* The value maps onto the point's *area*: the range is the squares of
           Crystal's two point sizes, and the diameter is the root of what comes
           out. So equal differences in the data are equal differences in the
           amount of ink, which is what the eye actually compares. Mapping onto
           the diameter instead — the obvious way, and the usual bug — would make
           the largest point three times the area it should be, exaggerating the
           spread without saying so.

           The scale runs between the two published sizes rather than from zero,
           so the smallest datum is always `--cr-chart-point-min` and the largest
           always `--cr-chart-point-max`. That is what makes it a scale rather
           than a radius, and it is also why a size is never a quantity a reader
           can read off alone: it is in the label and in the table. */
        const area = scaleLinear()
          .domain(sizes.length ? span(sizes) : [0, 1])
          .range([chartGeometry.pointMin ** 2, chartGeometry.pointMax ** 2]);

        const valueTicks: AxisTick[] = up.ticks(ticks)
          .map((tick) => ({ offset: up(tick), label: formatY(tick) }));
        const categoryTicks: AxisTick[] = across.ticks(ticks)
          .map((tick) => ({ offset: across(tick), label: formatX(tick) }));

        let index = -1;
        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g {...marks.containerProps}>
              {series.map((one, s) => (
                <g key={one.name}>
                  {one.points.map((point) => {
                    index += 1;
                    const at = index;
                    const size = point.size === undefined
                      ? chartGeometry.pointMin * 1.5
                      : Math.sqrt(area(point.size));
                    return (
                      <g
                        key={`${point.x},${point.y},${point.name ?? at}`}
                        {...marks.markProps(at)}
                        role="graphics-symbol"
                        aria-label={label(point, one.name, xLabel, yLabel, formatX, formatY, formatSize)}
                        className={styles['point']}
                        data-active={marks.active === at ? '' : undefined}
                        style={{ '--series-colour': seriesColour(s) } as CSSProperties}
                        transform={`translate(${inner.x + across(point.x)},${inner.y + up(point.y)})`}
                      >
                        <rect
                          className={styles['target']}
                          x={-MARK_TARGET / 2}
                          y={-MARK_TARGET / 2}
                          width={MARK_TARGET}
                          height={MARK_TARGET}
                        />
                        <path className={styles['shape']} d={markerPath(seriesMarker(s), size)} />
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}

function span(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const low = Math.min(...values);
  const high = Math.max(...values);
  return low === high ? [low - 1, high + 1] : [low, high];
}

function label(
  point: ScatterPoint, series: string, xLabel: string, yLabel: string,
  formatX: (value: number) => string,
  formatY: (value: number) => string,
  formatSize: (value: number) => string,
): string {
  const parts = [
    point.name ?? series,
    `${xLabel} ${formatX(point.x)}`,
    `${yLabel} ${formatY(point.y)}`,
  ];
  if (point.size !== undefined) parts.push(formatSize(point.size));
  return parts.join(', ');
}

/** Every point as a row. A dense scatter is exactly the chart whose table
 *  matters most, and exactly the one where an author is tempted to summarise. */
export function scatterTable(
  series: readonly ScatterSeries[],
  xLabel: string, yLabel: string,
  formatX: (value: number) => string,
  formatY: (value: number) => string,
  formatSize: (value: number) => string,
): ChartSurfaceProps['table'] {
  const sized = series.some((one) => one.points.some((point) => point.size !== undefined));
  return {
    columns: ['Point', 'Series', xLabel, yLabel, ...(sized ? ['Size'] : [])],
    rows: series.flatMap((one) => one.points.map((point) => [
      point.name ?? `${formatX(point.x)}, ${formatY(point.y)}`,
      one.name,
      formatX(point.x),
      formatY(point.y),
      ...(sized ? [point.size === undefined ? null : formatSize(point.size)] : []),
    ])),
  };
}
