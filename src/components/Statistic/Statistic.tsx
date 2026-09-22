'use client';

/* Statistic — a large value with a label and an optional trend.
 *
 * "Trend direction is stated in text, not by colour or arrow alone." So `trend`
 * is not a direction enum that this component renders as a red or green arrow:
 * it is a `direction` *and* the words that say it. The arrow is drawn beside the
 * words and hidden from assistive technology, in that order, because a reader who
 * hears "down arrow, 4.2% down on last month" has heard it twice and a reader who
 * hears only "4.2%" has not heard it at all.
 *
 * Figures are tabular. A column of statistics whose digits do not line up is a
 * column that cannot be compared down its own length, which is the only reason
 * anybody puts statistics in a column.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { TrendIndicator, type TrendDirection } from '../TrendIndicator/TrendIndicator.js';
import { cx } from '../../styles/cx.js';
import styles from './Statistic.module.scss';

/** Which way the trend went. Crystal's own three, from `TrendIndicator`. */
export type StatisticDirection = TrendDirection;

export interface StatisticTrend {
  direction: StatisticDirection;
  /** The words. "4.2% up on last month" — the direction, said. */
  label: ReactNode;
}

export interface StatisticProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What is being measured. */
  label: ReactNode;
  /** The figure. */
  value: ReactNode;
  /** A unit or a period, shown quietly beside the figure. */
  unit?: ReactNode;
  trend?: StatisticTrend;
  /** No figure yet. The box keeps its size so the row does not reflow. */
  loading?: boolean;
}

export const Statistic = forwardRef<HTMLElement, StatisticProps>(function Statistic(
  { label, value, unit, trend, loading = false, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref as never} className={cx(styles['statistic'], className)}>
      <span className={styles['label']}>{label}</span>
      <span className={styles['value']} data-loading={loading ? '' : undefined}>
        {/* The figure is replaced, not hidden: a box that empties while it loads
            is a box that changes height, and a row of statistics would reflow. */}
        {loading ? <span aria-hidden="true" className={styles['placeholder']} /> : value}
        {unit === undefined ? null : <span className={styles['unit']}>{unit}</span>}
      </span>
      {/* The trend is `TrendIndicator`, not a second copy of it. The rule it
          carries — direction in a word and a symbol, never in colour alone — is
          one rule, and two implementations of one rule is how one of them stops
          following it. */}
      {trend === undefined ? null : (
        <TrendIndicator direction={trend.direction}>{trend.label}</TrendIndicator>
      )}
    </div>
  );
});
