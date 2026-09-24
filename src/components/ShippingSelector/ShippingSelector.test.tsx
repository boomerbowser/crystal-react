import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ShippingSelector } from './ShippingSelector.js';

const options = [
  { value: 'standard', label: 'Standard', price: { amount: 3.99, currency: 'GBP' }, estimate: '3 to 5 working days' },
  { value: 'next', label: 'Next day', price: { amount: 8.99, currency: 'GBP' }, estimate: 'Tomorrow' },
  { value: 'pickup', label: 'Collect in store', price: { amount: 0, currency: 'GBP' }, estimate: 'From Thursday', unavailable: 'No stores near you' },
];

describe('ShippingSelector', () => {
  it('is a radio group', () => {
    renderWithCrystal(<ShippingSelector options={options} />);
    expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  /* "Each option states price and estimate together." A reader choosing a
     delivery is comparing two numbers against two others; split across a table's
     columns, the comparison needs four numbers held in the head. */
  it('puts the price and the estimate in the same name', () => {
    renderWithCrystal(<ShippingSelector options={options} />);
    const next = screen.getByRole('radio', { name: /Next day/ });
    expect(next).toHaveAccessibleName(/Tomorrow/);
    expect(next).toHaveAccessibleName(/£8\.99/);
  });

  /* An unavailable option says why, in its own text. */
  it('says why an option cannot be chosen', () => {
    renderWithCrystal(<ShippingSelector options={options} />);
    const pickup = screen.getByRole('radio', { name: /Collect in store/ });
    expect(pickup).toHaveAccessibleName(/No stores near you/);
    expect(pickup).toBeDisabled();
  });

  it('chooses from the keyboard', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<ShippingSelector options={options} defaultValue="standard" />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Next day/ })).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<ShippingSelector options={options} />);
    await expectNoAxeViolations(container);
  });
});
