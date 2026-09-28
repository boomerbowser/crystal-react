import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragHandle } from './DragHandle.js';

const item = (label: string) => () => [{ 'text/plain': label }];

const meta = {
  title: 'Utilities/DragHandle',
  component: DragHandle,
  parameters: {
    docs: {
      description: {
        component:
          'The grip is Crystal\'s `.cr-drag-handle` (2.2.0): a bare control with a grip in its own ink, '
          + 'the grab cursor and a lift while held. What is carried is this component\'s — the item '
          + 'rises, not the handle.\n\n'
          + 'A button, not a decorated div: React Aria\'s drag button carries the keyboard state machine, '
          + 'and a screen reader needs something it can activate to start one.',
      },
    },
  },
  args: {
    getItems: item('Quarterly report'),
    handleLabel: 'Drag Quarterly report',
    children: <span style={{ paddingInline: 12 }}>Quarterly report</span>,
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', inlineSize: 320 },
  },
} satisfies Meta<typeof DragHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { isDisabled: true } };
