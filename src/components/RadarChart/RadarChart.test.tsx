import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { RadarChart } from './RadarChart.js';

const series = [
  { name: 'This release', values: [8, 6, 9, 5, 7] },
  { name: 'Last release', values: [6, 7, 5, 8, 4] },
];
const axes = ['Speed', 'Clarity', 'Coverage', 'Stability', 'Docs'];

describe('RadarChart', () => {
  /* A radar without axis labels says only "this shape is bigger than that
     shape", and the measures are lost. */
  it('labels every axis outside the ring', () => {
    const { container } = renderWithCrystal(
      <RadarChart label="Review" series={series} axes={axes} />,
    );
    /* In the picture as well as in the table beside it, which holds the other
       copy of each name. */
    const drawn = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent);
    for (const axis of axes) expect(drawn).toContain(axis);
  });

  /* Each value is its own mark, so a reader gets the numbers and not only an
     outline. */
  it('makes every axis of every series a reachable value', () => {
    const { container } = renderWithCrystal(
      <RadarChart label="Review" series={series} axes={axes} />,
    );
    expect(container.querySelectorAll('[role="graphics-symbol"]').length).toBe(10);
    expect(screen.getByLabelText('Coverage, This release, 9')).toBeInTheDocument();
  });

  /* Two polygons at a quarter opacity look very similar, so the edge carries
     the dash as well. */
  it('dashes the outline of every series after the first', () => {
    const { container } = renderWithCrystal(
      <RadarChart label="Review" series={series} axes={axes} />,
    );
    expect(container.querySelectorAll('polygon[stroke-dasharray]').length).toBe(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <RadarChart label="Review scores" series={series} axes={axes} />,
    );
    await expectNoAxeViolations(container);
  });
});
