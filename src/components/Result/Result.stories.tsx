import type { Meta, StoryObj } from '@storybook/react-vite';
import { Result } from './Result.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Result',
  component: Result,
  parameters: {
    docs: {
      description: {
        component:
          '"The outcome is stated in the heading; symbol and colour reinforce it." The title is '
          + 'a real heading at the level the page needs, and the symbol beside it is '
          + '`aria-hidden` — a reader told both would hear "exclamation mark, Payment '
          + 'declined".\n\n'
          + 'Six outcomes, four ink pairs. `not-found` and `unauthorised` are outcomes rather '
          + 'than statuses, and Crystal publishes no fifth and sixth semantic pair; inventing '
          + 'two here would be two more colours to hold at 4.5:1 across twelve palette and mode '
          + 'combinations. Each maps onto the pair that says the same thing.',
      },
    },
  },
  args: { title: 'Order placed', outcome: 'success' as const },
} satisfies Meta<typeof Result>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { children: 'We have emailed your receipt.', actions: <Button>View order</Button> },
};

export const Error: Story = {
  args: { outcome: 'error', title: 'Payment declined', children: 'No payment was taken.' },
};

export const Warning: Story = {
  args: { outcome: 'warning', title: 'Saved with warnings', children: 'Two rows were skipped.' },
};

export const NotFound: Story = {
  args: { outcome: 'not-found', title: 'Page not found', headingLevel: 1 },
};

export const Unauthorised: Story = {
  args: { outcome: 'unauthorised', title: 'You do not have access to this project' },
};
