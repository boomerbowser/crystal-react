'use client';

/* Gauge shows a single value against a range, drawn as an arc.
 *
 * `role="meter"` with a text value, as the catalogue requires, so this is not a
 * progress bar bent into a circle. A meter is a measurement within a known
 * range, such as disk usage, a temperature or a score, and it is not heading
 * towards an end. A progress bar is a task getting closer to finishing. The two
 * announce differently.
 *
 * "Threshold colour from status tokens." A gauge may be told that its value is
 * in a band that means something, and then it takes the status colour for that
 * band. It never invents a colour and never uses colour alone: the band's name
 * is in the value's accessible text and beside it on screen.
 *
 * The sweep and the stroke are both Crystal's. The arc matches the ring
 * progress stroke, as the catalogue requires, and `--cr-progress-ring-stroke`
 * is one value so a gauge and a ring progress cannot drift apart.
 */
import { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { arcPath } from '../../charts/Radial.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { cx } from '../../styles/cx.js';
import styles from './Gauge.module.scss';

export type GaugeStatus = 'success' | 'attention' | 'danger' | 'info';

export interface GaugeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  min?: number;
  max?: number;
  /** What is being measured. */
  label: ReactNode;
  /** The value in words. Shown, and used as the meter's text. */
  valueLabel?: string;
  /** Which band the value is in, when that means something. */
  status?: GaugeStatus;
  /** What that band is called. Required with `status`: colour is never alone. */
  statusLabel?: string;
  /** Drawn size. */
  size?: number;
}

export function Gauge({
  value, min = 0, max = 100, label, valueLabel, status, statusLabel,
  size = 160, className, ...props
}: GaugeProps): ReactNode {
  const span = max - min;
  const fraction = span === 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span));
  const text = valueLabel ?? String(value);
  const sweep = (chartGeometry.gaugeSweep * Math.PI) / 180;
  /* Centred on the bottom: the arc runs from half its sweep before twelve
     o'clock to half after, measured the way `d3-shape` measures, which puts the
     gap at the bottom where the value goes. */
  const from = -sweep / 2;
  const radius = size / 2;
  const stroke = chartGeometry.ringStroke;

  return (
    <div
      {...props}
      className={cx(styles['gauge'], className)}
      data-status={status}
      style={{ '--gauge-size': `${size}px` } as CSSProperties}
    >
      <div
        className={styles['dial']}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={statusLabel ? `${text}, ${statusLabel}` : text}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <svg aria-hidden="true" className={styles['arc']} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${radius},${radius})`}>
            <path className={styles['track']} d={arcPath(radius, stroke, from, from + sweep)} />
            <path
              className={styles['value']}
              d={arcPath(radius, stroke, from, from + sweep * fraction)}
            />
          </g>
        </svg>
        <span className={styles['reading']}>
          <span className={styles['number']}>{text}</span>
          {statusLabel ? <span className={styles['status']}>{statusLabel}</span> : null}
        </span>
      </div>
      <span className={styles['caption']}>{label}</span>
    </div>
  );
}
