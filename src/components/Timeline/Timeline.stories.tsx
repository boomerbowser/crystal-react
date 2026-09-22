import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './Timeline.js';

const items = [
  { id: 'a', marker: '1', title: 'Application submitted', meta: '2 March', status: 'complete' as const, statusLabel: 'Complete' },
  { id: 'b', marker: '2', title: 'Documents verified', meta: '4 March', status: 'complete' as const, statusLabel: 'Complete' },
  { id: 'c', marker: '3', title: 'Under review', meta: 'Since 5 March', status: 'current' as const, statusLabel: 'In progress' },
  { id: 'd', marker: '4', title: 'Decision', status: 'upcoming' as const, statusLabel: 'Not started' },
];

const meta = {
  title: 'Data display/Timeline',
  component: Timeline,
  parameters: {
    docs: {
      description: {
        component:
          'Ordered events on a Haze connector with Resin markers. An ordered list, because the '
          + 'order is the meaning — a reader told "list, 4 items" without the numbers has lost the '
          + 'only thing a timeline adds to a list. The current event carries `aria-current="step"` '
          + 'and is heavier; the rest say their status in words, because three of the four states '
          + 'are otherwise indistinguishable to anyone who cannot compare two small circles by '
          + 'colour. The connector is drawn per event, so it ends exactly where the events do.',
      },
    },
  },
  args: { items, label: 'Application progress' },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** An error is a fourth state, not a failure of the list. */
export const WithAnError: Story = {
  args: {
    items: [
      ...items.slice(0, 2),
      { id: 'e', marker: '!', title: 'Payment declined', meta: '5 March', status: 'error' as const, statusLabel: 'Action needed' },
      items[3]!,
    ],
  },
};
