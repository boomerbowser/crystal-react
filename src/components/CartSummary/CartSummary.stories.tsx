import type { Meta, StoryObj } from '@storybook/react-vite';
import { CartSummary } from './CartSummary.js';

const lines = [
  { id: 'subtotal', label: 'Subtotal', amount: { amount: 119.97, currency: 'GBP' } },
  { id: 'discount', label: 'Discount', amount: { amount: -12, currency: 'GBP' }, note: 'HARBOUR10' },
  { id: 'shipping', label: 'Shipping', amount: { amount: 3.99, currency: 'GBP' }, note: 'Standard, 3 to 5 days' },
  { id: 'tax', label: 'VAT', amount: { amount: 22.39, currency: 'GBP' }, note: 'Included' },
];

const meta = {
  title: 'Commerce/Cart summary',
  component: CartSummary,
  parameters: {
    docs: {
      description: {
        component:
          '"**A description list**, so each line is a labelled pair; the total is marked as '
          + 'such." The markup is the requirement. To assistive technology, a summary built '
          + 'from rows of two spans is a stream of words and numbers in which "Shipping" and '
          + '"£3.99" are unrelated pieces of text. A `<dl>` says which amount belongs to which '
          + 'line, and it is the HTML structure with exactly that meaning.\n\n'
          + 'Updating is a state, shown without a spinner. A total being recalculated is still '
          + 'a number, so it stays on screen.',
      },
    },
  },
  args: { lines, total: { amount: 111.96, currency: 'GBP' } },
} satisfies Meta<typeof CartSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Being recalculated. The figures stay and fade, and the state is announced
 *  politely, because a total settling does not need to interrupt the reader. */
export const Updating: Story = {
  args: { lines, total: { amount: 111.96, currency: 'GBP' }, isUpdating: true },
};

/** Nothing in it. */
export const Empty: Story = {
  args: { lines: [], total: { amount: 0, currency: 'GBP' }, empty: 'Your basket is empty' },
};
