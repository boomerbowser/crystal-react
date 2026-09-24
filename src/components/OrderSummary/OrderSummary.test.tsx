import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { OrderSummary } from './OrderSummary.js';

describe('OrderSummary', () => {
  /* "Status is a word; the status colour reinforces it." */
  it('says the state in words', () => {
    renderWithCrystal(<OrderSummary reference="Order 4821" referenceText="Order 4821" state="shipped" />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  /* Waiting is the ordinary outcome of placing an order, not a warning about
     it — so pending is information, not attention. */
  it('reports a pending order as information, not as a warning', () => {
    const { container } = renderWithCrystal(
      <OrderSummary reference="Order 4821" referenceText="Order 4821" state="pending" />,
    );
    expect(container.querySelector('[data-status]')).toHaveAttribute('data-status', 'info');
  });

  it('maps every state to a status', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(
      <OrderSummary reference="o" referenceText="o" state="delivered" />,
    );
    expect(container.querySelector('[data-status]')).toHaveAttribute('data-status', 'success');
    rerenderWithCrystal(<OrderSummary reference="o" referenceText="o" state="cancelled" />);
    expect(container.querySelector('[data-status]')).toHaveAttribute('data-status', 'danger');
  });

  /* An order model with six states, or another language, passes its own. */
  it('takes the product\'s wording over its own', () => {
    renderWithCrystal(
      <OrderSummary reference="o" referenceText="o" state="pending" stateLabel="Awaiting payment" />,
    );
    expect(screen.getByText('Awaiting payment')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <OrderSummary reference="Order 4821" referenceText="Order 4821" state="shipped" placed="2 October" />,
    );
    await expectNoAxeViolations(container);
  });
});
