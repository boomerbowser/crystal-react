import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { NotificationCentre, type CentreNotification } from './NotificationCentre.js';

const seed: CentreNotification[] = [
  { id: 'a', group: 'Today', title: 'Ada commented', unread: true, dateTime: '2026-09-28T09:00:00Z', timestamp: '9:00' },
  { id: 'b', group: 'Today', title: 'Invoice paid', unread: true, status: 'success' },
  { id: 'c', group: 'Earlier', title: 'Weekly summary', unread: false },
];

/* A centre whose read state is real, so marking and undoing change it. */
function Harness({ onMarkRead = () => {}, onMarkUnread = () => {} }: {
  onMarkRead?: (ids: readonly string[]) => void;
  onMarkUnread?: (ids: readonly string[]) => void;
}) {
  const [items, setItems] = useState(seed);
  return (
    <NotificationCentre
      notifications={items}
      onMarkRead={(ids) => { onMarkRead(ids); setItems((all) => all.map((one) => (ids.includes(one.id) ? { ...one, unread: false } : one))); }}
      onMarkUnread={(ids) => { onMarkUnread(ids); setItems((all) => all.map((one) => (ids.includes(one.id) ? { ...one, unread: true } : one))); }}
    />
  );
}

describe('NotificationCentre', () => {
  it('groups notifications under named regions, and shows the unread count in words', () => {
    renderWithCrystal(<Harness />);
    expect(screen.getByRole('region', { name: 'Today' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Earlier' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('2 unread')).toBeInTheDocument();
  });

  /* The opinion, half one: the count is said when it changes, not on load. */
  it('says the unread count when it changes, and not on load', async () => {
    renderWithCrystal(<Harness />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    await userEvent.click(within(screen.getByRole('region', { name: 'Today' })).getAllByRole('button', { name: 'Mark as read' })[0]!);
    await waitFor(() => { expect(screen.getByText('1 unread')).toBeInTheDocument(); });
  });

  /* Half two: the undo is a control that stays, not a toast that leaves. */
  it('keeps an undo on screen after marking, and undoing restores what was marked', async () => {
    const onMarkUnread = vi.fn();
    renderWithCrystal(<Harness onMarkUnread={onMarkUnread} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(screen.getByText('All read')).toBeInTheDocument();
    const undo = screen.getByRole('button', { name: 'Undo' });
    await new Promise((resolve) => { setTimeout(resolve, 50); });
    expect(undo).toBeInTheDocument();
    await userEvent.click(undo);
    expect(onMarkUnread).toHaveBeenCalledWith(['a', 'b']);
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent('2 unread'); });
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('offers no mark-all when nothing is unread', () => {
    renderWithCrystal(
      <NotificationCentre notifications={seed.map((one) => ({ ...one, unread: false }))} onMarkRead={() => {}} onMarkUnread={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).toBeNull();
  });

  it('says it is empty', () => {
    renderWithCrystal(<NotificationCentre notifications={[]} onMarkRead={() => {}} onMarkUnread={() => {}} />);
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it.each([
    ['unread', seed],
    ['all read', seed.map((one) => ({ ...one, unread: false }))],
    ['empty', []],
  ])('has no axe violations %s', async (_, notifications) => {
    const { container } = renderWithCrystal(
      <NotificationCentre notifications={notifications} onMarkRead={() => {}} onMarkUnread={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });
});
