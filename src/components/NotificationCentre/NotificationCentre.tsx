'use client';

/* NotificationCentre — notifications, grouped, with read state and actions.
 *
 * "**Unread count is announced; marking read is undoable.**" States: `at-rest`,
 * `unread`, `empty`, `focus-visible`.
 *
 * Both halves are about acting on many things at once without seeing them all.
 *
 *   - **The unread count is said when it changes**, and shown in the heading's
 *     row in words, so "Mark all as read" is a decision about a number the
 *     reader knows. Not on load: a count that was there is not news.
 *   - **Marking read can be taken back, from a control that stays.** Marking one
 *     notification, or all of them, leaves an "Undo" beside a sentence saying
 *     what was marked — until the next mark replaces it or the reader dismisses
 *     it. Not a toast that leaves after four seconds: an undo a reader has to
 *     catch before it goes is not one a keyboard or screen-reader user can rely
 *     on reaching.
 *
 * "Frost panel with Haze rows": the centre is the Frost panel, and every
 * notification inside it steps down to Haze through the surface context —
 * Frost inside Frost is two panes of the same glass, which read as neither.
 * Each row arrives and leaves with the notification's own `toast-in` and
 * `toast-out`, held in presence.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Notification, type NotificationProps } from '../Notification/Notification.js';
import { Button } from '../Button/Button.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { ListPresence } from '../../motion/ListPresence.js';
import { SurfaceProvider } from '../../overlays/surface.js';
import { cx } from '../../styles/cx.js';
import styles from './NotificationCentre.module.scss';

export interface CentreNotification extends Omit<NotificationProps, 'onDismiss' | 'unread' | 'actions' | 'className'> {
  id: string;
  unread: boolean;
  /** The group it belongs under — "Today", "Earlier". Groups keep their first-seen order. */
  group: string;
  /** Its own actions, beside "Mark as read". */
  actions?: ReactNode;
}

export interface NotificationCentreProps {
  title?: ReactNode;
  headingLevel?: 2 | 3;
  notifications: readonly CentreNotification[];
  onMarkRead: (ids: readonly string[]) => void;
  /** Undo: the ids that were just marked, to be made unread again. */
  onMarkUnread: (ids: readonly string[]) => void;
  onDismiss?: (id: string) => void;
  emptyLabel?: ReactNode;
  unreadLabel?: (count: number) => string;
  markedLabel?: (count: number) => string;
  className?: string;
}

export function NotificationCentre({
  title = 'Notifications', headingLevel = 2, notifications, onMarkRead, onMarkUnread, onDismiss,
  emptyLabel = 'No notifications',
  unreadLabel = (count) => (count === 0 ? 'All read' : `${String(count)} unread`),
  markedLabel = (count) => (count === 1 ? 'Marked 1 as read.' : `Marked ${String(count)} as read.`),
  className,
}: NotificationCentreProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const Group = `h${headingLevel + 1}` as 'h3';
  const headingId = useId();
  const unread = notifications.filter((one) => one.unread);
  const [marked, setMarked] = useState<readonly string[] | null>(null);
  const [said, setSaid] = useState('');
  const counted = useRef<number | null>(null);

  /* The unread count, said when it changes — not on load. */
  useEffect(() => {
    if (counted.current !== null && counted.current !== unread.length) setSaid(unreadLabel(unread.length));
    counted.current = unread.length;
  }, [unread.length, unreadLabel]);

  const mark = (ids: readonly string[]): void => {
    if (ids.length === 0) return;
    onMarkRead(ids);
    setMarked(ids);
  };

  const groups = [...new Set(notifications.map((one) => one.group))];

  return (
    <section aria-labelledby={headingId} className={cx(styles['centre'], 'cr-frost', className)}>
      <div className={cx(styles['top'])}>
        <Heading id={headingId} className={cx(styles['heading'])}>{title}</Heading>
        <span className={cx(styles['count'])}>{unreadLabel(unread.length)}</span>
        {unread.length > 0 ? (
          <Button variant="quiet" onPress={() => { mark(unread.map((one) => one.id)); }}>Mark all as read</Button>
        ) : null}
      </div>

      {marked ? (
        /* The undo stays until it is used, replaced or dismissed. */
        <div className={cx(styles['undo'], 'cr-haze')}>
          <span>{markedLabel(marked.length)}</span>
          <Button variant="quiet" onPress={() => { onMarkUnread(marked); setMarked(null); }}>Undo</Button>
          <Button variant="quiet" onPress={() => { setMarked(null); }}>Dismiss</Button>
        </div>
      ) : null}

      {notifications.length === 0 ? (
        <EmptyState state="empty" title={emptyLabel} />
      ) : (
        <SurfaceProvider surface="frost">
          {groups.map((group) => {
            const groupId = `${headingId}-${group.replace(/\s+/g, '-')}`;
            return (
              <section key={group} aria-labelledby={groupId} className={cx(styles['group'])}>
                <Group id={groupId} className={cx(styles['groupHeading'])}>{group}</Group>
                <ul className={cx(styles['list'])}>
                  <ListPresence>
                    {notifications.filter((one) => one.group === group).map(({ id, group: _, actions, ...one }) => (
                      <Notification
                        key={id}
                        {...one}
                        unread={one.unread}
                        {...(onDismiss ? { onDismiss: () => { onDismiss(id); } } : {})}
                        actions={(
                          <>
                            {actions}
                            {one.unread ? (
                              <Button variant="quiet" onPress={() => { mark([id]); }}>Mark as read</Button>
                            ) : null}
                          </>
                        )}
                      />
                    ))}
                  </ListPresence>
                </ul>
              </section>
            );
          })}
        </SurfaceProvider>
      )}

      {/* Polite, present from the first frame: the count as it changes, and what
          was marked, with the undo that remains on screen. */}
      <VisuallyHidden role="status">
        {marked ? `${markedLabel(marked.length)} Undo is available.` : said}
      </VisuallyHidden>
    </section>
  );
}
