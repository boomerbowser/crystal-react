import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popconfirm } from './Popconfirm.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Inline confirm',
  component: Popconfirm,
  parameters: {
    docs: {
      description: {
        component:
          '**Focus lands on Cancel, not on Confirm.** A confirmation exists because the action '
          + 'is hard to undo, and one that puts the destructive choice under the key the reader '
          + 'is already pressing has asked a question whose default answer is yes. Cancel is '
          + 'also what Escape does and what clicking away does, so the focused control and all '
          + 'three ways out agree. A reader who means it presses Tab once.\n\n'
          + 'Focus into the popover, back to the trigger on dismiss, and Escape cancels — all '
          + 'three from `Popover`, which is React Aria\'s.\n\n'
          + '"Whether a full dialog is warranted instead" is the real question the catalogue '
          + 'asks: this is for actions whose consequence fits in a sentence. Anything needing a '
          + 'paragraph, a list of what will be lost, or a typed confirmation is a dialog.',
      },
    },
  },
  args: {
    label: 'Delete this project?',
    description: 'Its history and its settings go with it.',
    destructive: true,
    children: <Button variant="danger">Delete project</Button>,
  },
} satisfies Meta<typeof Popconfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destructive: Story = {};

export const Ordinary: Story = {
  args: {
    label: 'Publish these changes?',
    description: 'Everyone on the team will see them.',
    destructive: false,
    confirmLabel: 'Publish',
    children: <Button>Publish</Button>,
  },
};

export const InFlight: Story = { args: { pending: true, pendingLabel: 'Deleting' } };
