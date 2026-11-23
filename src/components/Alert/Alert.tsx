'use client';

/* Alert: an inline banner with a semantic symbol, a title, body text and
 * optional actions.
 *
 * "**role=alert only for genuinely urgent, interrupting content**; otherwise a
 * plain region." That is the sharpest sentence in the entry, and the one most
 * often gotten wrong. `role="alert"` is an assertive live region, and an
 * assertive live region interrupts whatever a screen reader was saying, mid
 * word, mid sentence. A page that renders four of them on load has interrupted
 * the reader four times to tell them things that were already on the screen.
 *
 * So `urgent` is an explicit opt-in, it is not implied by `danger`, and the
 * default alert is an ordinary labelled region that a reader meets in document
 * order like everything else. A validation summary that appears because the
 * reader pressed submit is the case `urgent` exists for.
 *
 * "Haze surface with the semantic ink pair **on the symbol well**." The panel
 * stays Haze over whatever it sits on and the message is ordinary text; only the
 * circle is tinted. A danger-coloured panel would make the message decoration on
 * a coloured ground, and a danger-coloured perimeter is the shape Crystal uses
 * for focus.
 *
 * Motion: `attention` on a status that arrives, not on mount. Nothing moves at
 * rest, and an alert that animated as the page loaded is ambient movement.
 * Crystal assigns a recipe to two of the four statuses and this library authors
 * none for the others.
 */
import {
  forwardRef, useEffect, useId, useRef, useState,
  type HTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { STATUS_RECIPE, STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Alert.module.scss';
import { DismissGlyph } from '../../feedback/DismissGlyph.js';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  status?: FeedbackStatus;
  /** The heading, required. An alert with no title is a paragraph in a box. */
  title: ReactNode;
  /** The message. */
  children?: ReactNode;
  /** The recovery action, or actions. Rendered after the message. */
  actions?: ReactNode;
  /**
   * Interrupt the reader. Off by default. Turn it on only for content that
   * has just arrived and cannot wait (a submission that failed, a session about
   * to end). Not for anything that was already on the page.
   */
  urgent?: boolean;
  /**
   * Show a dismiss control. Pressing it removes the alert, and it stays gone
   * until the component is mounted again or `dismissed` is set back. On by
   * default when `onDismiss` is given.
   */
  dismissible?: boolean;
  /** Called when the dismiss control is pressed, after the alert removes itself. */
  onDismiss?: () => void;
  /**
   * Controlled: whether the alert has been dismissed. Leave it out and the
   * alert keeps its own state, so a dismiss control works with no handler.
   */
  dismissed?: boolean;
  /**
   * Where focus goes once the alert has removed itself. Without it, focus that
   * was on the dismiss control falls to the document body.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;
  /** What the dismiss control is called. Named for what it dismisses. */
  dismissLabel?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert({
  status = 'info', title, children, actions, urgent = false,
  dismissible, onDismiss, dismissed, returnFocusTo, dismissLabel, className, ...props
}, ref): ReactNode {
  const [ownDismissed, setOwnDismissed] = useState(false);
  const isDismissed = dismissed ?? ownDismissed;
  const canDismiss = dismissible ?? onDismiss !== undefined;
  const id = useId();
  const [scope, play] = useMotion();
  const previous = useRef<FeedbackStatus>(status);

  useEffect(() => {
    const changed = previous.current !== status;
    previous.current = status;
    if (!changed) return;
    const recipe = STATUS_RECIPE[status];
    if (recipe) play(recipe);
  }, [status, play]);

  if (isDismissed) return null;

  return (
    <div
      {...props}
      ref={mergeRefs(ref, scope)}
      /* A region either way, so the alert has a name and a reader can find it;
         `role="alert"` on top of that only when somebody asked to interrupt. */
      role={urgent ? 'alert' : 'region'}
      aria-labelledby={`${id}-title`}
      data-status={status}
      className={cx('cr-haze inset', styles['alert'], className)}
    >
      <span aria-hidden="true" className={styles['well']}>{STATUS_SYMBOL[status]}</span>
      <div className={styles['content']}>
        <p className={styles['title']} id={`${id}-title`}>{title}</p>
        {children ? <div className={styles['body']}>{children}</div> : null}
        {actions ? <div className={styles['actions']}>{actions}</div> : null}
      </div>
      {canDismiss ? (
        <button
          type="button"
          className={cx(styles['dismiss'], 'cr-bare')}
          /* Named for what it dismisses rather than "Close": a page with three
             alerts otherwise offers a reader three identical buttons. */
          aria-label={dismissLabel ?? (typeof title === 'string' ? `Dismiss: ${title}` : 'Dismiss')}
          onClick={() => {
            setOwnDismissed(true);
            onDismiss?.();
            /* After the alert is gone the control is gone with it, so focus is
               handed on before the next paint. */
            const target = returnFocusTo?.current;
            if (target) requestAnimationFrame(() => { target.focus(); });
          }}
        >
          <DismissGlyph />
        </button>
      ) : null}
    </div>
  );
});
