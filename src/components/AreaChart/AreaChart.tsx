'use client';

/* AreaChart: a line chart with the region beneath it filled.
 *
 * "Fill never obscures gridlines beneath it." The fill is Crystal's
 * `--cr-chart-fill-opacity` and not a solid. At a quarter, two overlapping series
 * stay distinct and the gridlines a reader measures against stay legible through
 * both. A solid area chart with three series hides everything below the topmost
 * one.
 *
 * Stacking changes what the chart means. Unstacked areas each measure from zero
 * and overlap. Stacked ones measure from the one below, and the top edge is the
 * total. A stacked chart's table carries the total column, because the total is
 * what the picture asserts and a reader should not have to add six numbers to
 * check it.
 */
import { type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { ChartLegend } from '../ChartLegend/ChartLegend.js';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip.js';
import { seriesTable } from '../BarChart/BarChart.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import {
  PointMarks, SeriesLine, seriesBand, seriesPath, type ChartCurve, type PlotPoint,
} from '../../charts/Cartesian.js';
import { seriesColour } from '../../charts/channel.js';
import { drawnSeries, seriesLegend } from '../../charts/series.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { useMarkTooltip, type MarkTip } from '../../charts/useMarkTooltip.js';
import { scaleLinear, scalePoint, stackedDomain, valueDomain } from '../../charts/scales.js';
import type { ChartSeries } from '../../charts/types.js';
import { cx } from '../../styles/cx.js';
import { useRef, type CSSProperties } from 'react';
import styles from './AreaChart.module.scss';

export interface AreaChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  series: readonly ChartSeries[];
  categories: readonly string[];
  /** Measure each series from the one below, so the top edge is the total. */
  stacked?: boolean;
  curve?: ChartCurve;
  points?: boolean;
  ticks?: number;
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function AreaChart({
  series, categories, stacked = false, curve = 'linear', points = false, ticks = 5,
  format = (value) => String(value), table, legend, className, ...surface
}: AreaChartProps): ReactNode {
  const drawn = drawnSeries(series);
  const marks = useMarkNavigation(drawn.length * categories.length);
  const tip = useMarkTooltip(marks);
  const tips = useRef<MarkTip[]>([]);

  return (
    <ChartSurface
      {...surface}
      table={table ?? areaTable(drawn.map((one) => one.series), categories, format, stacked)}
      empty={surface.empty ?? categories.length === 0}
      legend={legend === undefined && series.length > 1
        ? <ChartLegend entries={seriesLegend(series)} />
        : legend}
      tooltip={(frame) => {
        const at = tip.index === null ? undefined : tips.current[tip.index];
        return at ? (
          <ChartTooltip
            shown={tip.shown}
            x={at.x}
            y={at.y}
            bounds={{ width: frame.width, height: frame.height }}
            title={at.title}
            rows={at.rows}
          />
        ) : null;
      }}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const across = scalePoint().domain(categories.map(String)).range([0, inner.width]);
        const visible = drawn.map((one) => one.series);
        const domain = stacked
          ? stackedDomain(visible, categories.length)
          : valueDomain(visible, { fromZero: true });
        const value = scaleLinear().domain(domain).nice(ticks).range([inner.height, 0]);

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = categories
          .map((name) => ({ offset: across(String(name)) ?? 0, label: name }));

        /* Where each series' own baseline runs. Unstacked it is zero for all of
           them. Stacked it is the running total under this one. */
        const below = categories.map(() => 0);
        const built: MarkTip[] = [];
        tips.current = built;
        const layers = drawn.map(({ series: one, channel, slot }) => {
          const top: (PlotPoint | null)[] = [];
          const base: number[] = [];
          one.values.forEach((datum, index) => {
            base[index] = stacked ? below[index]! : 0;
            if (datum === null || datum === undefined) { top[index] = null; return; }
            const to = base[index]! + datum;
            if (stacked) below[index] = to;
            top[index] = {
              x: inner.x + (across(String(categories[index])) ?? 0),
              y: inner.y + value(to),
              label: format(stacked ? to : datum),
            };
            built[slot * categories.length + index] = {
              x: top[index].x,
              y: top[index].y,
              title: categories[index] ?? '',
              rows: [{ name: one.name, value: top[index].label ?? '', index: channel }],
            };
          });
          return { top, base };
        });

        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g {...tip.containerProps}>
              {drawn.map(({ series: one, channel, slot }) => {
                const layer = layers[slot]!;
                /* A stacked layer's floor moves with the data. An unstacked
                   one is the zero line. Both are the same band with a different
                   floor, so one path covers both cases. */
                const floor = stacked
                  ? layer.base.map((at) => inner.y + value(at))
                  : categories.map(() => inner.y + value(Math.max(0, domain[0])));
                return (
                  <g key={one.name} className={styles['series']}>
                    <path
                      className={styles['area']}
                      style={{ '--series-colour': seriesColour(channel) } as CSSProperties}
                      d={seriesBand(layer.top, floor, curve)}
                    />
                    <SeriesLine d={seriesPath(layer.top, curve)} seriesIndex={channel} />
                    <PointMarks
                      points={layer.top}
                      seriesIndex={channel}
                      seriesName={one.name}
                      categories={categories}
                      offset={slot * categories.length}
                      active={marks.active}
                      markProps={tip.markProps}
                      visible={points}
                    />
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

/** A stacked chart's table carries the total, because the total is what the top
 *  edge of the picture asserts. */
export function areaTable(
  series: readonly ChartSeries[],
  categories: readonly string[],
  format: (value: number) => string,
  stacked: boolean,
): ChartSurfaceProps['table'] {
  const base = seriesTable(series, categories, format);
  if (!stacked || series.length < 2) return base;
  return {
    columns: [...base.columns, 'Total'],
    rows: base.rows.map((row, index) => [
      ...row,
      format(series.reduce((sum, one) => sum + (one.values[index] ?? 0), 0)),
    ]),
  };
}
