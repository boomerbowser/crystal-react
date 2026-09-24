'use client';

/* WaterfallChart — the cumulative effect of sequential changes.
 *
 * "Each step states its delta and the running total." Both, because they are two
 * different facts and a waterfall is the chart where people read one and mean the
 * other: a bar drawn from 82 to 71 is a step of −11 and a position of 71, and the
 * picture shows the step while the question is usually the total. So the label is
 * "Refunds, −11, running total 71" and the table has a column for each.
 *
 * "Increase, decrease and total colour from the status tokens" — and never colour
 * alone. The sign is in the label, the delta is written with its sign, and the
 * total steps carry a different *shape* as well: they are full-height bars from
 * the axis rather than floating ones, which is what a total is.
 *
 * "Connectors align with bar edges." The connector leaves the top of one bar and
 * arrives at the top of the next, so the eye follows the running total across
 * the gap rather than guessing where the next bar starts.
 */
import { type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleBand, scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { cx } from '../../styles/cx.js';
import styles from './WaterfallChart.module.scss';

export interface WaterfallStep {
  name: string;
  /** The change. Ignored for a total, which is read from the running sum. */
  value: number;
  /** A subtotal or the final total: drawn from the axis rather than floating. */
  total?: boolean;
}

export interface WaterfallChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  steps: readonly WaterfallStep[];
  ticks?: number;
  format?: (value: number) => string;
  /** How a change reads, sign and all. */
  formatDelta?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function WaterfallChart({
  steps, ticks = 5,
  format = (value) => String(value),
  formatDelta = (value) => (value > 0 ? `+${value}` : String(value)),
  table, className, ...surface
}: WaterfallChartProps): ReactNode {
  const marks = useMarkNavigation(steps.length);
  const laid = layout(steps);

  return (
    <ChartSurface
      {...surface}
      table={table ?? {
        columns: ['Step', 'Change', 'Running total'],
        rows: laid.map((step) => [
          step.name,
          step.total ? '—' : formatDelta(step.delta),
          format(step.to),
        ]),
      }}
      empty={surface.empty ?? steps.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const band = scaleBand().domain(steps.map((step) => step.name))
          .range([0, inner.width]).padding(0.25);
        const reach = laid.flatMap((step) => [step.from, step.to]).concat([0]);
        const value = scaleLinear()
          .domain([Math.min(...reach), Math.max(...reach)])
          .nice(ticks)
          .range([inner.height, 0]);

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = steps.map((step) => ({
          offset: (band(step.name) ?? 0) + band.bandwidth() / 2,
          label: step.name,
        }));

        return (
          <>
            <Axes frame={frame} value={valueTicks} category={categoryTicks} />
            <g className={styles['connectors']} aria-hidden="true">
              {laid.slice(0, -1).map((step, index) => {
                const next = laid[index + 1]!;
                const x1 = inner.x + (band(step.name) ?? 0);
                const x2 = inner.x + (band(next.name) ?? 0) + band.bandwidth();
                const y = inner.y + value(step.to);
                return (
                  <line
                    key={step.name}
                    className={styles['connector']}
                    x1={x1}
                    x2={x2}
                    y1={y}
                    y2={y}
                  />
                );
              })}
            </g>
            <g {...marks.containerProps}>
              {laid.map((step, index) => {
                const x = inner.x + (band(step.name) ?? 0);
                const width = band.bandwidth();
                const top = inner.y + value(Math.max(step.from, step.to));
                const height = Math.abs(value(step.from) - value(step.to));
                const kind = step.total ? 'total' : step.delta >= 0 ? 'increase' : 'decrease';
                const radius = Math.min(chartGeometry.barRadius, width / 2, height);
                return (
                  <g
                    key={step.name}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={step.total
                      ? `${step.name}, total ${format(step.to)}`
                      : `${step.name}, ${formatDelta(step.delta)}, running total ${format(step.to)}`}
                    className={styles['step']}
                    data-kind={kind}
                    data-active={marks.active === index ? '' : undefined}
                  >
                    <path
                      className={styles['fill']}
                      d={height <= 0 ? '' : `M${x},${top + height}V${top + radius}`
                        + `a${radius},${radius} 0 0 1 ${radius},${-radius}h${width - radius * 2}`
                        + `a${radius},${radius} 0 0 1 ${radius},${radius}V${top + height}Z`}
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

interface LaidStep extends WaterfallStep {
  from: number;
  to: number;
  delta: number;
}

/** Where each bar starts and ends, and what the running total is after it. */
export function layout(steps: readonly WaterfallStep[]): LaidStep[] {
  let running = 0;
  return steps.map((step) => {
    if (step.total) {
      /* A total is drawn from the axis: it is not a change, it is where the
         running total has got to, and floating it would make the picture claim a
         step of its own size. */
      return { ...step, from: 0, to: running, delta: 0 };
    }
    const from = running;
    running += step.value;
    return { ...step, from, to: running, delta: step.value };
  });
}
