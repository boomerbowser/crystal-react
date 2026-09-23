import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AreaChart } from './AreaChart.js';

const series = [
  { name: 'Direct', values: [12, 18, 15] },
  { name: 'Referral', values: [8, 9, 11] },
];
const categories = ['January', 'February', 'March'];

describe('AreaChart', () => {
  it('labels every point with its category, series and value', () => {
    renderWithCrystal(<AreaChart label="Sessions" series={series} categories={categories} />);
    expect(screen.getByLabelText('February, Direct, 18')).toBeInTheDocument();
  });

  /* Stacked changes what the picture asserts: the top edge is the total. The
     table says so, because a reader should not have to add the columns to check
     what the chart is claiming. */
  it('adds a total column when stacked, and not when it is not', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <AreaChart label="Sessions" series={series} categories={categories} stacked />,
    );
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '27' })).toBeInTheDocument();
    rerenderWithCrystal(<AreaChart label="Sessions" series={series} categories={categories} />);
    expect(screen.queryByRole('columnheader', { name: 'Total' })).toBeNull();
  });

  /* Stacked, a point's label is its running total rather than its own value:
     the edge a reader is looking at is at 27, not at 9. */
  it('labels a stacked point with where its edge is', () => {
    renderWithCrystal(<AreaChart label="Sessions" series={series} categories={categories} stacked />);
    expect(screen.getByLabelText('February, Referral, 27')).toBeInTheDocument();
  });

  /* The band is generated rather than assembled from a forward path and a
     reversed one: a reversed cubic is not the same cubic with its points
     swapped, so the second approach is correct for straight segments and quietly
     wrong for every curve. */
  it('draws a smooth stacked band without breaking its floor', () => {
    const { container } = renderWithCrystal(
      <AreaChart label="Sessions" series={series} categories={categories} stacked curve="smooth" />,
    );
    for (const path of Array.from(container.querySelectorAll('path[d]'))) {
      expect(path.getAttribute('d')).not.toMatch(/NaN|undefined/);
    }
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <AreaChart label="Sessions by month" series={series} categories={categories} />,
    );
    await expectNoAxeViolations(container);
  });
});
