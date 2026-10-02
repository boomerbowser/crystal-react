import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { NotificationCentre, type CentreNotification } from './NotificationCentre.js';

const seed: CentreNotification[] = [
  { id: 'a', group: 'Today', title: 'Ada commented on Quarterly figures', unread: true, dateTime: '2026-09-28T09:00:00Z', timestamp: '9:00' },
  { id: 'b', group: 'Today', title: 'Invoice 1042 was paid', unread: true, status: 'success', timestamp: '8:12' },
  { id: 'c', group: 'Earlier', title: 'Your weekly summary is ready', unread: false, timestamp: 'Monday' },
];

const meta = {
  title: 'Blocks/NotificationCentre',
  component: NotificationCentre,
  parameters: {
    docs: {
      description: {
        component:
          '"Unread count is announced; marking read is undoable."\n\nThe count is shown in words and '
          + 'said when it changes. Marking one or all as read leaves an Undo beside a sentence saying '
          + 'what was marked, until it is used, replaced or dismissed, so it does not leave before a keyboard can reach it. '
          + 'The centre is the Frost panel, and the notifications in it step down to Haze rows.',
      },
    },
  },
  args: { notifications: seed, onMarkRead: fn(), onMarkUnread: fn() },
} satisfies Meta<typeof NotificationCentre>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};
export const AllRead: Story = { args: { notifications: seed.map((one) => ({ ...one, unread: false })) } };
export const Empty: Story = { args: { notifications: [] } };

/** Marking and undoing for real. */
export const MarkingAndUndoing: Story = {
  render: function MarkingStory(args) {
    const [items, setItems] = useState(seed);
    const set = (ids: readonly string[], unread: boolean) => {
      setItems((all) => all.map((one) => (ids.includes(one.id) ? { ...one, unread } : one)));
    };
    return (
      <div style={{ maxInlineSize: 560 }}>
        <NotificationCentre
          {...args}
          notifications={items}
          onMarkRead={(ids) => { set(ids, false); }}
          onMarkUnread={(ids) => { set(ids, true); }}
          onDismiss={(id) => { setItems((all) => all.filter((one) => one.id !== id)); }}
        />
      </div>
    );
  },
};
