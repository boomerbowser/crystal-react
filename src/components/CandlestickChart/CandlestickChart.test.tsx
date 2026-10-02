import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CandlestickChart } from './CandlestickChart.js';

const candles = [
  { period: 'Mon', open: 100, high: 108, low: 98, close: 106 },
  { period: 'Tue', open: 106, high: 107, low: 99, close: 101 },
  { period: 'Wed', open: 101, high: 104, low: 100, close: 101 },
];

describe('CandlestickChart', () => {
  it('states all four values for every period', () => {
    renderWithCrystal(<CandlestickChart label="Price" candles={candles} />);
    expect(screen.getByLabelText('Mon, rose, open 100, high 108, low 98, close 106'))
      .toBeInTheDocument();
  });

  /* "Never red and green alone": the direction is a fill as well as a colour
     (hollow rose, filled fell), and a word in the label and in the table. */
  it('carries the direction as a fill and as a word, not only as a colour', () => {
    const { container } = renderWithCrystal(<CandlestickChart label="Price" candles={candles} />);
    const directions = Array.from(container.querySelectorAll('[data-direction]'))
      .map((candle) => (candle as HTMLElement).dataset['direction']);
    expect(directions).toEqual(['rose', 'fell', 'rose']);
    expect(screen.getByRole('cell', { name: 'fell' })).toBeInTheDocument();
  });

  /* A period that opened and closed at the same price is still a candle. */
  it('draws a body for an unchanged period rather than nothing', () => {
    const { container } = renderWithCrystal(
      <CandlestickChart label="Price" candles={[{ period: 'Mon', open: 100, high: 104, low: 98, close: 100 }]} />,
    );
    const body = container.querySelector('rect');
    expect(Number(body?.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<CandlestickChart label="Price" candles={candles} />);
    await expectNoAxeViolations(container);
  });
});
