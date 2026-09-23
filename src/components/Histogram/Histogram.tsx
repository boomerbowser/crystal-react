'use client';

/* Histogram — frequency across bins.
 *
 * "Bins meet without gaps." A histogram is not a bar chart of categories: its x
 * axis is continuous, the bins partition it, and a gap between two bins would
 * draw a range where nothing was counted. That is also why the bins are computed
 * here from the values rather than taken as categories — a caller who binned the
 * data themselves would have to keep the bin edges and the axis in step, and one
 * of the two would eventually move.
 *
 * "Bin bounds and counts are text." Both, in the label and in the table: "10 to
 * 20, 14" rather than a position and a height.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { cx } from '../../styles/cx.js';
import styles from './Histogram.module.scss';

export interface HistogramProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  values: readonly number[];
  /** How many bins. The range is the data's unless `domain` says otherwise. */
  bins?: number;
  domain?: [number, number];
  ticks?: number;
  format?: (value: number) => string;
  /** How a bin's bounds read. */
  formatBin?: (from: number, to: number) => string;
  table?: ChartSurfaceProps['table'];
}

export interface Bin {
  from: number;
  to: number;
  count: number;
}

export function Histogram({
  values, bins = 10, domain, ticks = 5,
  format = (value) => String(value),
  formatBin = (from, to) => `${from} to ${to}`,
  table, className, ...surface
}: HistogramProps): ReactNode {
  const binned = binValues(values, bins, domain);
  const marks = useMarkNavigation(binned.length);

  return (
    <ChartSurface
      {...surface}
      table={table ?? {
        columns: ['Bin', 'Count'],
        rows: binned.map((bin) => [formatBin(bin.from, bin.to), format(bin.count)]),
      }}
      empty={surface.empty ?? values.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const low = binned[0]?.from ?? 0;
        const high = binned[binned.length - 1]?.to ?? 1;
        const across = scaleLinear().domain([low, high]).range([0, inner.width]);
        const count = scaleLinear()
          .domain([0, Math.max(1, ...binned.map((bin) => bin.count))])
          .nice(ticks)
          .range([inner.height, 0]);

        const valueTicks: AxisTick[] = count.ticks(ticks)
          .map((tick) => ({ offset: count(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = binned
          .map((bin) => ({ offset: across(bin.from), label: format(bin.from) }))
          .concat([{ offset: across(high), label: format(high) }]);

        return (
          <>
            <Axes
              frame={frame}
              value={valueTicks}
              category={categoryTicks}
              categoryEvery={Math.ceil(binned.length / 8)}
            />
            <g {...marks.containerProps}>
              {binned.map((bin, index) => {
                const x = inner.x + across(bin.from);
                /* Adjacent edges, not width per bin: a rounded width leaves a
                   sub-pixel gap between two bins that should meet, and the gap
                   draws a range where nothing was counted. */
                const width = across(bin.to) - across(bin.from);
                const top = count(bin.count);
                const height = inner.height - top;
                const radius = Math.min(chartGeometry.barRadius, width / 2, height);
                return (
                  <g
                    key={`${bin.from}-${bin.to}`}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${formatBin(bin.from, bin.to)}, ${format(bin.count)}`}
                    className={styles['bin']}
                    data-active={marks.active === index ? '' : undefined}
                    style={{ '--series-colour': seriesColour(0) } as CSSProperties}
                  >
                    <path
                      className={styles['fill']}
                      d={height <= 0 ? '' : `M${x},${inner.y + inner.height}V${inner.y + top + radius}`
                        + `a${radius},${radius} 0 0 1 ${radius},${-radius}h${width - radius * 2}`
                        + `a${radius},${radius} 0 0 1 ${radius},${radius}V${inner.y + inner.height}Z`}
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

/** Equal-width bins over the range, with the last one closed at the top so the
 *  largest value is counted rather than falling off the end. */
export function binValues(
  values: readonly number[], bins: number, domain?: [number, number],
): Bin[] {
  if (values.length === 0) return [];
  const low = domain?.[0] ?? Math.min(...values);
  const high = domain?.[1] ?? Math.max(...values);
  const width = (high - low) / bins || 1;
  const out: Bin[] = Array.from({ length: bins }, (_, index) => ({
    from: low + index * width,
    to: low + (index + 1) * width,
    count: 0,
  }));
  for (const value of values) {
    if (value < low || value > high) continue;
    const index = Math.min(bins - 1, Math.floor((value - low) / width));
    out[index]!.count += 1;
  }
  return out;
}
