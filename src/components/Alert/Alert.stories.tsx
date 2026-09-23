import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          '"`role=alert` **only** for genuinely urgent, interrupting content; otherwise a plain '
          + 'region." An assertive live region interrupts a screen reader mid-word, so a page '
          + 'that renders four alerts on load has interrupted the reader four times about things '
          + 'already on the screen. `urgent` is therefore an explicit opt-in and is **not** '
          + 'implied by `danger`.\n\n'
          + 'The semantic pair goes on the symbol well and nowhere else: the panel stays Haze '
          + 'and the message stays ordinary text. A danger-coloured panel makes the message '
          + 'decoration on a coloured ground, and a danger-coloured perimeter is the shape '
          + 'Crystal uses for focus.\n\n'
          + 'The dismiss control is named for what it dismisses — three alerts otherwise give a '
          + 'reader three identical buttons called "Close".',
      },
    },
  },
  args: { title: 'Card declined', status: 'danger' as const },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Danger: Story = {
  args: { children: 'Your card was declined. No payment was taken.' },
};

export const Success: Story = {
  args: { status: 'success', title: 'Saved', children: 'Your changes are live.' },
};

export const Attention: Story = {
  args: { status: 'attention', title: 'Two seats left', children: 'Book soon to keep this price.' },
};

export const Info: Story = {
  args: { status: 'info', title: 'New in this release', children: 'Charts now have tooltips.' },
};

/* The one case the assertive role exists for: something that has just happened
   and cannot wait for the reader to arrive at it. */
export const Urgent: Story = {
  args: { urgent: true, status: 'attention', title: 'Session ends in one minute' },
};

export const WithActions: Story = {
  args: {
    children: 'Your card was declined. No payment was taken.',
    actions: <Button>Try another card</Button>,
  },
};

export const Dismissible: Story = {
  args: { children: 'Your card was declined.', onDismiss: () => {} },
};
