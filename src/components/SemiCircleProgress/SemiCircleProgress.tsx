'use client';

/* SemiCircleProgress.
 *
 * A half-ring showing progress toward a value.
 *
 * "Stroke matches the ring progress contract", so it reads the same
 * `--cr-progress-ring-stroke` and the same arc generator. Only the sweep
 * differs: half a turn, drawn from nine o'clock to three.
 *
 * "role=progressbar **with a text value beside it**". The catalogue asks for the
 * value in words on the screen as well as in the accessible tree, so
 * `valueLabel` is rendered as well as announced.
 *
 * The catalogue lists an indeterminate state, which a half-ring has no natural
 * way to show. It is drawn as the whole arc at reduced strength, with the busy
 * label where the number would be. Nothing travels along a half circle, because
 * a segment sliding from one end to the other and jumping back reads as a value
 * that reset.
 */
import {
  forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode,
} from 'react';
import { arcPath } from '../../charts/Radial.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './SemiCircleProgress.module.scss';

export interface SemiCircleProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  /** Omit for indeterminate. */
  value?: number;
  min?: number;
  max?: number;
  valueLabel?: string;
  /** Diameter of the full circle the half is taken from. */
  size?: number;
  hideLabel?: boolean;
  busyLabel?: string;
}

/* d3's arc measures from twelve o'clock clockwise, so a half that opens
   downwards runs from a quarter turn behind to a quarter turn ahead. */
const START = -Math.PI / 2;
const SWEEP = Math.PI;

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const SemiCircleProgress = forwardRef<HTMLDivElement, SemiCircleProgressProps>(
  function SemiCircleProgress({
    label, value, min = 0, max = 100, valueLabel, size = 140,
    hideLabel = false, busyLabel = 'Working', className, ...props
  }, ref): ReactNode {
    const id = useId();
    const [scope, play] = useMotion();
    const determinate = value !== undefined;
    const at = determinate ? clamp(value, min, max) : min;
    const fraction = max > min ? (at - min) / (max - min) : 0;
    const said = valueLabel ?? (determinate ? `${Math.round(fraction * 100)}%` : busyLabel);

    const stroke = chartGeometry.ringStroke;
    const radius = size / 2;

    const previous = useRef<number | undefined>(undefined);
    useEffect(() => {
      const moved = previous.current !== undefined && previous.current !== at;
      previous.current = determinate ? at : undefined;
      if (moved) play('progress-change');
    }, [at, determinate, play]);

    return (
      <div
        {...props}
        ref={mergeRefs(ref, scope)}
        className={cx(styles['semi'], className)}
        data-determinate={determinate ? '' : undefined}
      >
        <div
          role="progressbar"
          aria-labelledby={`${id}-label`}
          {...(determinate
            ? { 'aria-valuenow': at, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuetext': said }
            : { 'aria-valuetext': said })}
          className={styles['plot']}
          style={{ inlineSize: `${size}px`, blockSize: `${radius}px` }}
        >
          <svg
            className={styles['canvas']}
            width={size}
            height={radius}
            viewBox={`0 0 ${size} ${radius}`}
            aria-hidden="true"
          >
            <g transform={`translate(${radius},${radius})`}>
              <path className={styles['track']} d={arcPath(radius, stroke, START, START + SWEEP)} />
              <path
                className={styles['arc']}
                d={arcPath(radius, stroke, START, START + SWEEP * (determinate ? fraction : 1))}
              />
            </g>
          </svg>
        </div>
        {/* "Beside it", in the catalogue's words, so the value is rendered on the
            screen as well as announced. */}
        <p className={styles['readout']}>
          <span className={cx(styles['label'], hideLabel && styles['hidden'])} id={`${id}-label`}>
            {label}
          </span>
          <span className={styles['value']}>{said}</span>
        </p>
      </div>
    );
  },
);
