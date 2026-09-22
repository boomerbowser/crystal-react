'use client';

/* KpiTile — a stat card with a target and progress toward it.
 *
 * "Target attainment is stated in words as well as shown." The bar is the
 * *shown* half and it is the half that fails first: a bar near its end and a bar
 * past its end look the same at a glance, and neither says whether past the end
 * is good. So the words come first in the source — "£48,210 of £45,000, 107% of
 * target, on target" — and the bar follows them as reinforcement.
 *
 * `onTarget` is the caller's judgement rather than a comparison this component
 * makes. Attainment is not always "value ≥ target": a cost target is met by
 * coming in *under* it, and a tile that decided for itself would report every
 * saving as a miss.
 *
 * A note on the bar: Crystal ships no `progress` rule, and the `progress`
 * component belongs to slice L. The treatment here is Crystal's own bar, taken
 * from the range control it does style — an 8px track at the pill radius, the
 * primary fill on the soft one — rather than a new one invented for this tile.
 * When slice L lands, this composes that component instead.
 */
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { Card } from '../Card/Card.js';
import { Statistic, type StatisticTrend } from '../Statistic/Statistic.js';
import { cx } from '../../styles/cx.js';
import styles from './KpiTile.module.scss';

export interface KpiTileProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  trend?: StatisticTrend;
  /** The target, as it should read. */
  target: ReactNode;
  /** How far along, 0 to 1. Clamped for the bar; the words are the caller's. */
  attainment: number;
  /**
   * Whether the target is met. The caller's judgement, not a comparison made
   * here: a cost target is met by coming in under it.
   */
  onTarget?: boolean;
  /** Attainment in words — "107% of target, on target". Required, and shown. */
  attainmentLabel: ReactNode;
  loading?: boolean;
}

export const KpiTile = forwardRef<HTMLElement, KpiTileProps>(function KpiTile(
  { label, value, unit, trend, target, attainment, onTarget, attainmentLabel,
    loading = false, className, ...props },
  ref,
) {
  const barId = useId();
  const fraction = Math.min(1, Math.max(0, attainment));
  const state = loading ? 'loading' : onTarget === undefined ? 'at-rest' : onTarget ? 'on-target' : 'off-target';

  return (
    <Card
      {...props}
      ref={ref}
      data-state={state}
      className={cx(styles['tile'], className)}
    >
      <Statistic
        label={label}
        value={value}
        {...(unit === undefined ? {} : { unit })}
        {...(trend === undefined ? {} : { trend })}
        loading={loading}
      />
      <p className={styles['target']} id={barId}>
        <span className={styles['targetValue']}>{target}</span>
        <span className={styles['attainment']}>{attainmentLabel}</span>
      </p>
      {/* A real `progress`, so the value, its maximum and its role come from the
          platform rather than from three ARIA attributes that have to agree. It
          is labelled by the sentence above it rather than repeating it. */}
      <progress
        className={styles['bar']}
        aria-labelledby={barId}
        max={1}
        {...(loading ? {} : { value: fraction })}
      />
    </Card>
  );
});
