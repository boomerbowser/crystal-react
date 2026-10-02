import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar } from './StatusBar.js';

const meta = {
  title: 'Screens/StatusBar',
  component: StatusBar,
  parameters: {
    docs: {
      description: {
        component:
          '"`role="status"`; errors escalate to assertive."\n\n'
          + 'Swapping `role="status"` for `role="alert"` on the same element does nothing on '
          + 'several screen readers, because a live region\'s politeness is taken when it is '
          + 'inserted, not when its role attribute changes. The text would update without the '
          + 'urgency, and nobody who can see the bar would notice.\n\n'
          + 'So there are two regions and the message is in exactly one at a time. An '
          + 'escalated message arrives as new content in an assertive region, which every '
          + 'screen reader agrees to interrupt for.\n\n'
          + 'Stone comes from core\'s `.cr-stone`. The feather is on an isolated `::before` '
          + 'beneath the content rather than on the element, which is what "text stays crisp" '
          + 'means.',
      },
    },
  },
  args: { status: 'All changes saved' },
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};

export const Busy: Story = { args: { status: 'Saving…', state: 'busy' } };

export const Error: Story = { args: { status: 'Could not save — you are offline', state: 'error' } };
