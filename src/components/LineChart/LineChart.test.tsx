import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { LineChart } from './LineChart.js';

const series = [
  { name: 'Sessions', values: [412, 418, 415] },
  { name: 'Signups', values: [12, null, 18] },
];
const categories = ['Monday', 'Tuesday', 'Wednesday'];

describe('LineChart', () => {
  it('labels every point with its category, series and value', () => {
    renderWithCrystal(<LineChart label="Traffic" series={series} categories={categories} />);
    expect(screen.getByLabelText('Tuesday, Sessions, 418')).toBeInTheDocument();
  });

  /* A gap breaks the line rather than being interpolated through: joining across
     a day nobody measured draws a measurement nobody made. */
  it('breaks the line at a gap rather than drawing through it', () => {
    const { container } = renderWithCrystal(
      <LineChart label="Traffic" series={[series[1]!]} categories={categories} />,
    );
    const path = container.querySelector('path[d]');
    /* Two subpaths, so two move commands. */
    expect((path?.getAttribute('d') ?? '').match(/M/g)?.length).toBe(2);
    expect(screen.queryByLabelText(/Tuesday, Signups/)).toBeNull();
  });

  /* The second channel. Series after the first are dashed, so two lines are two
     lines in a monochrome print and under forced colours. */
  it('gives every series after the first a dash pattern', () => {
    const { container } = renderWithCrystal(
      <LineChart label="Traffic" series={series} categories={categories} />,
    );
    const dashed = container.querySelectorAll('path[stroke-dasharray]');
    expect(dashed.length).toBe(series.length - 1);
  });

  /* The opposite of the bar chart's rule, for the opposite reason: a line's
     marks are positions, and forcing zero into the domain of a series that
     lives between 412 and 418 flattens it to nothing. */
  it('fits the domain to the data rather than forcing zero into it', () => {
    const { container } = renderWithCrystal(
      <LineChart label="Traffic" series={[series[0]!]} categories={categories} ticks={4} />,
    );
    const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(labels).not.toContain('0');
    expect(labels.some((label) => Number(label) > 400)).toBe(true);
  });

  it('reaches every point whether or not it draws one', () => {
    const { container } = renderWithCrystal(
      <LineChart label="Traffic" series={[series[0]!]} categories={categories} points={false} />,
    );
    expect(container.querySelectorAll('[role="graphics-symbol"]').length).toBe(3);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <LineChart label="Traffic by day" series={series} categories={categories} />,
    );
    await expectNoAxeViolations(container);
  });
});
