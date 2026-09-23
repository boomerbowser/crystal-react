'use client';

/* BarChart — categorical values as bars, grouped or stacked.
 *
 * "Bars keep a small radius on the value end only." The base end stays square
 * because it sits on the axis, and rounding it would lift the bar off the line it
 * is measured from — which is the one thing a bar chart is for.
 *
 * The value axis always includes zero. A bar is a *length*, and a length read
 * from a baseline that is not zero exaggerates every difference in the data;
 * that is the oldest way to mislead with a chart, and `valueDomain` does not
 * make it available here. Charts whose marks are positions rather than lengths
 * — the line, the scatter — fit their domain to the data instead.
 *
 * Every bar is a reachable mark with its own label: "February, Revenue, 18". One
 * tab stop for the chart and arrow keys between the bars, which is
 * `useMarkNavigation` and its reasons.
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleBand, scaleLinear, stackedDomain, valueDomain } from '../../charts/scales.js';
import type { ChartSeries } from '../../charts/types.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { cx } from '../../styles/cx.js';
import styles from './BarChart.module.scss';

export interface BarChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  series: readonly ChartSeries[];
  categories: readonly string[];
  /** Bars of one category side by side, or on top of each other. */
  stacked?: boolean;
  /** How many ticks the value axis asks for. The scale decides the round ones. */
  ticks?: number;
  /** Formats a value wherever it is read — the axis, the labels, the table. */
  format?: (value: number) => string;
  /** Overrides the table the chart builds from its own data. */
  table?: ChartSurfaceProps['table'];
}

export function BarChart({
  series, categories, stacked = false, ticks = 5,
  format = (value) => String(value), table, className, ...surface
}: BarChartProps): ReactNode {
  const id = useId();
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
        const band = scaleBand().domain(categories.map(String)).range([0, inner.width]).padding(0.2);
        const domain = stacked ? stackedDomain(series, categories.length) : valueDomain(series);
        const value = scaleLinear().domain(domain).nice(ticks).range([inner.height, 0]);
        /* Inner band: where a grouped chart puts each series inside its
           category. A stacked chart has one bar per category, so its inner band
           is the whole of the outer one. */
        const inner$ = scaleBand()
          .domain(series.map((one) => one.name))
          .range([0, band.bandwidth()])
          .padding(stacked ? 0 : 0.08);
        const width = stacked ? band.bandwidth() : inner$.bandwidth();

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = categories
          .map((name) => ({ offset: (band(String(name)) ?? 0) + band.bandwidth() / 2, label: name }));

        /* Running totals per category, so a stacked bar knows where the one
           below it ended. Positive and negative stack away from zero in their own
           directions rather than cancelling. */
        const up = categories.map(() => 0);
        const down = categories.map(() => 0);

        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g {...marks.containerProps} className={styles['marks']}>
              {series.map((one, s) => (
                <g key={one.name}>
                  {categories.map((category, c) => {
                    const datum = one.values[c];
                    if (datum === null || datum === undefined) return null;
                    const x = inner.x + (band(String(category)) ?? 0)
                      + (stacked ? 0 : (inner$(one.name) ?? 0));
                    let top: number;
                    let bottom: number;
                    if (stacked) {
                      const base = datum >= 0 ? up[c]! : down[c]!;
                      const end = base + datum;
                      if (datum >= 0) up[c] = end; else down[c] = end;
                      top = value(Math.max(base, end));
                      bottom = value(Math.min(base, end));
                    } else {
                      top = value(Math.max(0, datum));
                      bottom = value(Math.min(0, datum));
                    }
                    const index = s * categories.length + c;
                    return (
                      <g
                        key={category}
                        {...marks.markProps(index)}
                        role="graphics-symbol"
                        aria-label={`${category}, ${one.name}, ${format(datum)}`}
                        className={styles['bar']}
                        data-active={marks.active === index ? '' : undefined}
                        /* The colour arrives as a custom property rather than as
                           `fill`, so that the forced-colours rules in the
                           stylesheet can win. An inline `fill` outranks every
                           rule in every sheet, including the one that has to
                           replace it when the operating system takes the palette
                           away. */
                        style={{ '--series-colour': seriesColour(s) } as CSSProperties}
                      >
                        <path className={styles['fill']}
                          d={barPath(x, inner.y + top, width, Math.max(0, bottom - top), datum >= 0)}
                        />
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
            <desc id={id}>{`${series.length} series across ${categories.length} categories`}</desc>
          </>
        );
      }}
    </ChartSurface>
  );
}

/* The radius is on the value end alone, so the path is written rather than being
   a `rect` with a `rx` — a `rx` rounds all four. Below zero the value end is the
   bottom, which is why the direction is a parameter and not an assumption. */
function barPath(x: number, y: number, width: number, height: number, positive: boolean): string {
  const radius = Math.min(chartGeometry.barRadius, width / 2, height);
  if (height <= 0) return '';
  return positive
    ? `M${x},${y + height}V${y + radius}a${radius},${radius} 0 0 1 ${radius},${-radius}`
      + `h${width - radius * 2}a${radius},${radius} 0 0 1 ${radius},${radius}V${y + height}Z`
    : `M${x},${y}V${y + height - radius}a${radius},${radius} 0 0 0 ${radius},${radius}`
      + `h${width - radius * 2}a${radius},${radius} 0 0 0 ${radius},${-radius}V${y}Z`;
}

/** The table a chart builds from its own data when the caller gives none. */
export function seriesTable(
  series: readonly ChartSeries[],
  categories: readonly string[],
  format: (value: number) => string,
): ChartSurfaceProps['table'] {
  return {
    columns: ['Category', ...series.map((one) => one.name)],
    rows: categories.map((category, index) => [
      category,
      ...series.map((one) => {
        const value = one.values[index];
        return value === null || value === undefined ? null : format(value);
      }),
    ]),
  };
}
