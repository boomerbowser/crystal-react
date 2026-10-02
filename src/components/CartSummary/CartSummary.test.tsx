import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CartSummary } from './CartSummary.js';

const lines = [
  { id: 'subtotal', label: 'Subtotal', amount: { amount: 80, currency: 'GBP' } },
  { id: 'discount', label: 'Discount', amount: { amount: -8, currency: 'GBP' } },
  { id: 'shipping', label: 'Shipping', amount: { amount: 3.99, currency: 'GBP' }, note: 'Standard' },
];

describe('CartSummary', () => {
  /* "A description list, so each line is a labelled pair." To assistive
     technology, rows of two spans are a stream of words and numbers with
     nothing joining them. */
  it('pairs every label with its amount in a description list', () => {
    const { container } = renderWithCrystal(
      <CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} />,
    );
    expect(container.querySelector('dl')).not.toBeNull();
    /* Three lines and the total make four pairs, with exactly as many amounts
       as labels. A stray `dd` would be an amount with no label. */
    expect(container.querySelectorAll('dt')).toHaveLength(4);
    expect(container.querySelectorAll('dd')).toHaveLength(4);
  });

  /* "The total is marked as such" in the markup. Size and weight help a sighted
     reader find it; other readers need the markup. */
  it('marks the total as the total', () => {
    const { container } = renderWithCrystal(
      <CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} />,
    );
    const strong = container.querySelector('dt strong');
    expect(strong).toHaveTextContent('Total');
  });

  /* A discount is a negative amount. `Intl` formats the sign; this component
     does not prepend a minus sign itself. */
  it('reads a discount as a negative amount', () => {
    renderWithCrystal(<CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} />);
    expect(screen.getByText('-£8.00')).toBeInTheDocument();
  });

  /* A total being recalculated is still a number, so it stays on screen while
     the status region says it is updating. */
  it('keeps its figures while it updates, and says that it is', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} />,
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerenderWithCrystal(
      <CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} isUpdating />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Updating the total');
    expect(screen.getByText('£75.99')).toBeInTheDocument();
  });

  it('shows an empty basket as one', () => {
    renderWithCrystal(
      <CartSummary lines={[]} total={{ amount: 0, currency: 'GBP' }} empty="Your basket is empty" />,
    );
    expect(screen.getByText('Your basket is empty')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <CartSummary lines={lines} total={{ amount: 75.99, currency: 'GBP' }} />,
    );
    await expectNoAxeViolations(container);
  });
});
