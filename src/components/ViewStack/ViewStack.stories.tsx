import type { Meta, StoryObj } from '@storybook/react-vite';
import { ViewStack } from './ViewStack.js';

const meta = {
  title: 'Screens/ViewStack',
  component: ViewStack,
  parameters: {
    docs: {
      description: {
        component:
          '"Focus moves to the new view and returns on pop; the back control is a real '
          + 'button."\n\n'
          + 'Focus is the contract and the half that is not decoration. What a stack can '
          + 'truthfully restore on a pop is the **view**, not the control: it shows one view '
          + 'at a time, so the control the reader left was unmounted with the view it '
          + 'belonged to, and a reference kept to it is a detached node that `focus()` '
          + 'accepts and silently ignores. An implementation that stored one would look '
          + 'right, pass a test that never unmounted anything, and put every reader at the '
          + 'top of the page in production.\n\n'
          + 'The movement is Crystal\'s `view-push-in` and `view-push-out`, authored in core '
          + '2.1.0 — a view arriving from the inline-end edge, and the view it covers '
          + 'travelling a fraction of that distance behind it. Two recipes rather than four, '
          + 'because a pop is a push mirrored and right-to-left is a push mirrored again. '
          + 'This library is pinned to core `^2.0.0` until that release is out, so the '
          + 'recipe is asked for rather than assumed and, until then, the stack behaves '
          + 'exactly as it does under reduced motion: the state change in full, the '
          + 'decoration absent.',
      },
    },
  },
  args: {
    views: [
      { id: 'inbox', label: 'Inbox', children: <p style={{ padding: 16 }}>Two messages.</p> },
    ],
  },
} satisfies Meta<typeof ViewStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtTheRoot: Story = { args: { onPop: () => {} } };

export const Pushed: Story = {
  args: {
    onPop: () => {},
    views: [
      { id: 'inbox', label: 'Inbox', children: <p style={{ padding: 16 }}>Two messages.</p> },
      {
        id: 'message',
        label: 'The quarterly figures',
        children: <p style={{ padding: 16 }}>They are attached.</p>,
      },
    ],
  },
};
