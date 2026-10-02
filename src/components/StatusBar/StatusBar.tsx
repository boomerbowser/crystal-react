'use client';

/* StatusBar. Persistent status at the edge of a view.
 *
 * "`role="status"`; errors escalate to assertive." States: `at-rest`,
 * `busy`, `error`.
 *
 * Swapping `role="status"` for `role="alert"` on the same element when the
 * status turns bad does nothing on several screen readers, because the
 * politeness of a live region is taken when the region is inserted, not when its
 * role attribute changes. The text would update without the urgency, and nobody
 * who can see the bar would notice.
 *
 * So there are two regions, and the message is in exactly one of them at a time.
 * An escalated message arrives as new content in an assertive region, which
 * every screen reader agrees to interrupt for. The other region is emptied in
 * the same render, so nothing is said twice.
 *
 * Stone comes from core. `.cr-stone` puts the feather on an isolated `::before`
 * beneath the content rather than on the element, which is what "text stays
 * crisp" means: a soft backing under a crisp label. The recipe belongs to
 * Crystal, so this wears Crystal's class instead of reimplementing it.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './StatusBar.module.scss';

export type StatusBarState = 'at-rest' | 'busy' | 'error';

export interface StatusBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * What is being reported. This is the text of the live region, so it is a
   * string rather than a node.
   */
  status: string;
  state?: StatusBarState;
  /** Anything the bar shows beside the status, such as counts or a progress mark. */
  children?: ReactNode;
}

export function StatusBar({
  status, state = 'at-rest', children, className, ...props
}: StatusBarProps): React.JSX.Element {
  const escalated = state === 'error';

  return (
    <div
      {...props}
      aria-busy={state === 'busy' || undefined}
      className={cx(styles['bar'], 'cr-stone', className)}
    >
      {/* Two regions, one message. Politeness is bound when a live region is
          inserted, so an escalation has to be new content in the assertive one
          rather than a changed attribute on the polite one. */}
      <span
        role="status"
        className={cx(styles['text'], state === 'busy' ? styles['busy'] : undefined)}
      >
        {escalated ? '' : status}
      </span>
      <span role="alert" className={cx(styles['text'], styles['error'])}>
        {escalated ? status : ''}
      </span>
      {children}
    </div>
  );
}
