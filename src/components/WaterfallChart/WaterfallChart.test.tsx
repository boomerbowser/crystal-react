import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { WaterfallChart, layout } from './WaterfallChart.js';

const steps = [
  { name: 'Opening', value: 82 },
  { name: 'New', value: 14 },
  { name: 'Refunds', value: -11 },
  { name: 'Closing', value: 0, total: true },
];

describe('WaterfallChart', () => {
  /* "Each step states its delta and the running total." Two different facts, and
     this is the chart where people read one and mean the other. */
  it('states both the change and the running total', () => {
    renderWithCrystal(<WaterfallChart label="Accounts" steps={steps} />);
    expect(screen.getByLabelText('Refunds, -11, running total 85')).toBeInTheDocument();
  });

  /* A total is where the running total got to, not a change of its own size, so
     it is drawn from the axis. */
  it('draws a total from the axis rather than floating it', () => {
    const laid = layout(steps);
    expect(laid[3]).toMatchObject({ from: 0, to: 85 });
    expect(laid[2]).toMatchObject({ from: 96, to: 85 });
  });

  /* Never colour alone: the sign is in the label and in the table's own column,
     and a total is a different shape as well as a different colour. */
  it('carries the direction in words as well as in colour', () => {
    renderWithCrystal(<WaterfallChart label="Accounts" steps={steps} />);
    expect(screen.getByRole('cell', { name: '+14' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '-11' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<WaterfallChart label="Accounts" steps={steps} />);
    await expectNoAxeViolations(container);
  });
});
