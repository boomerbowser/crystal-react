import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { PaymentMethod } from './PaymentMethod.js';

const methods = [
  { value: 'visa', label: 'Visa ending 4242', detail: 'Expires 04/29' },
  { value: 'amex', label: 'Amex ending 1005', unavailable: 'Not accepted for this order' },
];

describe('PaymentMethod', () => {
  it('is a radio group of the methods on file', () => {
    renderWithCrystal(<PaymentMethod methods={methods} />);
    expect(screen.getByRole('radiogroup', { name: 'Payment method' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Visa ending 4242/ })).toBeInTheDocument();
  });

  /* "Card fields are never reimplemented." A card number typed into an input
     this library rendered would put every product using Crystal inside PCI
     scope, because the data touched their page in the clear. The failure does
     not look like one — it would work, and look right, and pass everything. */
  it('renders no card field of its own', () => {
    const { container } = renderWithCrystal(
      <PaymentMethod methods={methods} provider={<div data-testid="provider" />} value="new" />,
    );
    expect(container.querySelectorAll('input[autocomplete^="cc-"]')).toHaveLength(0);
    expect(container.querySelectorAll('input[name*="card" i]')).toHaveLength(0);
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);
    /* Every input in here is a radio. Anything else is a field somebody added. */
    const inputs = [...container.querySelectorAll('input')];
    expect(inputs.every((one) => one.type === 'radio')).toBe(true);
  });

  /* A provider's element is an iframe talking to a payment processor. Four of
     them behind unchosen options is four sessions opened for nothing, and one
     of them is focusable inside a card the reader did not pick. */
  it('mounts the provider element only while it is chosen', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <PaymentMethod methods={methods} provider={<div data-testid="provider" />} value="visa" />,
    );
    expect(screen.queryByTestId('provider')).toBeNull();

    rerenderWithCrystal(
      <PaymentMethod methods={methods} provider={<div data-testid="provider" />} value="new" />,
    );
    expect(screen.getByTestId('provider')).toBeInTheDocument();
  });

  it('says why a method cannot be used', () => {
    renderWithCrystal(<PaymentMethod methods={methods} />);
    expect(screen.getByRole('radio', { name: /Not accepted for this order/ })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <PaymentMethod methods={methods} provider={<div />} value="new" />,
    );
    await expectNoAxeViolations(container);
  });
});
