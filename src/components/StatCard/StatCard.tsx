'use client';

/* StatCard. A figure with its label, trend and period.
 *
 * "The figure and its trend are one readable sentence, not a number beside an
 * arrow." That is a rule about order, which a card can enforce: label, then
 * figure, then the period it covers, then what it did. Read straight down, as
 * "Revenue, £48,210, this month, 4.2% up on last month", that is a sentence. Any
 * other arrangement is a number with decoration around it, and a reader moving
 * linearly gets the decoration first.
 *
 * It is `Card` and `Statistic` rather than a third implementation of either. The
 * Haze fill, the recession inside a Resin frame, the region semantics and the
 * trend's word-and-symbol rule already belong to those components.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Card } from '../Card/Card.js';
import { Statistic, type StatisticTrend } from '../Statistic/Statistic.js';
import { cx } from '../../styles/cx.js';
import styles from './StatCard.module.scss';

export interface StatCardProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What is being measured. */
  label: ReactNode;
  /** The figure. */
  value: ReactNode;
  /** A unit, shown quietly beside the figure. */
  unit?: ReactNode;
  /** What span it covers, such as "this month" or "last 7 days". */
  period?: ReactNode;
  trend?: StatisticTrend;
  /** No figure yet. The card keeps its size so a row of them does not reflow. */
  loading?: boolean;
  /** Nothing to report, said rather than shown as a zero. */
  empty?: ReactNode;
}

export const StatCard = forwardRef<HTMLElement, StatCardProps>(function StatCard(
  { label, value, unit, period, trend, loading = false, empty, className, ...props },
  ref,
) {
  /* A card that has nothing to say says so. A zero in place of "no data yet" is
     a measurement the product did not make. */
  if (empty !== undefined && !loading) {
    return (
      <Card {...props} ref={ref} className={cx(styles['card'], className)}>
        <span className={styles['label']}>{label}</span>
        <p className={styles['empty']}>{empty}</p>
      </Card>
    );
  }

  return (
    <Card {...props} ref={ref} className={cx(styles['card'], className)}>
      <Statistic
        label={label}
        value={value}
        {...(unit === undefined ? {} : { unit })}
        {...(trend === undefined ? {} : { trend })}
        loading={loading}
      />
      {period === undefined ? null : <span className={styles['period']}>{period}</span>}
    </Card>
  );
});
