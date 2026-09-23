import { describe, expect, it } from 'vitest';
import resolver from '@crystal-ui/core/resolver';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };
import { CHART_SERIES_COUNT, chartTokens } from './chartTokens.js';

const palettes = Object.keys((crystalFlat as { palettes: Record<string, unknown> }).palettes);
const modes = ['light', 'dark'] as const;

/* A table copied from another repository can only be stale, so this is what
   watches it. Two claims: while core publishes none of these the shim covers
   every palette and mode, and the moment core publishes them the shim stops. */
describe('the chart token shim', () => {
  it('covers every palette and mode Crystal ships', () => {
    for (const palette of palettes) {
      for (const mode of modes) {
        const tokens = chartTokens(palette, mode, {});
        for (let i = 1; i <= CHART_SERIES_COUNT; i += 1) {
          expect(tokens[`--cr-chart-series-${i}`], `${palette} ${mode} series ${i}`)
            .toMatch(/^#[0-9A-F]{6}$/);
        }
        expect(tokens['--cr-chart-axis'], `${palette} ${mode} axis`).toBeDefined();
        expect(tokens['--cr-chart-grid'], `${palette} ${mode} grid`).toBeDefined();
      }
    }
  });

  it('yields nothing Crystal already publishes', () => {
    const resolved = resolver.resolve({ palette: 'prism' }, 'light') as Record<string, unknown>;
    for (const name of Object.keys(chartTokens('prism', 'light', resolved))) {
      expect(name in resolved, `${name} is published by core and still shimmed`).toBe(false);
    }
  });

  /* The one that ends it. When the dependency moves to a core that publishes the
     scale itself, this fails — and the fix is to delete the shim, which is R-20. */
  it('is still needed: the installed core publishes no series scale', () => {
    const resolved = resolver.resolve({ palette: 'prism' }, 'light') as Record<string, unknown>;
    expect(
      '--cr-chart-series-1' in resolved,
      'core now publishes the series scale — delete src/theme/chartTokens.ts and close R-20',
    ).toBe(false);
  });
});
