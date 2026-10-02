import type { Meta, StoryObj } from '@storybook/react-vite';
import { FocusMode } from './FocusMode.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/FocusMode',
  component: FocusMode,
  parameters: {
    docs: {
      description: {
        component:
          '"Entering and leaving are announced; nothing becomes unreachable, only hidden."\n\n'
          + 'Hidden chrome cannot also be reachable. Chrome left `visibility: hidden` in the '
          + 'tab order is invisible and focusable, so a keyboard reader tabs into something '
          + 'nobody can see. Chrome that is hidden is unreachable while it is hidden.\n\n'
          + 'The sentence holds for the mode as a whole: nothing is lost, because leaving is '
          + 'always available. The chrome is not rendered, and the control that leaves focus '
          + 'mode belongs inside the task, where hiding the chrome cannot hide it.\n\n'
          + 'Focus can fail without any warning. Focus resting in the chrome when the mode '
          + 'turns on falls to the document body, and a screen reader says nothing. By the '
          + 'time an effect can see the change, the chrome has unmounted and '
          + '`document.activeElement` is already the body, so focus is followed as it moves.',
      },
    },
  },
  args: {
    chrome: <div style={{ padding: 12 }}><Button variant="quiet">Sidebar</Button></div>,
    children: <p style={{ padding: 16 }}>The one task.</p>,
  },
} satisfies Meta<typeof FocusMode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = { args: { isOn: true } };
