import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShippingSelector } from './ShippingSelector.js';

const meta = {
  title: 'Commerce/Shipping selector',
  component: ShippingSelector,
  parameters: {
    docs: {
      description: {
        component:
          '"A radio group; each option states price and estimate together." A delivery '
          + 'option is a trade between two things, and a reader choosing one is comparing them '
          + 'against each other: two pounds and three days against eight pounds and one day. '
          + 'Split across a table\'s columns, or with the price in the option and the estimate '
          + 'in a footnote, the comparison needs four numbers held in the head. So each option '
          + 'carries both in its own name, which a screen reader reads on arriving at the '
          + 'option.\n\n'
          + 'The whole card is the target, and there is no radio dot. Selection here is label '
          + 'weight, which is what Crystal specifies for a choice among peers as distinct from '
          + 'an action in an on state.',
      },
    },
  },
  args: {
    options: [
      { value: 'standard', label: 'Standard', price: { amount: 3.99, currency: 'GBP' }, estimate: '3 to 5 working days' },
      { value: 'next', label: 'Next day', price: { amount: 8.99, currency: 'GBP' }, estimate: 'Tomorrow, if you order within 4 hours' },
      { value: 'pickup', label: 'Collect in store', price: { amount: 0, currency: 'GBP' }, estimate: 'From Thursday', unavailable: 'No stores near you' },
    ],
    defaultValue: 'standard',
  },
} satisfies Meta<typeof ShippingSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With the group in an invalid state. This is why it is built on `RadioGroup`
 *  and not on React Aria directly: the field shell carries the validity React
 *  Aria resolved, so a server saying "choose a delivery method" moves this group
 *  exactly as a local rule would. */
export const NotChosenYet: Story = {
  args: {
    options: [
      { value: 'standard', label: 'Standard', price: { amount: 3.99, currency: 'GBP' }, estimate: '3 to 5 working days' },
      { value: 'next', label: 'Next day', price: { amount: 8.99, currency: 'GBP' }, estimate: 'Tomorrow' },
    ],
    isInvalid: true,
    errorMessage: 'Choose how you would like this delivered',
  },
};
