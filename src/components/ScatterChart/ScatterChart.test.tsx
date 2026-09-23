import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ScatterChart } from './ScatterChart.js';

const series = [{
  name: 'Accounts',
  points: [
    { x: 2, y: 40, size: 1, name: 'Ash' },
    { x: 6, y: 90, size: 4, name: 'Brook' },
  ],
}];

describe('ScatterChart', () => {
  it('states both coordinates of every point', () => {
    renderWithCrystal(
      <ScatterChart label="Usage" series={series} xLabel="Seats" yLabel="Sessions" />,
    );
    expect(screen.getByLabelText('Ash, Seats 2, Sessions 40, 1')).toBeInTheDocument();
  });

  /* Sizing by area, not by diameter: equal differences in the data are equal
     differences in the amount of ink. The obvious mapping — the value onto the
     diameter — makes the largest point three times the area it should be. */
  it('sizes a point by its area', () => {
    const { container } = renderWithCrystal(
      <ScatterChart
        label="Usage"
        xLabel="Seats"
        yLabel="Sessions"
        series={[{
          name: 'Accounts',
          points: [{ x: 1, y: 1, size: 0 }, { x: 2, y: 2, size: 5 }, { x: 3, y: 3, size: 10 }],
        }]}
      />,
    );
    const widths = Array.from(container.querySelectorAll('[role="graphics-symbol"] path'))
      .map((path) => Math.abs(Number(/^M(-?[\d.]+),/.exec(path.getAttribute('d') ?? '')?.[1] ?? 0)) * 2);
    const [small, middle, large] = widths as [number, number, number];
    /* Halfway in value is halfway in area, not halfway in width. */
    const area = (width: number) => width ** 2;
    expect((area(middle) - area(small)) / (area(large) - area(small))).toBeCloseTo(0.5, 2);
    expect((middle - small) / (large - small)).not.toBeCloseTo(0.5, 2);
  });

  /* A dense scatter is exactly the chart whose table matters most, and exactly
     the one an author is tempted to summarise instead. */
  it('puts every point in the table, not a summary', () => {
    renderWithCrystal(
      <ScatterChart label="Usage" series={series} xLabel="Seats" yLabel="Sessions" />,
    );
    expect(screen.getByRole('rowheader', { name: 'Ash' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Brook' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <ScatterChart label="Usage by account" series={series} xLabel="Seats" yLabel="Sessions" />,
    );
    await expectNoAxeViolations(container);
  });
});
