'use client';

/* EmptyState: why a region is empty, and the action that would fill it.
 *
 * "No-results and truly-empty are different states and read differently."
 * The component is built around that. "No projects yet — create your first one"
 * and "No projects match 'wxyz' — clear the filter" are opposite messages. The
 * first says the collection is new and offers to start it. The second says the
 * collection is full and the reader is looking through the wrong window. A
 * component with one empty state says the first when it means the second, and
 * tells a reader with three hundred projects that they have none.
 *
 * So `state` is required. There is no default, because any default would choose
 * one of the four silently for callers who did not think about it, which is what
 * this catalogue entry exists to prevent.
 *
 * "Real text; never an illustration alone." The illustration slot is `aria-
 * hidden` and the title is required.
 *
 * `empty-in` plays when the state changes, not on mount. That is the rule across
 * this library and Crystal: an empty state that was on the page when it loaded
 * did not arrive.
 */
import {
  forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode,
} from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './EmptyState.module.scss';

export type EmptyStateKind = 'empty' | 'no-results' | 'error' | 'unauthorised';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Which kind of empty. Required; see the note above. */
  state: EmptyStateKind;
  /** What the reader is looking at. Required, because an illustration is not text. */
  title: ReactNode;
  children?: ReactNode;
  /** What would fill it. */
  actions?: ReactNode;
  /** Decoration. Always hidden from assistive technology. */
  illustration?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState({
  state, title, children, actions, illustration, className, ...props
}, ref): ReactNode {
  const id = useId();
  const [scope, play] = useMotion();
  const settled = useRef(false);

  useEffect(() => {
    if (settled.current) void play('empty-in');
    settled.current = true;
  }, [state, play]);

  return (
    <div
      {...props}
      ref={mergeRefs(ref, scope)}
      role="region"
      aria-labelledby={`${id}-title`}
      data-state={state}
      className={cx(styles['empty'], className)}
    >
      {illustration ? (
        <div aria-hidden="true" className={styles['illustration']}>{illustration}</div>
      ) : null}
      <p className={styles['title']} id={`${id}-title`}>{title}</p>
      {children ? <div className={styles['body']}>{children}</div> : null}
      {actions ? <div className={styles['actions']}>{actions}</div> : null}
    </div>
  );
});
