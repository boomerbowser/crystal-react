'use client';

/* DescriptionList: term and value pairs.
 *
 * This is a real `dl`, because a grid of divs cannot keep the term and the value
 * associated. A screen reader moves through a two-column layout out of order, so
 * "Status" and "Active" in separate cells are two unrelated words. In a
 * definition list they are a pair, and a reader can move from term to term and
 * ask for each one's value.
 *
 * Each pair is wrapped in a `div`. HTML allows this inside `dl` so a term and its
 * values can be styled as a unit, and it is the only way to lay the list out as
 * rows without breaking the association.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './DescriptionList.module.scss';

export interface DescriptionPair {
  /** Stable across renders. */
  id: string;
  term: ReactNode;
  value: ReactNode;
}

export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: readonly DescriptionPair[];
  /** Term above value rather than beside it. */
  stacked?: boolean;
  /** Shown instead of the list when there are no pairs. */
  empty?: ReactNode;
}

export const DescriptionList = forwardRef<HTMLElement, DescriptionListProps>(function DescriptionList(
  { items, stacked = false, empty, className, ...props },
  ref,
) {
  if (items.length === 0 && empty !== undefined) {
    return <div className={cx(styles['empty'], className)}>{empty}</div>;
  }

  return (
    <dl
      {...props}
      ref={ref as never}
      className={cx(styles['list'], stacked ? styles['stacked'] : undefined, className)}
    >
      {items.map((item) => (
        <div key={item.id} className={styles['pair']}>
          <dt className={styles['term']}>{item.term}</dt>
          <dd className={styles['value']}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
});
