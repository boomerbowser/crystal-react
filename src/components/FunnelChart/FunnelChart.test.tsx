import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { FunnelChart } from './FunnelChart.js';

const stages = [
  { name: 'Visited', value: 1200 },
  { name: 'Signed up', value: 600 },
  { name: 'Activated', value: 408 },
  { name: 'Paid', value: 102 },
];

describe('FunnelChart', () => {
  /* A stage can be relative to the first stage or to the one before. People
     mean different things by "conversion", so both are stated. */
  it('states both shares, of the first stage and of the one before', () => {
    renderWithCrystal(<FunnelChart label="Signup funnel" stages={stages} />);
    expect(screen.getByLabelText('Activated, 408, 34% of the first stage, 68% of the one before'))
      .toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Of the first' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Of the previous' })).toBeInTheDocument();
  });

  /* The first stage has nothing before it, so it has no previous share. */
  it('gives the first stage no previous share', () => {
    renderWithCrystal(<FunnelChart label="Signup funnel" stages={stages} />);
    expect(screen.getByLabelText('Visited, 1200, 100% of the first stage')).toBeInTheDocument();
  });

  /* A label that will not fit inside its band goes outside it, as the
     catalogue requires. */
  it('puts a label outside the band when the band is narrow', () => {
    const { container } = renderWithCrystal(<FunnelChart label="Signup funnel" stages={stages} />);
    const outside = container.querySelectorAll('text[data-outside]');
    expect(outside.length).toBe(1);
    expect(outside[0]?.textContent).toMatch(/^Paid/);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<FunnelChart label="Signup funnel" stages={stages} />);
    await expectNoAxeViolations(container);
  });
});
