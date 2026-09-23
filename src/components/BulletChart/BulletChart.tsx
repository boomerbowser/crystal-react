'use client';

/* BulletChart — a measure against a target and qualitative ranges.
 *
 * `role="meter"` with the target stated in text, which is the catalogue's
 * requirement and the whole difference between this and a progress bar: a bullet
 * chart is a *reading* against a target, and the target is the point. A reader
 * told "62" has been told nothing; "62 of a target of 80, in the acceptable
 * band" is the sentence the picture is drawing.
 *
 * "The target is a crisp marker, not a bar." A bar drawn to the target would be
 * a second measurement, and the eye would compare two lengths rather than a
 * length against a line. The marker is the full height of the row and it is the
 * one thing in the chart that never has a material.
 *
 * "Haze range bands" — the qualitative ranges behind the measure, each a step of
 * Crystal's intensity ramp so that "acceptable" and "good" are a scale rather
 * than three colours somebody chose.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { intensityFill } from '../../charts/intensity.js';
import { cx } from '../../styles/cx.js';
import styles from './BulletChart.module.scss';

export interface BulletRange {
  /** Where this band ends. The first starts at the chart's minimum. */
  to: number;
  /** What the band is called. Required: a band with no name is a colour. */
  name: string;
}

export interface BulletChartProps {
  /** What is measured. */
  label: ReactNode;
  value: number;
  target: number;
  min?: number;
  max?: number;
  /** Bands from worst to best, in order. */
  ranges?: readonly BulletRange[];
  format?: (value: number) => string;
  className?: string;
}

export function BulletChart({
  label, value, target, min = 0, max = 100, ranges = [],
  format = (v) => String(v), className,
}: BulletChartProps): ReactNode {
  const span = max - min || 1;
  const at = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / span) * 100))}%`;
  const band = ranges.find((range) => value <= range.to);
  const text = `${format(value)} of a target of ${format(target)}`
    + (band ? `, ${band.name}` : '');

  return (
    <div className={cx(styles['bullet'], className)}>
      <span className={styles['label']}>{label}</span>
      <div
        className={styles['track']}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        {ranges.map((range, index) => (
          <span
            key={range.name}
            className={styles['range']}
            style={{
              '--range-from': at(ranges[index - 1]?.to ?? min),
              '--range-to': at(range.to),
              '--range-fill': intensityFill(index + 1),
            } as CSSProperties}
          />
        ))}
        <span className={styles['measure']} style={{ '--measure-to': at(value) } as CSSProperties} />
        <span className={styles['target']} style={{ '--target-at': at(target) } as CSSProperties} />
      </div>
      {/* The sentence the picture is drawing. Shown, not only announced: the
          target is the point of the chart and it is the thing a bar cannot say. */}
      <span className={styles['reading']}>{text}</span>
    </div>
  );
}
