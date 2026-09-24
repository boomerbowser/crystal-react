import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { DiscountBadge } from './DiscountBadge.js';
import { Price } from '../Price/Price.js';

const meta = {
  title: 'Commerce/Discount badge',
  component: DiscountBadge,
  parameters: {
    docs: {
      description: {
        component:
          '"States what is reduced from what; **a percentage alone is not a claim**." That '
          + 'sentence is the whole API. This will not take `percent={20}`, because a percentage '
          + 'handed in from outside is a number nobody can check — it says twenty per cent off '
          + '*something*, and the something is what makes it a saving rather than marketing '
          + 'noise. It takes the two amounts and computes the reduction, so the badge cannot '
          + 'disagree with the price beside it. The pill is a few characters wide, so the whole '
          + 'statement goes in the accessible name: the same fact stated more completely, not a '
          + 'different one.',
      },
    },
  },
  args: {
    from: { amount: 50, currency: 'GBP' },
    to: { amount: 40, currency: 'GBP' },
  },
} satisfies Meta<typeof DiscountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Which figure the pill shows is a question of what a shopper scans for. Both
 *  state the whole reduction to a screen reader either way. */
export const PercentageOrAmount: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <DiscountBadge from={{ amount: 50, currency: 'GBP' }} to={{ amount: 40, currency: 'GBP' }} />
      <DiscountBadge
        from={{ amount: 50, currency: 'GBP' }}
        to={{ amount: 40, currency: 'GBP' }}
        show="amount"
      />
    </div>
  ),
};

/** Where it actually sits: beside the price it is a reduction of. */
export const BesideAPrice: Story = {
  render: (args) => (
    <p style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: 0 }}>
      <Price value={args.to} />
      <DiscountBadge {...only(args)} />
    </p>
  ),
};

/** An increase is not a discount, and neither is a ratio across two currencies.
 *  Both render nothing rather than asserting something the component has just
 *  worked out is false — so this story is deliberately empty. */
export const WhatIsNotADiscount: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, minHeight: 24 }}>
      <DiscountBadge from={{ amount: 40, currency: 'GBP' }} to={{ amount: 50, currency: 'GBP' }} />
      <DiscountBadge from={{ amount: 50, currency: 'GBP' }} to={{ amount: 40, currency: 'JPY' }} />
    </div>
  ),
};
