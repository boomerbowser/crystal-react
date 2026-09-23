import type { Meta, StoryObj } from '@storybook/react-vite';
import { Notification } from './Notification.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Notification',
  component: Notification,
  parameters: {
    docs: {
      description: {
        component:
          'A toast that does not leave. What separates it from `Toast` is its lifetime rather '
          + 'than its appearance: a notification is a record, it survives the session, and it '
          + 'has a read state.\n\n'
          + '**Unread is label weight and nothing beside the label.** Crystal\'s selection rule, '
          + 'doing the same job one component along: a dot beside the title offsets the very '
          + 'title it points at, so the unread item stops lining up with the others. Weight is '
          + 'typographic rather than chromatic, so the distinction never rests on colour — and '
          + 'because weight is not something a screen reader reads out, "unread" is said in the '
          + "item's accessible name too.\n\n"
          + 'The timestamp is a `<time>` with a machine-readable stamp; the words beside it are '
          + 'the caller\'s, because "3 minutes ago" has to be in the reader\'s language and has '
          + 'to age.',
      },
    },
  },
  args: { title: 'Build failed on main', timestamp: '3 minutes ago', dateTime: '2026-09-23T09:15:00Z' },
  decorators: [
    (Story) => <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0 }}><Story /></ul>,
  ],
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = { args: { unread: true, status: 'danger' } };

export const Read: Story = { args: { status: 'danger' } };

export const WithActions: Story = {
  args: {
    unread: true,
    status: 'danger',
    children: 'Three tests failed in the payments suite.',
    actions: <Button variant="quiet">View run</Button>,
  },
};

export const Dismissible: Story = { args: { unread: true, onDismiss: () => {} } };
