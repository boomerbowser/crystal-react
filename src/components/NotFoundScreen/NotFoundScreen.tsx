'use client';

/* NotFoundScreen: the requested thing does not exist.
 *
 * "States what was not found and offers a route onward."
 *
 * Both halves are required, and products tend to skip the second. A 404 that
 * says "Page not found" and stops leaves the reader on a page with nothing on
 * it. The browser's back button is not a route the product offered. So
 * `actions` is required, and the type says so.
 *
 * It is not an alert, because nothing failed. A missing thing is a fact about
 * the address, and `Result`'s `not-found` outcome is the vocabulary Crystal
 * already has for it. Announcing it assertively would interrupt whatever the
 * reader was being told for news that is not urgent.
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
  /* A screen is a view. Inside a router's `AnimatePresence` it arrives with
     `page-in` and leaves with `page-out`. Rendered plainly, and on the page
     load that first shows it, it does not animate. */
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
