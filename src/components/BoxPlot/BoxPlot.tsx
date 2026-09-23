'use client';

/* BoxPlot — a distribution summary: quartiles, median and outliers.
 *
 * "Each summary statistic is reachable as text; outliers are counted, not only
 * drawn." The second half is the one that matters and the one nobody does: a
 * cluster of twelve outliers at the top of a box is twelve dots a sighted reader
 * counts by eye and a reader who cannot see it is told nothing about. So the
 * label says "3 outliers" and the table has a column for it, beside the five
 * numbers.
 *
 * "Whisker caps align with the box width." The caps are the box's width, not a
 * fraction of it — a narrower cap makes the whisker look like an arrow, which
 * says direction where the data says extent.
 *
 * The five numbers are the caller's. This component does not compute quartiles,
 * because there are several definitions of them and a chart that picked one
 * would be asserting a statistic nobody chose.
 */
import { type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleBand, scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { cx } from '../../styles/cx.js';
import styles from './BoxPlot.module.scss';

export interface BoxSummary {
  name: string;
  low: number;
  q1: number;
  median: number;
  q3: number;
  high: number;
  /** Values outside the whiskers. Drawn *and* counted. */
  outliers?: readonly number[];
}

export interface BoxPlotProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  boxes: readonly BoxSummary[];
  ticks?: number;
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function BoxPlot({
  boxes, ticks = 5, format = (value) => String(value), table, className, ...surface
}: BoxPlotProps): ReactNode {
  const marks = useMarkNavigation(boxes.length);

  return (
    <ChartSurface
      {...surface}
      table={table ?? {
        columns: ['Group', 'Minimum', 'Lower quartile', 'Median', 'Upper quartile', 'Maximum', 'Outliers'],
        rows: boxes.map((box) => [
          box.name,
          format(box.low), format(box.q1), format(box.median), format(box.q3), format(box.high),
          String(box.outliers?.length ?? 0),
        ]),
      }}
      empty={surface.empty ?? boxes.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const band = scaleBand().domain(boxes.map((box) => box.name))
          .range([0, inner.width]).padding(0.4);
        const reach = boxes.flatMap((box) => [box.low, box.high, ...(box.outliers ?? [])]);
        const value = scaleLinear()
          .domain(reach.length ? [Math.min(...reach), Math.max(...reach)] : [0, 1])
          .nice(ticks)
          .range([inner.height, 0]);

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = boxes.map((box) => ({
          offset: (band(box.name) ?? 0) + band.bandwidth() / 2,
          label: box.name,
        }));

        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g {...marks.containerProps}>
              {boxes.map((box, index) => {
                const x = inner.x + (band(box.name) ?? 0);
                const width = band.bandwidth();
                const centre = x + width / 2;
                const at = (datum: number) => inner.y + value(datum);
                const count = box.outliers?.length ?? 0;
                return (
                  <g
                    key={box.name}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${box.name}, median ${format(box.median)}, quartiles `
                      + `${format(box.q1)} to ${format(box.q3)}, range ${format(box.low)} to `
                      + `${format(box.high)}, ${count} ${count === 1 ? 'outlier' : 'outliers'}`}
                    className={styles['box']}
                    data-active={marks.active === index ? '' : undefined}
                  >
                    <line className={styles['whisker']} x1={centre} x2={centre} y1={at(box.high)} y2={at(box.q3)} />
                    <line className={styles['whisker']} x1={centre} x2={centre} y1={at(box.q1)} y2={at(box.low)} />
                    {/* Caps the width of the box: a narrower cap makes the
                        whisker look like an arrow, which says direction where
                        the data says extent. */}
                    <line className={styles['cap']} x1={x} x2={x + width} y1={at(box.high)} y2={at(box.high)} />
                    <line className={styles['cap']} x1={x} x2={x + width} y1={at(box.low)} y2={at(box.low)} />
                    <rect
                      className={styles['quartiles']}
                      x={x}
                      y={at(box.q3)}
                      width={width}
                      height={Math.max(1, at(box.q1) - at(box.q3))}
                    />
                    <line className={styles['median']} x1={x} x2={x + width} y1={at(box.median)} y2={at(box.median)} />
                    {(box.outliers ?? []).map((outlier) => (
                      <circle
                        key={outlier}
                        className={styles['outlier']}
                        cx={centre}
                        cy={at(outlier)}
                        r={chartGeometry.pointMin / 2}
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}
