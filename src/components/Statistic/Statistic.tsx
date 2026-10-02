'use client';

/* Statistic. A large value with a label and an optional trend.
 *
 * "Trend direction is stated in text, not by colour or arrow alone." So `trend`
 * is a `direction` and the words that say it, rather than a direction enum
 * rendered as a red or green arrow. The arrow is drawn beside the words and
 * hidden from assistive technology. A screen reader that read both would say
 * "down arrow, 4.2% down on last month", and one given only "4.2%" would get no
 * direction at all.
 *
 * Figures are tabular, so a column of statistics can be compared down its own
 * length.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { TrendIndicator, type TrendDirection } from '../TrendIndicator/TrendIndicator.js';
import { cx } from '../../styles/cx.js';
import { ChangeHighlight } from '../../feedback/ChangeHighlight.js';
import styles from './Statistic.module.scss';

/** Which way the trend went. Crystal's own three, from `TrendIndicator`. */
export type StatisticDirection = TrendDirection;

export interface StatisticTrend {
  direction: StatisticDirection;
  /** The words that state the direction, such as "4.2% up on last month". */
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
        {/* The figure is replaced by a placeholder rather than removed. A box
            that empties while it loads changes height, and a row of statistics
            would reflow. */}
        {loading ? <span aria-hidden="true" className={styles['placeholder']} /> : value}
        {/* \`highlight\` plays when the figure is replaced by a new one. It does
            not play when the figure first arrives or when loading ends, which is
            also arrival. */}
        {loading ? null : <ChangeHighlight />}
        {unit === undefined ? null : <span className={styles['unit']}>{unit}</span>}
      </span>
      {/* The trend is `TrendIndicator` itself. It carries the rule that direction
          is given in a word and a symbol, never in colour alone, and a second
          implementation of that rule would drift from it. */}
      {trend === undefined ? null : (
        <TrendIndicator direction={trend.direction}>{trend.label}</TrendIndicator>
      )}
    </div>
  );
});
