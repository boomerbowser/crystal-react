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
          '"Removal is announced and undoable; quantity changes announce the new '
          + 'subtotal." Both halves have the same cause: a basket line changes the price '
          + 'of the whole order, and the reader making the change is not looking at the '
          + 'total.\n\n'
          + 'A quantity change announces the subtotal, not the quantity. The stepper '
          + 'already says the quantity, because it is the value of the control being operated. '
          + 'What the reader does not have is what the change did to the money. It is the '
          + 'line\'s subtotal and not the order\'s, because this component knows one and not '
          + 'the other, and it would have to guess an order total it was never given.\n\n'
          + 'Removal takes a `returnFocusTo`, because the control the reader pressed has just '
          + 'been unmounted. Without it, focus falls to the document body and a keyboard reader '
          + 'starts again from the top of the page.',
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
 *  and a spinner over the top would hide the only numbers the reader has. */
export const Updating: Story = { args: { isUpdating: true } };
