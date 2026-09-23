import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { BoxPlot } from './BoxPlot.js';

const boxes = [
  { name: 'Europe', low: 12, q1: 18, median: 24, q3: 31, high: 40, outliers: [56, 61, 70] },
  { name: 'Americas', low: 9, q1: 14, median: 19, q3: 26, high: 34 },
];

describe('BoxPlot', () => {
  /* "Outliers are counted, not only drawn." A cluster of dots is something a
     sighted reader counts by eye and a reader who cannot see it is told nothing
     about. */
  it('counts the outliers in the label and in the table', () => {
    renderWithCrystal(<BoxPlot label="Latency" boxes={boxes} />);
    expect(screen.getByLabelText(/Europe, median 24, .*3 outliers/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Outliers' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '3' })).toBeInTheDocument();
  });

  it('says one outlier rather than 1 outliers', () => {
    renderWithCrystal(
      <BoxPlot label="Latency" boxes={[{ ...boxes[0]!, outliers: [56] }]} />,
    );
    expect(screen.getByLabelText(/1 outlier$/)).toBeInTheDocument();
  });

  /* "Whisker caps align with the box width": a narrower cap makes the whisker
     look like an arrow, which says direction where the data says extent. */
  it('caps the whiskers at the box width', () => {
    const { container } = renderWithCrystal(<BoxPlot label="Latency" boxes={boxes} />);
    const group = container.querySelector('[role="graphics-symbol"]')!;
    const box = group.querySelector('rect')!;
    const cap = Array.from(group.querySelectorAll('line'))
      .find((line) => line.getAttribute('x1') !== line.getAttribute('x2'))!;
    const capWidth = Number(cap.getAttribute('x2')) - Number(cap.getAttribute('x1'));
    expect(capWidth).toBeCloseTo(Number(box.getAttribute('width')), 5);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<BoxPlot label="Latency by region" boxes={boxes} />);
    await expectNoAxeViolations(container);
  });
});
