'use client';

/* LineChart — continuous values as lines, with optional points.
 *
 * "Series are distinguishable without colour alone", which here is the dash
 * pattern: solid, then five patterns in multiples of the stroke. It is the one
 * second channel that survives all three ways colour fails — dichromatic vision,
 * a monochrome print, and forced colours replacing every hue with one.
 *
 * The domain is fitted to the data rather than forced through zero, and that is
 * the opposite of the bar chart's rule for the opposite reason: a line's marks
 * are *positions*, and a line chart of a share price between 412 and 418 drawn
 * from zero is a flat line that hides the whole story. A bar's marks are lengths,
 * and a length from a false baseline lies. Same data, different mark, different
 * rule.
 *
 * Every point is reachable whether or not it is drawn. A forty-point line is a
 * line rather than forty dots, but a reader moving through it with the arrow keys
 * still lands on all forty and hears each one.
 */
import { type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesTable } from '../BarChart/BarChart.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import {
  PointMarks, SeriesLine, seriesPath, type ChartCurve, type PlotPoint,
} from '../../charts/Cartesian.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleLinear, scalePoint, valueDomain } from '../../charts/scales.js';
import type { ChartSeries } from '../../charts/types.js';
import { cx } from '../../styles/cx.js';
import styles from './LineChart.module.scss';

export interface LineChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  series: readonly ChartSeries[];
  categories: readonly string[];
  /** Straight between points, or eased through them. */
  curve?: ChartCurve;
  /** Draw a marker at every point. Off for a dense series. */
  points?: boolean;
  /** Include zero in the value axis. Off by default — see the note above. */
  fromZero?: boolean;
  ticks?: number;
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function LineChart({
  series, categories, curve = 'linear', points = true, fromZero = false, ticks = 5,
  format = (value) => String(value), table, className, ...surface
}: LineChartProps): ReactNode {
  const marks = useMarkNavigation(series.length * categories.length);

  return (
    <ChartSurface
      {...surface}
      table={table ?? seriesTable(series, categories, format)}
      empty={surface.empty ?? categories.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const across = scalePoint().domain(categories.map(String)).range([0, inner.width]);
        const value = scaleLinear()
          .domain(valueDomain(series, { fromZero }))
          .nice(ticks)
          .range([inner.height, 0]);

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = categories
          .map((name) => ({ offset: across(String(name)) ?? 0, label: name }));

        const plotted = series.map((one) => one.values.map((datum, index): PlotPoint | null => (
          datum === null || datum === undefined ? null : {
            x: inner.x + (across(String(categories[index])) ?? 0),
            y: inner.y + value(datum),
            label: format(datum),
          }
        )));

        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g {...marks.containerProps}>
              {series.map((one, s) => (
                <g key={one.name} className={styles['series']}>
                  <SeriesLine d={seriesPath(plotted[s] ?? [], curve)} seriesIndex={s} />
                  <PointMarks
                    points={plotted[s] ?? []}
                    seriesIndex={s}
                    seriesName={one.name}
                    categories={categories}
                    offset={s * categories.length}
                    active={marks.active}
                    markProps={marks.markProps}
                    visible={points}
                  />
                </g>
              ))}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}
