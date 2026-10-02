import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DonutChart } from './DonutChart.js';

const slices = [
  { name: 'Direct', value: 50 },
  { name: 'Referral', value: 30 },
  { name: 'Search', value: 20 },
];

describe('DonutChart', () => {
  /* "The centre value is text, not an image": real text in the document, so it
     is selectable, translatable and read out. */
  it('puts real text in the centre', () => {
    renderWithCrystal(<DonutChart label="Sessions" slices={slices} centre={<strong>100 total</strong>} />);
    expect(screen.getByText('100 total')).toBeInTheDocument();
  });

  /* "Ring thickness is a declared proportion of the radius". The proportion is
     Crystal's, so a donut is the same object at every size. */
  it('takes its ring thickness from Crystal rather than from the caller', () => {
    const { container } = renderWithCrystal(<DonutChart label="Sessions" slices={slices} />);
    /* An arc with a hole draws two curves and closes. A wedge from the centre
       draws one curve and returns to the centre. */
    const path = container.querySelector('[role="graphics-symbol"] path')?.getAttribute('d') ?? '';
    expect((path.match(/A/g) ?? []).length).toBeGreaterThan(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <DonutChart label="Sessions by source" slices={slices} centre="100" />,
    );
    await expectNoAxeViolations(container);
  });
});
