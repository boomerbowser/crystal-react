'use client';

/* RadarChart — several measures on radial axes.
 *
 * "Axis labels sit outside the outer ring" and "axes are labelled; series are
 * named". A radar is the chart most often shipped as a decorative polygon with
 * no axis labels at all, at which point it says only "this shape is bigger than
 * that shape" — which is not what the measures were for.
 *
 * "Haze fill inside each series polygon", at Crystal's fill opacity, so two
 * overlapping series stay two. The outline carries the series' dash as well, for
 * the same reason the line chart's does: two polygons at a quarter opacity are
 * two very similar shapes, and the edge is what a reader follows.
 *
 * Every axis of every series is a mark. A radar of six measures and two series is
 * twelve numbers, and a reader who cannot see the shape needs all twelve rather
 * than a description of the outline.
 */
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { ChartLegend } from '../ChartLegend/ChartLegend.js';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip.js';
import { seriesColour, seriesDash } from '../../charts/channel.js';
import { drawnSeries, seriesLegend } from '../../charts/series.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { useMarkTooltip, type MarkTip } from '../../charts/useMarkTooltip.js';
import { seriesTable } from '../BarChart/BarChart.js';
import { scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { MARK_TARGET } from '../../charts/target.js';
import { cx } from '../../styles/cx.js';
import type { ChartSeries } from '../../charts/types.js';
import styles from './RadarChart.module.scss';

export interface RadarChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  series: readonly ChartSeries[];
  /** One label per radial axis, in order. */
  axes: readonly string[];
  /** Fix the range. Without it the axes share the data's own maximum. */
  domain?: [number, number];
  /** How many rings to draw. */
  rings?: number;
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function RadarChart({
  series, axes, domain, rings = 4, format = (value) => String(value),
  table, legend, className, height = 320, ...surface
}: RadarChartProps): ReactNode {
  const drawn = drawnSeries(series);
  const marks = useMarkNavigation(drawn.length * axes.length);
  const tip = useMarkTooltip(marks);
  const tips = useRef<MarkTip[]>([]);
  const values = drawn.flatMap((one) => one.series.values)
    .filter((value): value is number => value !== null);
  const [low, high] = domain ?? [0, Math.max(1, ...values)];

  return (
    <ChartSurface
      {...surface}
      height={height}
      /* Room outside the ring for the axis labels, which is where they go. */
      insets={{ top: 28, right: 72, bottom: 28, left: 72 }}
      table={table ?? seriesTable(drawn.map((one) => one.series), axes, format)}
      empty={surface.empty ?? axes.length === 0}
      legend={legend === undefined && series.length > 1
        ? <ChartLegend entries={seriesLegend(series)} mark="line" />
        : legend}
      tooltip={(frame) => {
        const shown = tip.index === null ? undefined : tips.current[tip.index];
        return shown ? (
          <ChartTooltip
            shown={tip.shown}
            x={shown.x}
            y={shown.y}
            bounds={{ width: frame.width, height: frame.height }}
            title={shown.title}
            rows={shown.rows}
          />
        ) : null;
      }}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const radius = Math.min(inner.width, inner.height) / 2;
        const centreX = inner.x + inner.width / 2;
        const centreY = inner.y + inner.height / 2;
        const scale = scaleLinear().domain([low, high]).range([0, radius]);
        /* From twelve o'clock, clockwise: the order a reader expects, and the
           order the axis labels are listed in. */
        const angle = (index: number) => (index / axes.length) * Math.PI * 2 - Math.PI / 2;
        const at = (index: number, value: number): [number, number] => [
          Math.cos(angle(index)) * scale(value),
          Math.sin(angle(index)) * scale(value),
        ];
        const built: MarkTip[] = [];
        tips.current = built;

        return (
          <g transform={`translate(${centreX},${centreY})`}>
            <g aria-hidden="true" className={styles['web']}>
              {Array.from({ length: rings }, (_, ring) => {
                const r = ((ring + 1) / rings) * radius;
                return (
                  <polygon
                    key={r}
                    className={styles['ring']}
                    points={axes.map((_, index) => (
                      `${Math.cos(angle(index)) * r},${Math.sin(angle(index)) * r}`
                    )).join(' ')}
                  />
                );
              })}
              {axes.map((label, index) => {
                const [x, y] = at(index, high);
                /* Outside the outer ring, pushed a little further along the same
                   direction, and anchored by which side of the circle it is on so
                   a label on the left does not run back across the chart. */
                const [lx, ly] = [x * 1.12, y * 1.12];
                return (
                  <g key={label}>
                    <line className={styles['spoke']} x1={0} y1={0} x2={x} y2={y} />
                    <text
                      className={styles['axisLabel']}
                      x={lx}
                      y={ly}
                      textAnchor={Math.abs(lx) < 1 ? 'middle' : lx > 0 ? 'start' : 'end'}
                      dominantBaseline="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>

            <g {...tip.containerProps}>
              {drawn.map(({ series: one, channel, slot }) => {
                const points = axes.map((_, index) => at(index, one.values[index] ?? low));
                const dash = seriesDash(channel);
                return (
                  <g
                    key={one.name}
                    className={styles['series']}
                    style={{ '--series-colour': seriesColour(channel) } as CSSProperties}
                  >
                    <polygon
                      className={styles['area']}
                      points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                      {...(dash ? { strokeDasharray: dash } : {})}
                    />
                    {axes.map((axis, index) => {
                      const datum = one.values[index];
                      if (datum === null || datum === undefined) return null;
                      const [x, y] = points[index]!;
                      const mark = slot * axes.length + index;
                      /* Plot coordinates, not the group's: everything under this
                         `<g>` is drawn relative to the centre, and the panel is
                         positioned in the plot the group sits in. */
                      built[mark] = {
                        x: centreX + x,
                        y: centreY + y,
                        title: axis,
                        rows: [{ name: one.name, value: format(datum), index: channel }],
                      };
                      return (
                        <g
                          key={axis}
                          {...tip.markProps(mark)}
                          role="graphics-symbol"
                          aria-label={`${axis}, ${one.name}, ${format(datum)}`}
                          className={styles['point']}
                          data-active={marks.active === mark ? '' : undefined}
                          transform={`translate(${x},${y})`}
                        >
                          <rect
                            className={styles['target']}
                            x={-MARK_TARGET / 2}
                            y={-MARK_TARGET / 2}
                            width={MARK_TARGET}
                            height={MARK_TARGET}
                          />
                          <circle className={styles['dot']} r={chartGeometry.pointMin / 2} />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </g>
        );
      }}
    </ChartSurface>
  );
}
