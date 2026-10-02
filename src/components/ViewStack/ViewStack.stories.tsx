import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ViewStack, type StackedView } from './ViewStack.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/ViewStack',
  component: ViewStack,
  parameters: {
    docs: {
      description: {
        component:
          '"Focus moves to the new view and returns on pop; the back control is a real '
          + 'button."\n\n'
          + 'Focus is the contract. The movement is decoration. On a pop the stack restores '
          + 'focus to the view, not to the control. It shows one view at a time, so the '
          + 'control the reader left was unmounted with its view, and a reference kept to it '
          + 'is a detached node that `focus()` accepts and silently ignores. Storing one '
          + 'passes a test that never unmounts anything and puts every reader at the top of '
          + 'the page in production.\n\n'
          + 'The movement is Crystal\'s `view-push-in` and `view-push-out`, authored in core '
          + '2.1.0. One is a view arriving from the inline-end edge, the other the view it covers '
          + 'travelling a fraction of that distance behind it. Two recipes instead of four, '
          + 'because a pop is a push mirrored and right-to-left is a push mirrored again.',
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

/* Drivable, because what needs checking in a stack happens between two states
   and a static story has only one. A push and a pop are the same recipe
   pointing opposite ways, and only pushing and then popping shows whether the
   second one points the other way. */
function Drivable(): React.JSX.Element {
  const [depth, setDepth] = useState(1);
  const views: StackedView[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      children: (
        <div style={{ padding: 16 }}>
          <Button onPress={() => { setDepth(2); }}>Open the message</Button>
        </div>
      ),
    },
    {
      id: 'message',
      label: 'The quarterly figures',
      children: <p style={{ padding: 16 }}>They are attached.</p>,
    },
  ];

  return (
    <ViewStack
      views={views.slice(0, depth)}
      onPop={() => { setDepth(1); }}
      data-testid="stack"
    />
  );
}

export const Drives: Story = { render: () => <Drivable /> };
