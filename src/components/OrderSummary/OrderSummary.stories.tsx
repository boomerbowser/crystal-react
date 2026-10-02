import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { OrderSummary } from './OrderSummary.js';
import { CartSummary } from '../CartSummary/CartSummary.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Commerce/Order summary',
  component: OrderSummary,
  parameters: {
    docs: {
      description: {
        component:
          '"Status is a word; the status colour reinforces it." So the status is a '
          + '`StatusBadge`, the same badge every other part of this library uses, and no '
          + 'fifth drawing of a coloured well.\n\n'
          + 'The mapping is the one judgement here. `pending` is info, because waiting is '
          + 'the ordinary outcome of placing an order and not a warning about it. `shipped` '
          + 'and `delivered` are both success, because a fifth colour for "even better" '
          + 'would be a distinction with no meaning. `cancelled` is danger, which needs '
          + 'a second look, because an order the reader cancelled themselves is not a problem. '
          + 'The word is what is read, and a neutral cancelled order in a list of live ones '
          + 'would mislead more.',
      },
    },
  },
  args: {
    reference: 'Order 4821',
    referenceText: 'Order 4821',
    state: 'shipped',
    placed: 'Placed 28 September 2026',
  },
} satisfies Meta<typeof OrderSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All four, so the mapping can be checked by eye. */
export const EveryState: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['pending', 'shipped', 'delivered', 'cancelled'] as const).map((state) => (
        <OrderSummary
          {...only(args)}
          key={state}
          state={state}
          reference={`Order 48${state.length}1`}
          referenceText={`Order 48${state.length}1`}
        />
      ))}
    </div>
  ),
};

/** "With items and totals" is `CartSummary` under a different heading. A second
 *  description list would be a second copy of the total's markup to keep
 *  correct. */
export const WithItsTotals: Story = {
  render: (args) => (
    <OrderSummary
      {...only(args)}
      actions={<><Button>Track this order</Button><Button variant="quiet">Buy again</Button></>}
    >
      <CartSummary
        label="Order 4821 totals"
        lines={[
          { id: 'subtotal', label: 'Subtotal', amount: { amount: 119.97, currency: 'GBP' } },
          { id: 'shipping', label: 'Shipping', amount: { amount: 3.99, currency: 'GBP' } },
        ]}
        total={{ amount: 123.96, currency: 'GBP' }}
      />
    </OrderSummary>
  ),
};
