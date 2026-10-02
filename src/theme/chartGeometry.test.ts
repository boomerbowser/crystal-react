import { describe, expect, it } from 'vitest';
import { chartGeometry, CHART_SERIES_COUNT } from './chartGeometry.js';
import { crystalTokens } from './tokens.generated.js';

/* Until `@crystal-ui/core@2.1.0` was published these values were transcribed
 * here as literals, and the test in this file's place had exactly one job: to
 * fail the day the installed core started publishing them, so nobody had to
 * remember that the shim existed. It did fail on the bump.
 *
 * These numbers are now Crystal's, read at build time, which settles
 * "are they right". What this test asks is "is each one still reading the
 * token it claims to". A geometry that silently fell back to a stale number
 * would draw charts that look almost correct.
 */
describe('chart geometry', () => {
  it('reads every value from a token Crystal publishes', () => {
    const expected: Record<keyof typeof chartGeometry, keyof typeof crystalTokens> = {
      stroke: 'chart.stroke',
      hairline: 'chart.hairline',
      pointMin: 'chart.pointMin',
      pointMax: 'chart.pointMax',
      barRadius: 'chart.barRadius',
      cellGap: 'chart.cellGap',
      ringThickness: 'chart.ringThickness',
      /* The one shared value: a gauge arc and a progress ring are drawn at the
         same weight, so they come from the same token. */
      ringStroke: 'progress.ringStroke',
      fillOpacity: 'chart.fillOpacity',
      linkOpacity: 'chart.linkOpacity',
      intensitySteps: 'chart.intensitySteps',
      gaugeSweep: 'chart.gaugeSweep',
    };

    for (const [key, token] of Object.entries(expected)) {
      expect(crystalTokens[token], `${token} is not published`).toBeDefined();
      expect(
        chartGeometry[key as keyof typeof chartGeometry],
        `${key} should read ${token}`,
      ).toBe(Number.parseFloat(crystalTokens[token]));
    }
  });

  it('takes the series count from Crystal rather than assuming six', () => {
    expect(CHART_SERIES_COUNT).toBe(Number.parseFloat(crystalTokens['chart.seriesCount']));
  });

  /* Every one is a number a chart does arithmetic with. `NaN` propagates
     silently through `Math.max`, an SVG attribute and a path string, and the
     chart renders with nothing drawn rather than with an error. */
  it('is numbers, never NaN', () => {
    for (const [key, n] of Object.entries(chartGeometry)) {
      expect(Number.isFinite(n), `${key} is ${n}`).toBe(true);
    }
    expect(Number.isFinite(CHART_SERIES_COUNT)).toBe(true);
  });
});
