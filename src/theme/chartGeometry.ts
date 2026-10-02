/* Chart geometry, as numbers.
 *
 * Crystal publishes these as custom properties, and a chart cannot use them
 * that way: `var(--cr-chart-bar-radius)` is a string the browser resolves at
 * paint time, and an SVG rounding a bar needs the number now, to put in a
 * `rx` attribute or to subtract from a height. So the same values exist twice,
 * once as properties for CSS and once here as numbers for arithmetic, and the
 * two must not drift.
 *
 * They cannot drift, because both come from the same place.
 * `tokens.generated.ts` is generated from the installed `@crystal-ui/core`'s own
 * export on every build and is gitignored, so these are Crystal's published
 * values read at build time. No table of them is typed out here.
 *
 * The package publishes these tokens from 2.1.0. The catalogue had named the
 * scales since 2.0, and until 2.1.0 this file carried the values as literals, a
 * transcription that `lint:tokens` knew about by name and that R-20 deleted.
 *
 * `ringStroke` comes from `progress.ringStroke` and not from a `chart.*` token,
 * by decision: it is the one value shared with the circular progress
 * indicator, so that a gauge arc and a progress ring cannot be drawn at
 * different weights.
 */
import { crystalTokens } from './tokens.generated.js';

/* Every one of these is published as a dimension or a bare number. `parseFloat`
   takes the leading number and ignores a unit, so `2px` and `0.32` are both
   readable here, and a malformed value becomes `NaN` instead of silently
   becoming zero. */
const value = (name: keyof typeof crystalTokens): number => {
  const parsed = Number.parseFloat(crystalTokens[name]);
  if (Number.isNaN(parsed)) {
    throw new RangeError(`Crystal published no usable number for ${name}`);
  }
  return parsed;
};

export const chartGeometry = {
  stroke: value('chart.stroke'),
  hairline: value('chart.hairline'),
  pointMin: value('chart.pointMin'),
  pointMax: value('chart.pointMax'),
  barRadius: value('chart.barRadius'),
  cellGap: value('chart.cellGap'),
  ringThickness: value('chart.ringThickness'),
  ringStroke: value('progress.ringStroke'),
  fillOpacity: value('chart.fillOpacity'),
  linkOpacity: value('chart.linkOpacity'),
  intensitySteps: value('chart.intensitySteps'),
  gaugeSweep: value('chart.gaugeSweep'),
} as const;

/** How many series the scale tells apart by colour. A seventh repeats the first
 *  and must differ by another channel. This is Crystal's `chart.seriesCount`,
 *  and the reason `seriesChannel` exists. */
export const CHART_SERIES_COUNT = value('chart.seriesCount');
