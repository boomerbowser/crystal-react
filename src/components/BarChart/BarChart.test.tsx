import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
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

  /* The format reaches the axis, the mark labels and the table. It is one
     function, so the three cannot disagree about what a number is. */
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

  /* Hiding is a view state, said on the series rather than by dropping it from
     the array. The defect this guards: filtering the array repaints every
     series after the hidden one, so the legend the reader is matching against
     stops describing the picture. */
  describe('a hidden series', () => {
    const half = [series[0]!, { ...series[1]!, hidden: true }];

    it('is not drawn', () => {
      renderWithCrystal(<BarChart label="Revenue" series={half} categories={categories} />);
      expect(screen.queryByLabelText('January, Costs, 8')).toBeNull();
      expect(screen.getByLabelText('January, Revenue, 12')).toBeInTheDocument();
    });

    it('leaves the series before it on its own colour', () => {
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={[{ ...series[0]!, hidden: true }, series[1]!]} categories={categories} />,
      );
      const drawn = container.querySelector('[aria-label="January, Costs, 8"]');
      expect(drawn).toHaveStyle({ '--series-colour': 'var(--cr-chart-series-2)' });
    });

    it('stays in the legend, so it can be turned back on', () => {
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={half} categories={categories} />,
      );
      expect(legendNames(container)).toEqual(['Revenue', 'Costs']);
    });
  });

  /* A three-series chart whose series are named only in aria-labels and a
     folded-away table is a chart a sighted reader cannot read. */
  describe('the legend', () => {
    it('names every series without being asked', () => {
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={series} categories={categories} />,
      );
      expect(legendNames(container)).toEqual(['Revenue', 'Costs']);
    });

    it('is absent for one series, which needs no key', () => {
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={[series[0]!]} categories={categories} />,
      );
      expect(legendNames(container)).toEqual([]);
    });

    it('can be declined', () => {
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={series} categories={categories} legend={null} />,
      );
      expect(legendNames(container)).toEqual([]);
    });
  });

  /* The tooltip is the sighted reader's version of what the mark already says
     to everyone else, so it is `aria-hidden` and is found by its text, not by a
     role. */
  describe('the tooltip', () => {
    it('follows the pointer onto a bar and says its value', async () => {
      const user = userEvent.setup();
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={series} categories={categories} />,
      );
      const bar = container.querySelector('[aria-label="February, Revenue, 18"]')!;
      await user.hover(bar);
      const panel = container.querySelector('[data-shown]');
      expect(panel).not.toBeNull();
      expect(panel!.textContent).toContain('February');
      expect(panel!.textContent).toContain('18');
    });

    it('is dismissed by Escape and comes back on the next move', async () => {
      const user = userEvent.setup();
      const { container } = renderWithCrystal(
        <BarChart label="Revenue" series={series} categories={categories} />,
      );
      const bar = container.querySelector('[aria-label="February, Revenue, 18"]')!;
      await user.hover(bar);
      expect(container.querySelector('[data-shown]')).not.toBeNull();
      /* Fired at the mark rather than typed at the document: hover does not
         move focus, and the handler that dismisses is on the plot. */
      fireEvent.keyDown(bar, { key: 'Escape' });
      /* After its exit: the tooltip stays shown while `tooltip-out` plays. */
      await waitFor(() => { expect(container.querySelector('[data-shown]')).toBeNull(); });
      await user.hover(container.querySelector('[aria-label="January, Revenue, 12"]')!);
      expect(container.querySelector('[data-shown]')).not.toBeNull();
    });
  });
});

/* The series names the legend shows, as distinct from the ones the table shows.
   A chart says every name twice, and a query that cannot tell them apart would
   pass with no legend at all. */
function legendNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('ul li')].map((item) => item.textContent ?? '');
}
