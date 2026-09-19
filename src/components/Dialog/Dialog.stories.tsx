import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog } from './Dialog.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    onOpenChange: { action: 'onOpenChange', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Mirage scrim with an 80% feathered Haze surface above it — **not** Resin, which is '
          + 'the floating control plane. What separates a dialog from the page is the scrim '
          + 'beneath it rather than elevation above it. React Aria owns focus containment, its '
          + 'return on close, Escape and scroll locking.',
      },
    },
  },
  args: { title: 'Discard changes?' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opened from a trigger, which is how focus return is actually observable. */
export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Open dialog</Button>
        <Dialog {...args} isOpen={open} onOpenChange={setOpen}>
          <p style={{ margin: '0 0 var(--cr-space)' }}>
            Your edits will be lost. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 'var(--cr-space)', justifyContent: 'flex-end' }}>
            <Button variant="quiet" onPress={() => setOpen(false)}>Keep editing</Button>
            <Button variant="primary" onPress={() => setOpen(false)}>Discard</Button>
          </div>
        </Dialog>
      </>
    );
  },
};

/** Not dismissable by the scrim, so a stray click cannot discard work. */
export const NotDismissable: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Open</Button>
        <Dialog {...args} isOpen={open} onOpenChange={setOpen} isDismissable={false}>
          <p style={{ margin: '0 0 var(--cr-space)' }}>Escape still closes this.</p>
          <Button onPress={() => setOpen(false)}>Close</Button>
        </Dialog>
      </>
    );
  },
};
