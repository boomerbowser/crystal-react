import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { CartItem } from './CartItem.js';

const meta = {
  title: 'Commerce/Cart item',
  component: CartItem,
  parameters: {
    docs: {
      description: {
        component:
          '"**Removal is announced and undoable**; quantity changes announce the new '
          + 'subtotal." Both halves are about the same thing: a basket line changes the price '
          + 'of the whole order, and the reader making the change is not looking at the '
          + 'total.\n\n'
          + 'A quantity change announces the **subtotal**, not the quantity — the stepper '
          + 'already says the quantity, because it is the value of the control being operated. '
          + 'What the reader does not have is what it did to the money, which is the reason '
          + 'they touched it. And the line\'s subtotal rather than the order\'s, because this '
          + 'component knows one and not the other; announcing an order total it was never '
          + 'given would be guessing.\n\n'
          + 'Removal takes a `returnFocusTo`, because the control they pressed is the control '
          + 'that has just been unmounted — without it, focus falls to the document body and a '
          + 'keyboard reader starts again from the top of the page.',
      },
    },
  },
  args: {
    name: 'Harbour print, A2',
    nameText: 'Harbour print, A2',
    detail: 'Framed, oak',
    quantity: 1,
    onQuantityChange: () => {},
    unitPrice: { amount: 39.99, currency: 'GBP' },
    subtotal: { amount: 39.99, currency: 'GBP' },
    maxQuantity: 9,
  },
} satisfies Meta<typeof CartItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step the quantity and listen: the announcement is the new subtotal. */
export const Default: Story = {
  render: (args) => {
    function Live() {
      const [quantity, setQuantity] = useState(1);
      return (
        <CartItem
          {...only(args)}
          quantity={quantity}
          onQuantityChange={setQuantity}
          subtotal={{ amount: Math.round(39.99 * quantity * 100) / 100, currency: 'GBP' }}
        />
      );
    }
    return <Live />;
  },
};

/** With a remove control and somewhere for focus to land. Press Remove and tab:
 *  focus is on Checkout, not on the document body. */
export const Removable: Story = {
  render: (args) => {
    function Live() {
      const after = useRef<HTMLButtonElement>(null);
      const [gone, setGone] = useState(false);
      return (
        <div style={{ display: 'grid', gap: 16 }}>
          {gone ? <p>Removed.</p> : <CartItem {...only(args)} onRemove={() => setGone(true)} returnFocusTo={after} />}
          <button type="button" ref={after}>Checkout</button>
        </div>
      );
    }
    return <Live />;
  },
};

/** Being recalculated. The figures stay: a line being repriced is still a line,
 *  and a spinner over the top takes away the only numbers the reader had. */
export const Updating: Story = { args: { isUpdating: true } };
