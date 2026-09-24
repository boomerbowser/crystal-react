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
          + 'That sentence contains a tension worth resolving in the open. Chrome that is '
          + 'genuinely still reachable has not been hidden — it is on screen, or it is '
          + '`visibility: hidden` and still in the tab order, which is the worst of both: '
          + 'invisible and focusable, so a keyboard reader tabs into something nobody can '
          + 'see. Chrome that is genuinely hidden is unreachable while it is hidden, and '
          + 'that is what hiding means.\n\n'
          + 'The reading that makes both halves true is about the mode: nothing is lost, '
          + 'because leaving is always available. So the chrome is not rendered, and the '
          + 'control that leaves focus mode belongs inside the task, where it cannot be '
          + 'hidden by the thing it undoes.\n\n'
          + 'The half that fails silently is focus. Focus resting in the chrome when the '
          + 'mode turns on falls to the document body, and a screen reader says nothing '
          + 'because nothing happened that it reports. Knowing that has to be done in '
          + 'advance: by the time an effect can see the change, the chrome has unmounted and '
          + '`document.activeElement` is already the body. So focus is followed as it moves.',
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
