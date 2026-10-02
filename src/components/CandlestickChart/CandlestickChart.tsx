'use client';

/* CandlestickChart: open, high, low and close per period.
 *
 * "Rise and fall colour from the status tokens, never red and green alone." A
 * candle that rose is drawn hollow, one that fell is drawn filled, and the
 * colour is on top of that. Candlestick charts have used this convention since
 * long before screens had colour, so the second channel is already part of how
 * a candle is drawn and the chart needs no dash or hatch.
 *
 * "Wick and body share one x centre; body has no radius." A candle is a
 * measurement of four numbers at one instant, and a rounded body would make the
 * open and close read as approximate.
 *
 * "Each period is reachable and states all four values."
 */
import { type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { Axes, type AxisTick } from '../../charts/Axes.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleBand, scaleLinear } from '../../charts/scales.js';
import { cx } from '../../styles/cx.js';
import styles from './CandlestickChart.module.scss';

export interface Candle {
  period: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  candles: readonly Candle[];
  ticks?: number;
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function CandlestickChart({
  candles, ticks = 5, format = (value) => String(value), table, className, ...surface
}: CandlestickChartProps): ReactNode {
  const marks = useMarkNavigation(candles.length);

  return (
    <ChartSurface
      {...surface}
      table={table ?? {
        columns: ['Period', 'Open', 'High', 'Low', 'Close', 'Direction'],
        rows: candles.map((candle) => [
          candle.period,
          format(candle.open), format(candle.high), format(candle.low), format(candle.close),
          direction(candle),
        ]),
      }}
      empty={surface.empty ?? candles.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const band = scaleBand().domain(candles.map((candle) => candle.period))
          .range([0, inner.width]).padding(0.3);
        const reach = candles.flatMap((candle) => [candle.high, candle.low]);
        const value = scaleLinear()
          .domain(reach.length ? [Math.min(...reach), Math.max(...reach)] : [0, 1])
          .nice(ticks)
          .range([inner.height, 0]);

        const valueTicks: AxisTick[] = value.ticks(ticks)
          .map((tick) => ({ offset: value(tick), label: format(tick) }));
        const categoryTicks: AxisTick[] = candles.map((candle) => ({
          offset: (band(candle.period) ?? 0) + band.bandwidth() / 2,
          label: candle.period,
        }));

        return (
          <>
            <Axes
              frame={frame}
              value={valueTicks}
              category={categoryTicks}
              categoryEvery={Math.ceil(candles.length / 10)}
            />
            <g {...marks.containerProps}>
              {candles.map((candle, index) => {
                const x = inner.x + (band(candle.period) ?? 0);
                const width = band.bandwidth();
                const centre = x + width / 2;
                const top = inner.y + value(Math.max(candle.open, candle.close));
                const bottom = inner.y + value(Math.min(candle.open, candle.close));
                const rose = candle.close >= candle.open;
                return (
                  <g
                    key={candle.period}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${candle.period}, ${direction(candle)}, open ${format(candle.open)}, `
                      + `high ${format(candle.high)}, low ${format(candle.low)}, close ${format(candle.close)}`}
                    className={styles['candle']}
                    data-direction={rose ? 'rose' : 'fell'}
                    data-active={marks.active === index ? '' : undefined}
                  >
                    <line
                      className={styles['wick']}
                      x1={centre}
                      x2={centre}
                      y1={inner.y + value(candle.high)}
                      y2={inner.y + value(candle.low)}
                    />
                    {/* A minimum of one pixel, so a period that opened and closed
                        at the same price still draws a candle. */}
                    <rect
                      className={styles['body']}
                      x={x}
                      y={top}
                      width={width}
                      height={Math.max(1, bottom - top)}
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

function direction(candle: Candle): string {
  if (candle.close > candle.open) return 'rose';
  if (candle.close < candle.open) return 'fell';
  return 'unchanged';
}
