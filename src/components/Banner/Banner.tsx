'use client';

/* Banner — a full-width message pinned to the top of a region.
 *
 * `role="status"` for information, `role="alert"` for urgency — the catalogue's
 * own split, and the same reasoning as `Alert`: an assertive live region
 * interrupts a screen reader mid-word, so it is opted into rather than implied
 * by a status colour.
 *
 * "**Dismissal returns focus sensibly.**" A banner is dismissed by pressing a
 * control inside it, and that control then stops existing — so focus lands on
 * the document body unless somebody says where it should go. This component
 * cannot know: the sensible destination is whatever the banner was sitting
 * above. So `returnFocusTo` is how a caller says, and it is called out here
 * because a caller who leaves it out gets the browser's default, which is the
 * failure this sentence is about.
 *
 * "Full-bleed within its region" — no radius of its own, no inline margin. It
 * takes the region's width and the region's corners; a banner with a content
 * radius floating inside its container is a card, and a card is not pinned.
 */
import {
  forwardRef, useId, type HTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { cx } from '../../styles/cx.js';
import styles from './Banner.module.scss';

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  status?: FeedbackStatus;
  /** The message. A banner is one sentence; anything longer wants an `Alert`. */
  children: ReactNode;
  /** An action, at the end of the row. */
  action?: ReactNode;
  /** Interrupt the reader. Off by default; see the note above. */
  urgent?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  /**
   * Where focus goes after the dismiss control removes itself. Without it,
   * focus falls to the document body and a keyboard reader starts again from
   * the top of the page.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;
}

export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner({
  status = 'info', children, action, urgent = false,
  onDismiss, dismissLabel = 'Dismiss this message', returnFocusTo, className, ...props
}, ref): ReactNode {
  const id = useId();

  return (
    <div
      {...props}
      ref={ref}
      role={urgent ? 'alert' : 'status'}
      data-status={status}
      className={cx(styles['banner'], className)}
    >
      <span aria-hidden="true" className={styles['well']}>{STATUS_SYMBOL[status]}</span>
      <p className={styles['message']} id={`${id}-message`}>{children}</p>
      {action ? <div className={styles['action']}>{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          className={cx(styles['dismiss'], 'cr-bare')}
          aria-label={dismissLabel}
          onClick={() => {
            onDismiss();
            /* After, not before: the caller's handler is what removes this
               control, and moving focus first would move it away from a button
               that is about to take it back on the same tick. */
            returnFocusTo?.current?.focus();
          }}
        >
          <span aria-hidden="true">{'×'}</span>
        </button>
      ) : null}
    </div>
  );
});
