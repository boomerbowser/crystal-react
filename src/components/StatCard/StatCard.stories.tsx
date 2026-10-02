import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { StatCard } from './StatCard.js';

const meta = {
  title: 'Data display/Stat card',
  component: StatCard,
  parameters: {
    docs: {
      description: {
        component:
          '"The figure and its trend are one readable sentence, not a number beside an arrow." '
          + 'That is a rule about order, which a card can enforce: label, '
          + 'figure, the period it covers, then what it did. Read straight down, that is a '
          + 'sentence. Any other arrangement is a number with decoration around it, and a reader '
          + 'moving linearly gets the decoration first. It is `Card` and `Statistic` rather than '
          + 'a third implementation of either.',
      },
    },
  },
  args: {
    label: 'Revenue',
    value: '£48,210',
    period: 'this month',
    trend: { direction: 'up', label: '4.2% up on last month' },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A row, which is what these are for. The loading state keeps the box rather
 *  than emptying it so the row does not reflow. */
export const ARow: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--cr-space)' }}>
      <StatCard {...only(args)} label="Revenue" value="£48,210" period="this month"
        trend={{ direction: 'up', label: '4.2% up on last month' }} />
      <StatCard {...only(args)} label="Refunds" value="£1,180" period="this month"
        trend={{ direction: 'down', label: '1.1% down on last month' }} />
      <StatCard {...only(args)} label="Open tickets" value="34" period="right now"
        trend={{ direction: 'flat', label: 'No change on last week' }} />
    </div>
  ),
};

export const Loading: Story = { args: { loading: true } };

/** A zero in place of "no data yet" is a measurement the product did not make. */
export const Empty: Story = {
  args: { value: '£0', empty: 'No sales yet this month.' },
};
