'use client';

/* DescriptionList — term and value pairs.
 *
 * A real `dl`, and the reason is the one thing a grid of divs cannot do: keep the
 * term and the value associated. Read out of order — which is how a screen reader
 * moves through a two-column layout — "Status" and "Active" in separate cells are
 * two unrelated words. In a definition list they are a pair, and a reader can
 * move term to term and ask for each one's value.
 *
 * That is also why the pairs are wrapped in `div`s: HTML allows it inside `dl`
 * precisely so a term and its values can be styled as a unit, and it is the only
 * way to lay this out as rows without breaking the association the element
 * exists for.
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
