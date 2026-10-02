import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { PieChart } from './PieChart.js';

const slices = [
  { name: 'Direct', value: 50 },
  { name: 'Referral', value: 30 },
  { name: 'Search', value: 20 },
];

describe('PieChart', () => {
  /* "Each segment is labelled with its value; the total is stated." */
  it('labels each segment with its value, its share and the total', () => {
    renderWithCrystal(<PieChart label="Sessions" slices={slices} />);
    expect(screen.getByLabelText('Referral, 30, 30% of 100')).toBeInTheDocument();
  });

  /* The total is the assertion a pie makes, and a reader cannot check it, or
     notice that 4% is missing, unless it is written down. */
  it('writes the total into the table', () => {
    renderWithCrystal(<PieChart label="Sessions" slices={slices} />);
    expect(screen.getByRole('rowheader', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '100' })).toBeInTheDocument();
  });

  /* The order is the caller's. Sorting would make "the third segment" mean two
     different things in the picture and in the table beside it. */
  it('keeps the order it was given', () => {
    const { container } = renderWithCrystal(
      <PieChart label="Sessions" slices={[{ name: 'Small', value: 5 }, { name: 'Large', value: 95 }]} />,
    );
    const names = Array.from(container.querySelectorAll('[role="graphics-symbol"]'))
      .map((mark) => mark.getAttribute('aria-label')?.split(',')[0]);
    expect(names).toEqual(['Small', 'Large']);
  });

  /* A sliver of 2% gets no label rather than one that spills out of it. The
     same words are on the mark and in the table either way. */
  it('draws a label only where the wedge can hold one', () => {
    const { container } = renderWithCrystal(
      <PieChart label="Sessions" slices={[{ name: 'Sliver', value: 2 }, { name: 'Rest', value: 98 }]} />,
    );
    expect(container.querySelectorAll('text').length).toBe(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<PieChart label="Sessions by source" slices={slices} />);
    await expectNoAxeViolations(container);
  });
});
