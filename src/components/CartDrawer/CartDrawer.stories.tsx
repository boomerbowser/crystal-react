import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CartDrawer, type CartDrawerLine } from './CartDrawer.js';
import { Button } from '../Button/Button.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const lines: CartDrawerLine[] = [
  { id: 'mug', name: 'Enamel mug', nameText: 'Enamel mug', detail: 'Slate', quantity: 2, unitPrice: gbp(12), subtotal: gbp(24) },
  { id: 'tea', name: 'Loose tea', nameText: 'Loose tea', detail: '250g', quantity: 1, unitPrice: gbp(8), subtotal: gbp(8) },
];

const meta = {
  title: 'Blocks/CartDrawer',
  component: CartDrawer,
  parameters: {
    docs: {
      description: {
        component:
          '"Opening moves focus in and returns it on close; total changes are announced."\n\n'
          + 'The drawer is `Drawer`, the lines are `CartItem`s and the figures are `CartSummary`. '
          + 'What this component adds is the announcement. `CartSummary` says that the basket is '
          + 'updating, and the drawer says what it came to once the total has settled, never on '
          + 'opening and never mid-recalculation. Checkout waits for the figures, and an empty '
          + 'basket says so instead of showing a blank panel.',
      },
    },
  },
  args: {
    isOpen: true,
    onOpenChange: fn(),
    lines,
    summary: [
      { id: 'subtotal', label: 'Subtotal', amount: gbp(32) },
      { id: 'delivery', label: 'Delivery', amount: gbp(3.5), note: 'Standard' },
    ],
    total: gbp(35.5),
    onQuantityChange: fn(),
    onRemove: fn(),
    onCheckout: fn(),
  },
} satisfies Meta<typeof CartDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const Updating: Story = { args: { isUpdating: true } };
export const Empty: Story = { args: { lines: [] } };

/** A working basket: step a quantity or remove a line, and the total settles and is said. */
export const AWorkingBasket: Story = {
  render: function WorkingBasket(args) {
    const [open, setOpen] = useState(true);
    const [held, setHeld] = useState(lines);
    const [updating, setUpdating] = useState(false);
    const settle = (next: CartDrawerLine[]) => {
      setUpdating(true);
      setHeld(next);
      window.setTimeout(() => { setUpdating(false); }, 400);
    };
    const subtotal = held.reduce((sum, line) => sum + line.subtotal.amount, 0);
    return (
      <>
        <Button onPress={() => { setOpen(true); }}>Basket</Button>
        <CartDrawer
          {...args}
          isOpen={open}
          onOpenChange={setOpen}
          lines={held}
          summary={[{ id: 'subtotal', label: 'Subtotal', amount: gbp(subtotal) }]}
          total={gbp(subtotal)}
          isUpdating={updating}
          onQuantityChange={(id, quantity) => {
            settle(held.map((line) => (line.id === id
              ? { ...line, quantity, subtotal: gbp(line.unitPrice.amount * quantity) } : line)));
          }}
          onRemove={(id) => { settle(held.filter((line) => line.id !== id)); }}
        />
      </>
    );
  },
};
