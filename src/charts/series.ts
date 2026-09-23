/* Which series are drawn, and which channel each one keeps.
 *
 * Two numbers, deliberately distinct, because conflating them is the bug this
 * file exists to make impossible:
 *
 * - **channel** is the series' place in the palette's scale — its colour, its
 *   dash, its marker. It is the position in the array the caller passed, so it
 *   does not move when a neighbour is hidden.
 * - **slot** is its place among the series actually drawn, which is what mark
 *   numbering is built from. It *does* close up, because a roving tabindex over
 *   marks that are not there would step into holes.
 */
import type { ChartSeries } from './types.js';

export interface DrawnSeries {
  series: ChartSeries;
  /** Its place in the series scale. Stable when another series is hidden. */
  channel: number;
  /** Its place among the drawn series. Mark indices are built from this. */
  slot: number;
}

export function drawnSeries(series: readonly ChartSeries[]): DrawnSeries[] {
  const out: DrawnSeries[] = [];
  series.forEach((one, channel) => {
    if (one.hidden) return;
    out.push({ series: one, channel, slot: out.length });
  });
  return out;
}

/** Entries for a `ChartLegend`, in the caller's order, hidden ones included —
 *  a legend that dropped the series you just turned off would leave you no way
 *  to turn it back on. Structurally a `ChartLegendEntry`; not imported from the
 *  component, because the component imports this kit and not the other way. */
export function seriesLegend(
  series: readonly ChartSeries[],
): { name: string; index: number; shown: boolean }[] {
  return series.map((one, index) => ({ name: one.name, index, shown: !one.hidden }));
}
