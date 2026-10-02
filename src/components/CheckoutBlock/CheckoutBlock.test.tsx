import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { CheckoutBlock, type CheckoutBlockProps } from './CheckoutBlock.js';
import type { AddressDescriptor } from '../../commerce/address.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const countries: AddressDescriptor[] = [{
  country: 'GB',
  countryLabel: 'United Kingdom',
  fields: [
    { name: 'line1', label: 'Address', autoComplete: 'address-line1', required: true },
    { name: 'postcode', label: 'Postcode', autoComplete: 'postal-code', required: true },
  ],
}];

const props: CheckoutBlockProps = {
  step: 'address',
  onStepChange: () => {},
  onContinue: () => {},
  onPlaceOrder: () => {},
  address: { countries, country: 'GB', onCountryChange: () => {}, value: {}, onChange: () => {} },
  shipping: {
    options: [
      { value: 'standard', label: 'Standard', price: gbp(3.5), estimate: '3 to 5 working days' },
      { value: 'next', label: 'Next day', price: gbp(7), estimate: 'Tomorrow' },
    ],
  },
  payment: {
    methods: [{ value: 'visa', label: 'Visa ending 4242' }],
    provider: <div data-testid="provider">The payment provider's own element</div>,
  },
  summary: { lines: [{ id: 'subtotal', label: 'Subtotal', amount: gbp(32) }], total: gbp(35.5) },
};

describe('CheckoutBlock', () => {
  it('renders the current step alone, as a region named for itself', () => {
    renderWithCrystal(<CheckoutBlock {...props} />);
    expect(screen.getByRole('region', { name: 'Delivery address' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Payment' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Order summary' })).toBeInTheDocument();
  });

  /* Errors are summarised at the top of the step, take focus, and link to their
     fields. Each link moves focus into the field it names. */
  it('summarises errors, moves focus to the summary, and links each to its field', async () => {
    renderWithCrystal(<CheckoutBlock {...props} errors={{ line1: 'Enter the first line of the address', postcode: 'Enter a postcode' }} />);
    const summary = screen.getByRole('region', { name: 'There are 2 problems' });
    await waitFor(() => { expect(summary).toHaveFocus(); });
    await userEvent.click(screen.getByRole('link', { name: 'Enter a postcode' }));
    expect(screen.getByRole('textbox', { name: /Postcode/ })).toHaveFocus();
  });

  /* The payment step has no field for card data anywhere, only the stored
     methods and the provider's own element. */
  it('never renders a field for card data', () => {
    const { container } = renderWithCrystal(<CheckoutBlock {...props} step="payment" />);
    expect(screen.getByRole('region', { name: 'Payment' })).toBeInTheDocument();
    expect(container.querySelector('input[autocomplete^="cc-"], input[name*="card" i], input[inputmode="numeric"]')).toBeNull();
  });

  it('asks the product to continue, and goes back itself', async () => {
    const onContinue = vi.fn();
    const onStepChange = vi.fn();
    renderWithCrystal(<CheckoutBlock {...props} step="shipping" onContinue={onContinue} onStepChange={onStepChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledWith('shipping');
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onStepChange).toHaveBeenCalledWith('address');
  });

  it('announces the order being placed and holds its controls', () => {
    renderWithCrystal(<CheckoutBlock {...props} step="payment" state="submitting" />);
    expect(screen.getByText('Placing your order')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled();
  });

  it('says a failure that belongs to no field once, as an alert', () => {
    renderWithCrystal(<CheckoutBlock {...props} step="payment" state="error" errorMessage="Your bank declined the payment." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your bank declined the payment.');
  });

  it.each([
    ['at rest, address', {}],
    ['at rest, delivery', { step: 'shipping' as const }],
    ['at rest, payment', { step: 'payment' as const }],
    ['with errors', { errors: { postcode: 'Enter a postcode' } }],
    ['validating', { state: 'validating' as const }],
    ['submitting', { step: 'payment' as const, state: 'submitting' as const }],
    ['failed', { step: 'payment' as const, state: 'error' as const, errorMessage: 'Declined.' }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<CheckoutBlock {...props} {...extra} />);
    await expectNoAxeViolations(container);
  });
});
