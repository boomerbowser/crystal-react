/* Scales, and the small amount of arithmetic charts share.
 *
 * `d3-scale` and `d3-shape` do the mathematics — they are ISC-licensed, they
 * carry no rendering of their own, and every element on the screen is still
 * written by this library, which is what matters: a charting library that owns
 * the DOM owns the materials, the focus ring and the forced-colours behaviour
 * too, and none of those would be Crystal's.
 */
import { scaleBand, scaleLinear } from 'd3-scale';
import type { ChartSeries } from './types.js';

export { scaleBand, scaleLinear };

/** The extent of every value across every series, `null`s ignored. */
export function extent(series: readonly ChartSeries[]): [number, number] {
  const values = series.flatMap((one) => one.values.filter((v): v is number => v !== null));
  if (values.length === 0) return [0, 1];
  return [Math.min(...values), Math.max(...values)];
}

/**
 * The domain a value axis should span.
 *
 * Zero is included for anything drawn as a length from the axis — a bar that
 * starts at its own minimum exaggerates every difference in it, which is the
 * oldest way to mislead with a chart and not one a design system should make
 * easy. Charts whose marks are positions rather than lengths (a line, a scatter)
 * pass `fromZero: false` and get a domain fitted to the data.
 */
export function valueDomain(
  series: readonly ChartSeries[],
  { fromZero = true }: { fromZero?: boolean } = {},
): [number, number] {
  const [low, high] = extent(series);
  if (fromZero) return [Math.min(0, low), Math.max(0, high)];
  if (low === high) return [low - 1, high + 1];
  const pad = (high - low) * 0.05;
  return [low - pad, high + pad];
}

/** Sums per category, for a stacked chart. */
export function stackedDomain(series: readonly ChartSeries[], categories: number): [number, number] {
  let high = 0;
  let low = 0;
  for (let i = 0; i < categories; i += 1) {
    let up = 0;
    let down = 0;
    for (const one of series) {
      const value = one.values[i] ?? 0;
      if (value >= 0) up += value; else down += value;
    }
    high = Math.max(high, up);
    low = Math.min(low, down);
  }
  return [low, high];
}
