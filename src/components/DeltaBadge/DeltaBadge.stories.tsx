import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { DeltaBadge } from './DeltaBadge.js';

const meta = {
  title: 'Data display/Delta badge',
  component: DeltaBadge,
  parameters: {
    docs: {
      description: {
        component:
          '"The sign is a character, not a colour". A negative uses U+2212 MINUS SIGN, not the '
          + 'hyphen a keyboard produces. Some screen readers read a hyphen as a hyphen, and '
          + 'every font renders it at hyphen width, so a column of deltas signed with hyphens '
          + 'does not line up. The component formats the sign itself and does not take it in '
          + 'the string, because a caller passing "-2.4%" has already made both mistakes and '
          + 'this is the only place that can correct them.',
      },
    },
  },
  args: { value: 0.042, format: { style: 'percent', minimumFractionDigits: 1 }, locale: 'en-GB' },
} satisfies Meta<typeof DeltaBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Positive, negative and zero. Zero is neutral, because a change of nothing has
 *  no direction and signing it "+0.0%" would claim one. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-spacing-xs)', alignItems: 'center' }}>
      <DeltaBadge {...only(args)} value={0.042} description="revenue" />
      <DeltaBadge {...only(args)} value={-0.011} description="refunds" />
      <DeltaBadge {...only(args)} value={0} description="open tickets" />
    </div>
  ),
};

/** Whole numbers, for a count rather than a rate. */
export const Counts: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-spacing-xs)', alignItems: 'center' }}>
      <DeltaBadge {...only(args)} value={12} format={{}} description="subscribers" />
      <DeltaBadge {...only(args)} value={-3} format={{}} description="subscribers" />
    </div>
  ),
};
