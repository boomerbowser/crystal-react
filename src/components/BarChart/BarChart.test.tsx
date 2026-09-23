import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { BarChart } from './BarChart.js';

const series = [
  { name: 'Revenue', values: [12, 18, 15] },
  { name: 'Costs', values: [8, 9, null] },
];
const categories = ['January', 'February', 'March'];

describe('BarChart', () => {
  /* Every bar is a mark with its own label, so a reader who cannot see the
     height still gets the number rather than a position. */
  it('labels every bar with its category, series and value', () => {
    renderWithCrystal(<BarChart label="Revenue" series={series} categories={categories} />);
    expect(screen.getByLabelText('February, Revenue, 18')).toBeInTheDocument();
    expect(screen.getByLabelText('January, Costs, 8')).toBeInTheDocument();
  });

  /* A gap is not a zero, and a zero-height bar drawn for a month nobody measured
     is a chart asserting something nobody knows. */
  it('draws no bar where there is no value', () => {
    renderWithCrystal(<BarChart label="Revenue" series={series} categories={categories} />);
    expect(screen.queryByLabelText(/March, Costs/)).toBeNull();
  });

  it('builds the table from its own data', () => {
    renderWithCrystal(<BarChart label="Revenue" series={series} categories={categories} />);
    expect(screen.getByRole('columnheader', { name: 'Costs' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'March' })).toBeInTheDocument();
    /* The gap reaches the table as a gap too. */
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('puts one tab stop in the plot, not one per bar', () => {
    const { container } = renderWithCrystal(
      <BarChart label="Revenue" series={series} categories={categories} />,
    );
    const stops = container.querySelectorAll('[tabindex="0"]');
    expect(stops.length).toBe(1);
    expect(container.querySelectorAll('[tabindex="-1"]').length).toBe(4);
  });

  /* The format reaches the axis, the mark labels and the table — one function,
     so the three cannot disagree about what a number is. */
  it('formats every reading of a value through one function', () => {
    renderWithCrystal(
      <BarChart
        label="Revenue"
        series={[{ name: 'Revenue', values: [12] }]}
        categories={['January']}
        format={(value) => `£${value}k`}
      />,
    );
    expect(screen.getByLabelText('January, Revenue, £12k')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '£12k' })).toBeInTheDocument();
  });

  it('is empty when it has no categories', () => {
    renderWithCrystal(<BarChart label="Revenue" series={[]} categories={[]} />);
    expect(screen.getByText('No data to show')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <BarChart label="Revenue by month" series={series} categories={categories} />,
    );
    await expectNoAxeViolations(container);
  });
});
