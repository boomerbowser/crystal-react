'use client';

/* Banner: a full-width message pinned to the top of a region.
 *
 * `role="status"` for information, `role="alert"` for urgency. That is the
 * catalogue's own split, with the same reasoning as `Alert`: an assertive live
 * region interrupts a screen reader mid-word, so it is opted into and not
 * implied by a status colour.
 *
 * "Dismissal returns focus sensibly." A banner is dismissed by pressing a
 * control inside it, and that control then stops existing, so focus lands on the
 * document body unless somebody says where it should go. This component cannot
 * know, because the sensible destination is whatever the banner was sitting
 * above. `returnFocusTo` is how a caller says. A caller who leaves it out gets
 * the browser's default, which sends focus to the body.
 *
 * "Full-bleed within its region": no radius of its own and no inline margin. It
 * takes the region's width and the region's corners. A banner with a content
 * radius floating inside its container looks like a card, and a card is not
 * pinned.
 */
import {
  forwardRef, useId, useMemo, type HTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { STATUS_RECIPE, STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useMotion } from '../../motion/useMotion.js';
import { usePlayOnChange } from '../../motion/useChangeMotion.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import styles from './Banner.module.scss';

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  status?: FeedbackStatus;
  /** The message. A banner is one sentence. Anything longer wants an `Alert`. */
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
  /* Inside `AnimatePresence`, a banner arrives with `toast-in` and leaves with
     `toast-out` once dismissed. Rendered plainly, it plays neither. It plays
     `attention`, Crystal's status recipe, when its status becomes one that has
     one, and never on the render that first shows it. There are two scopes,
     because both play on the one element and a status change must not cancel an
     arrival. */
  const presence = usePresenceMotion('toast-in', 'toast-out');
  const [cue, play] = useMotion();
  usePlayOnChange(status, (_, is) => STATUS_RECIPE[is] ?? null, play);
  const merged = useMemo(() => mergeRefs(ref, presence as never, cue as never), [ref, presence, cue]);

  return (
    <div
      {...props}
      ref={merged as never}
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
            /* Focus moves after the handler. The caller's handler removes this
               control, and moving focus first would move it away from a button
               that takes it back on the same tick. */
            returnFocusTo?.current?.focus();
          }}
        >
          <span aria-hidden="true">{'×'}</span>
        </button>
      ) : null}
    </div>
  );
});
