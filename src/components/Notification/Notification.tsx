'use client';

/* Notification — a persistent, dismissible message with a title, body,
 * timestamp and actions.
 *
 * A toast that does not leave. What separates it from `Toast` is not its
 * appearance but its lifetime: a notification is a record, it survives the
 * session, and it has a read state — so it is a list item in something a reader
 * comes back to rather than a thing that happened while they were looking.
 *
 * "**Unread treatment**" is Crystal's, and Crystal's answer to "this one is
 * different" is already settled: **label weight alone**. Nothing is drawn beside
 * the title to mark it — a dot beside the title offsets the very title it points
 * at, so the unread one stops lining up with the others, and a check mark never
 * means a state. The weight is typographic rather than chromatic, so the
 * distinction never rests on colour either. Unread is also said in words, in the
 * item's accessible name, because weight is not something a screen reader reads
 * out.
 *
 * The timestamp is a `<time>` with a machine-readable `dateTime`, and the words
 * beside it are the caller's: "3 minutes ago" is a sentence that has to be
 * written in the reader's language and updated as it ages, and a component that
 * formatted it would be guessing at both.
 */
import { forwardRef, useId, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import styles from './Notification.module.scss';

export interface NotificationProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  status?: FeedbackStatus;
  title: ReactNode;
  children?: ReactNode;
  /** Machine-readable, for the `<time>` element. */
  dateTime?: string;
  /** How the time reads. The caller's words, in the reader's language. */
  timestamp?: ReactNode;
  actions?: ReactNode;
  /** Not yet read. Carried by label weight, and said in words. */
  unread?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** How "unread" is said, for a reader who cannot see the weight. */
  unreadLabel?: string;
}

export const Notification = forwardRef<HTMLLIElement, NotificationProps>(function Notification({
  status = 'info', title, children, dateTime, timestamp, actions, unread = false,
  onDismiss, dismissLabel, unreadLabel = 'Unread', className, ...props
}, ref): ReactNode {
  const id = useId();

  /* In a product's list of notifications, inside `AnimatePresence`, one arrives
     with `toast-in` and leaves with `toast-out` once dismissed; rendered plainly,
     nothing. */
  const presence = usePresenceMotion('toast-in', 'toast-out');
  const merged = useMemo(() => mergeRefs(ref, presence as never), [ref, presence]);
  return (
    <li
      {...props}
      ref={merged as never}
      className={cx(styles['notification'], 'cr-frost', className)}
      data-status={status}
      data-unread={unread ? '' : undefined}
      aria-labelledby={`${id}-title`}
    >
      <span aria-hidden="true" className={styles['well']}>{STATUS_SYMBOL[status]}</span>
      <div className={styles['content']}>
        <p className={styles['title']} id={`${id}-title`}>
          {/* Said, not drawn. The weight is the visual treatment and the words
              are what a screen reader gets — neither is a mark beside the label. */}
          {unread ? <span className={styles['said']}>{`${unreadLabel}. `}</span> : null}
          {title}
        </p>
        {children ? <div className={styles['body']}>{children}</div> : null}
        {timestamp ? (
          <time className={styles['time']} {...(dateTime ? { dateTime } : {})}>{timestamp}</time>
        ) : null}
        {actions ? <div className={styles['actions']}>{actions}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className={cx(styles['dismiss'], 'cr-bare')}
          aria-label={dismissLabel ?? (typeof title === 'string' ? `Dismiss: ${title}` : 'Dismiss')}
          onClick={onDismiss}
        >
          <span aria-hidden="true">{'×'}</span>
        </button>
      ) : null}
    </li>
  );
});
