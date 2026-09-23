import type { Meta, StoryObj } from '@storybook/react-vite';
import { WaterfallChart } from './WaterfallChart.js';

const meta = {
  title: 'Charts/Waterfall chart',
  component: WaterfallChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Each step states its delta and the running total." Two different facts, and this is '
          + 'the chart where people read one and mean the other: a bar drawn from 82 to 71 is a '
          + 'step of −11 and a position of 71, and the picture shows the step while the question '
          + 'is usually the total.\n\n'
          + '"Increase, decrease and total colour from the status tokens" — and never colour '
          + 'alone. The sign is written into every label and into the table\'s change column, '
          + 'and a total is a different *shape* as well as a different colour: it runs from the '
          + 'axis where the others float, because a total is where the running total has got to '
          + 'rather than a change of its own size.\n\n'
          + '"Connectors align with bar edges", so the eye follows the running total across the '
          + 'gap rather than guessing where the next bar starts.',
      },
    },
  },
  args: {
    label: 'Accounts this quarter',
    steps: [
      { name: 'Opening', value: 820, total: false },
      { name: 'New', value: 164 },
      { name: 'Expansion', value: 52 },
      { name: 'Churn', value: -98 },
      { name: 'Downgrades', value: -41 },
      { name: 'Closing', value: 0, total: true },
    ],
  },
} satisfies Meta<typeof WaterfallChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a subtotal partway through, which is the same mark as a final total. */
export const WithASubtotal: Story = {
  args: {
    steps: [
      { name: 'Revenue', value: 480 },
      { name: 'Cost of sales', value: -190 },
      { name: 'Gross', value: 0, total: true },
      { name: 'Salaries', value: -160 },
      { name: 'Hosting', value: -35 },
      { name: 'Operating', value: 0, total: true },
    ],
    format: (value: number) => `£${value}k`,
    formatDelta: (value: number) => (value > 0 ? `+£${value}k` : `−£${Math.abs(value)}k`),
  },
};
