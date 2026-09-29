'use client';

/* NotFoundScreen — the requested thing does not exist.
 *
 * "States what was not found and **offers a route onward**."
 *
 * Both halves are required here, and the second one is the one products skip. A
 * 404 that says "Page not found" and stops has told the reader something they
 * already knew and left them on a page with nothing on it; the browser's back
 * button is not a route the product offered, it is the one the reader had
 * anyway. So `actions` is required, and the type says so.
 *
 * **Not an alert.** Nothing failed. A missing thing is a fact about the address,
 * not an error in the system, and `Result`'s `not-found` outcome is the
 * vocabulary Crystal already has for it. Announcing it assertively would
 * interrupt whatever the reader was being told for news that is not urgent.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Result } from '../Result/Result.js';
import { cx } from '../../styles/cx.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import styles from './NotFoundScreen.module.scss';

export interface NotFoundScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What was not found. Required. */
  title: ReactNode;
  children?: ReactNode;
  /** The route onward. Required; see the note above. */
  actions: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function NotFoundScreen({
  title, children, actions, headingLevel = 1, className, ...props
}: NotFoundScreenProps): React.JSX.Element {
  /* A screen is a view: inside a router's `AnimatePresence` it arrives with
     `page-in` and leaves with `page-out`; rendered plainly — and on the page
     load that first shows it — nothing. */
  const presence = usePresenceMotion('page-in', 'page-out');
  return (
    <div ref={presence as never} {...props} className={cx(styles['screen'], className)}>
      <Result
        outcome="not-found"
        title={title}
        actions={actions}
        headingLevel={headingLevel}
        className={cx(styles['card'])}
      >
        {children}
      </Result>
    </div>
  );
}
