'use client';

/* OfflineScreen — connectivity lost, with what still works.
 *
 * "**Announced politely**; retry is a real button." States: `at-rest`,
 * `reconnecting`.
 *
 * Politely, and that is the difference from `ErrorScreen`. Losing connectivity
 * is not an error the reader caused and often not one that lasts; interrupting
 * whatever a screen reader was in the middle of, to say the network went, is the
 * component being more urgent than the news. So this is `role="status"` where
 * the error screen is `role="alert"` — the same shape, one word apart, and the
 * word is the whole difference in how it arrives.
 *
 * **"With what still works" is the second half, and it is `children`.** An
 * offline screen that only says "You are offline" has replaced a working view
 * with a dead one. Products that cache have something to offer; the slot is
 * where they offer it.
 *
 * **Reconnecting is `aria-busy`, and the announcement does not repeat.** A retry
 * loop that re-announces every few seconds is a screen reader saying the same
 * sentence until the network returns.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Result } from '../Result/Result.js';
import { Button } from '../Button/Button.js';
import { cx } from '../../styles/cx.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import styles from './OfflineScreen.module.scss';

export interface OfflineScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  /** What still works while the network does not. */
  children?: ReactNode;
  /** Whether a reconnection is in flight. */
  isReconnecting?: boolean;
  /** Try again. A real button, not a link. */
  onRetry?: () => void;
  retryLabel?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function OfflineScreen({
  title = 'You are offline', children, isReconnecting = false, onRetry,
  retryLabel = 'Try again', actions, headingLevel = 1, className, ...props
}: OfflineScreenProps): React.JSX.Element {
  /* A screen is a view: inside a router's `AnimatePresence` it arrives with
     `page-in` and leaves with `page-out`; rendered plainly — and on the page
     load that first shows it — nothing. */
  const presence = usePresenceMotion('page-in', 'page-out');
  return (
    <div ref={presence as never}
      {...props}
      role="status"
      aria-busy={isReconnecting || undefined}
      className={cx(styles['screen'], className)}
    >
      <Result
        outcome="warning"
        title={title}
        headingLevel={headingLevel}
        className={cx(styles['card'])}
        actions={(
          <>
            {onRetry === undefined ? null : (
              <Button onPress={onRetry} isDisabled={isReconnecting}>
                {isReconnecting ? 'Reconnecting…' : retryLabel}
              </Button>
            )}
            {actions}
          </>
        )}
      >
        {children}
      </Result>
    </div>
  );
}
