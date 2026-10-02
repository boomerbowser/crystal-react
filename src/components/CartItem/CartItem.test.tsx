import { describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CartItem } from './CartItem.js';

function Harness({ onRemove }: { onRemove?: () => void } = {}) {
  const [quantity, setQuantity] = useState(1);
  return (
    <CartItem
      name="Harbour print"
      nameText="Harbour print"
      quantity={quantity}
      onQuantityChange={setQuantity}
      unitPrice={{ amount: 40, currency: 'GBP' }}
      subtotal={{ amount: 40 * quantity, currency: 'GBP' }}
      maxQuantity={5}
      {...(onRemove === undefined ? {} : { onRemove })}
    />
  );
}

describe('CartItem', () => {
  /* "Quantity changes announce the new subtotal." The stepper already says the
     quantity, because it is the value of the control being operated. What the
     reader does not have is what the change did to the money. */
  it('announces the new subtotal when the quantity changes', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    await user.click(screen.getByRole('button', { name: /One more/ }));
    expect(screen.getByText('2 × Harbour print, £80.00')).toBeInTheDocument();
  });

  /* A line that renders showing two of something has not just been changed to
     two. Nothing speaks at rest. */
  it('says nothing about a quantity it started at', () => {
    renderWithCrystal(<Harness />);
    expect(screen.queryByText(/× Harbour print/)).toBeNull();
  });

  /* The control they pressed is the control that has just been unmounted.
     Without somewhere to send them, focus falls to the body and a keyboard
     reader starts again from the top of the page. */
  it('sends focus somewhere that still exists after removal', async () => {
    const user = userEvent.setup();
    function WithReturn() {
      const after = useRef<HTMLButtonElement>(null);
      const [gone, setGone] = useState(false);
      return (
        <>
          {gone ? null : (
            <CartItem
              name="Harbour print"
              nameText="Harbour print"
              quantity={1}
              onQuantityChange={() => {}}
              unitPrice={{ amount: 40, currency: 'GBP' }}
              subtotal={{ amount: 40, currency: 'GBP' }}
              onRemove={() => setGone(true)}
              returnFocusTo={after}
            />
          )}
          <button type="button" ref={after}>Checkout</button>
        </>
      );
    }
    renderWithCrystal(<WithReturn />);
    await user.click(screen.getByRole('button', { name: 'Remove Harbour print' }));
    expect(screen.getByRole('button', { name: 'Checkout' })).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  /* Without the name, a basket of thirty lines has thirty controls called
     "Remove". */
  it('names its remove control after what it removes', () => {
    renderWithCrystal(<Harness onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove Harbour print' })).toBeInTheDocument();
  });

  /* The subtotal is given, never multiplied here: rounding, bundling and
     per-line discounts are the product's arithmetic. */
  it('shows the subtotal it was given', () => {
    renderWithCrystal(
      <CartItem
        name="Harbour print"
        nameText="Harbour print"
        quantity={3}
        onQuantityChange={() => {}}
        unitPrice={{ amount: 40, currency: 'GBP' }}
        subtotal={{ amount: 108, currency: 'GBP' }}
      />,
    );
    expect(screen.getByText('£108.00')).toBeInTheDocument();
  });

  /* Two live regions updating in one tick. Both are required: the stepper's
     catalogue line asks for the bound, and this one's asks for the subtotal.
     The test asserts that neither replaced the other and that the constraint
     is ahead of its consequence in the DOM, which decides the order a screen
     reader reads them in. */
  it('announces the bound and the subtotal, constraint first', async () => {
    function AtTheBound(): React.JSX.Element {
      const [quantity, setQuantity] = useState(2);
      return (
        <CartItem
          name="Harbour print"
          nameText="Harbour print"
          quantity={quantity}
          onQuantityChange={setQuantity}
          unitPrice={{ amount: 40, currency: 'GBP' }}
          subtotal={{ amount: 40 * quantity, currency: 'GBP' }}
          maxQuantity={3}
        />
      );
    }

    const user = userEvent.setup();
    renderWithCrystal(<AtTheBound />);
    await user.click(screen.getByRole('button', { name: /One more/ }));

    const spoken = screen.getAllByRole('status').map((one) => one.textContent ?? '');
    const bound = spoken.findIndex((one) => /largest/i.test(one));
    const money = spoken.findIndex((one) => /120\.00/.test(one));
    expect(bound).toBeGreaterThanOrEqual(0);
    expect(money).toBeGreaterThanOrEqual(0);
    expect(bound).toBeLessThan(money);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Harness onRemove={vi.fn()} />);
    await expectNoAxeViolations(container);
  });
});
