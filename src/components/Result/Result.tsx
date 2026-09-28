'use client';

/* Result — a full-region outcome with a status symbol, title, explanation and
 * next actions.
 *
 * "**The outcome is stated in the heading**; symbol and colour reinforce it."
 * So the title is a real heading element at a level the caller chooses, and the
 * symbol beside it is `aria-hidden`: a reader who heard both would be told
 * "exclamation mark, Payment declined". Colour is the third copy of a message
 * that is already in words twice.
 *
 * Six outcomes, four ink pairs. `not-found` and `unauthorised` are outcomes
 * rather than statuses — Crystal publishes no fifth and sixth semantic pair, and
 * inventing two here would be two more colours to keep at 4.5:1 across twelve
 * palette-and-mode combinations. So each maps onto the pair that says the same
 * thing: a page that is not there is information, and a page you may not see is
 * blocked.
 */
import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import styles from './Result.module.scss';

export type ResultOutcome =
  | 'success' | 'error' | 'warning' | 'info' | 'not-found' | 'unauthorised';

/* Which semantic pair each outcome reads as. Stated rather than implied, because
   the two that are not obvious are exactly the two worth arguing about. */
const PAIR: Record<ResultOutcome, FeedbackStatus> = {
  success: 'success',
  error: 'danger',
  warning: 'attention',
  info: 'info',
  'not-found': 'info',
  unauthorised: 'danger',
};

export interface ResultProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  outcome?: ResultOutcome;
  /** What happened. Stated here, in the heading, and not left to the symbol. */
  title: ReactNode;
  /** Why, and what it means. */
  children?: ReactNode;
  /** The routes out. A result with no way forward is a dead end. */
  actions?: ReactNode;
  /** Which heading level this is, in the page it sits in. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Result = forwardRef<HTMLDivElement, ResultProps>(function Result({
  outcome = 'info', title, children, actions, headingLevel = 2, className, ...props
}, ref): ReactNode {
  const Heading = `h${headingLevel}` as 'h2';
  const status = PAIR[outcome];
  /* `success` for a success outcome, once, as it is shown — a result appears
     because something finished, and an outcome that becomes a success mounts
     the cue at that moment. Never for any other outcome. */
  const [scope, play] = useMotion();
  const merged = useMemo(() => mergeRefs(ref, scope as never), [ref, scope]);

  return (
    <div
      {...props}
      ref={merged as never}
      data-outcome={outcome}
      data-status={status}
      className={cx(styles['result'], className)}
    >
      {outcome === 'success' ? <Arrival play={play} recipe="success" /> : null}
      <span aria-hidden="true" className={styles['well']}>{STATUS_SYMBOL[status]}</span>
      <Heading className={styles['title']}>{title}</Heading>
      {children ? <div className={styles['body']}>{children}</div> : null}
      {actions ? <div className={styles['actions']}>{actions}</div> : null}
    </div>
  );
});
