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
          + 'The escalation has a trap in it. The obvious implementation swaps `role="status"` '
          + 'for `role="alert"` on the same element — and on several screen readers that does '
          + 'nothing, because a live region\'s politeness is taken when it is inserted, not '
          + 'when its role attribute changes. The text updates and the urgency does not, and '
          + 'the bug is invisible to everybody who can see the bar.\n\n'
          + 'So there are two regions and the message is in exactly one at a time. An '
          + 'escalated message arrives as new content in an assertive region, which every '
          + 'screen reader agrees to interrupt for.\n\n'
          + 'Stone comes from core\'s `.cr-stone`: the feather is on an isolated `::before` '
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
