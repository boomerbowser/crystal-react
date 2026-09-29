'use client';

/* ErrorScreen — a view that failed, with a way forward.
 *
 * "role=\"alert\"; states what failed and what to try, **never only a code**."
 *
 * That last clause is the whole component, and it is enforced rather than
 * described: `title` is required and `code` is an extra. There is no way to
 * construct this screen showing `0x80070005` and nothing else, because the
 * arrangement that produces it does not typecheck. A code is for the person the
 * reader forwards it to; it is never the sentence they were owed.
 *
 * **The alert is on the screen, not on the card.** `Result` sets no role — it is
 * used for successes and confirmations too, and a success announced as an alert
 * is a component shouting about good news. A view that has replaced the thing
 * the reader asked for is the case that earns it, so the role is added here,
 * where the failure actually is.
 *
 * **Level 1 by default.** This screen has replaced the view, so there is no page
 * header left to hold the heading. A product rendering it into a region that
 * still has one passes `headingLevel={2}` and keeps its document outline.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Result } from '../Result/Result.js';
import { cx } from '../../styles/cx.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import styles from './ErrorScreen.module.scss';

export interface ErrorScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What failed, in words. Required; see the note above. */
  title: ReactNode;
  /** What it means and what to try. */
  children?: ReactNode;
  /** The routes out. A failure with no way forward is a dead end. */
  actions?: ReactNode;
  /**
   * The reference to quote when reporting it. Rendered after the sentence, never
   * instead of it, and never as the only thing on the screen.
   */
  code?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function ErrorScreen({
  title, children, actions, code, headingLevel = 1, className, ...props
}: ErrorScreenProps): React.JSX.Element {
  /* A screen is a view: inside a router's `AnimatePresence` it arrives with
     `page-in` and leaves with `page-out`; rendered plainly — and on the page
     load that first shows it — nothing. */
  const presence = usePresenceMotion('page-in', 'page-out');
  return (
    <div ref={presence as never} {...props} role="alert" className={cx(styles['screen'], className)}>
      <Result
        outcome="error"
        title={title}
        headingLevel={headingLevel}
        className={cx(styles['card'])}
        {...(actions === undefined ? {} : { actions })}
      >
        {children}
        {code === undefined ? null : (
          <p className={styles['code']}>
            Reference <code>{code}</code>
          </p>
        )}
      </Result>
    </div>
  );
}
