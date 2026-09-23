'use client';

/* RingProgress — a circular track with a filled arc and an optional centre label.
 *
 * "Semantics shared with Progress; **the centre label is not the only
 * representation**." Both halves are load-bearing. The first means this is a
 * `progressbar` and not a decorative dial: an indeterminate ring omits the
 * value exactly as the linear one does, for the same reason. The second means
 * the number in the middle is a convenience and never the record — so the ring
 * carries a real label, the value is in `aria-valuetext`, and a ring rendered
 * with no centre label loses nothing an assistive technology needed.
 *
 * "Stroke matches the icon stroke weight family" is what the catalogue says and
 * `--cr-progress-ring-stroke` is what Crystal published for it, alongside the
 * note that a gauge is a progress ring that has been told what it is measuring.
 * One token, so the two cannot become two objects.
 *
 * The arc is `arcPath` — the same generator the radial charts use. A second
 * implementation of "an annular sector between two angles" is a second thing to
 * get wrong, and CONTRACT §1 says not to write one.
 */
import {
  forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode,
} from 'react';
import { arcPath } from '../../charts/Radial.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './RingProgress.module.scss';

export interface RingProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What is in flight. Required, and the ring's accessible name. */
  label: ReactNode;
  /** Omit for indeterminate. There is deliberately no flag beside it. */
  value?: number;
  min?: number;
  max?: number;
  valueLabel?: string;
  /** Drawn in the middle. Never the only representation of the value. */
  centre?: ReactNode;
  /** Diameter in pixels. */
  size?: number;
  state?: 'at-rest' | 'error' | 'paused';
  hideLabel?: boolean;
  busyLabel?: string;
}

const TURN = Math.PI * 2;
const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const RingProgress = forwardRef<HTMLDivElement, RingProgressProps>(function RingProgress({
  label, value, min = 0, max = 100, valueLabel, centre, size = 96,
  state = 'at-rest', hideLabel = false, busyLabel = 'Working', className, ...props
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
      className={cx(styles['ring'], className)}
      data-state={state}
      data-determinate={determinate ? '' : undefined}
    >
      <div
        role="progressbar"
        aria-labelledby={`${id}-label`}
        {...(determinate
          ? { 'aria-valuenow': at, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuetext': said }
          : { 'aria-valuetext': said })}
        className={styles['plot']}
        style={{ inlineSize: `${size}px`, blockSize: `${size}px` }}
      >
        <svg
          className={styles['canvas']}
          width={size}
          height={size}
          /* The view box is centred on the origin rather than the arcs being
             translated into it. `arcPath` draws around (0,0), and a `<g
             transform>` that moved them would put the element's user space and
             the view box a radius apart — which is where `transform-origin`
             resolves, and why the spinning arc orbited the ring instead of
             turning in it. Measured; see the appearance gate. */
          viewBox={`${-radius} ${-radius} ${size} ${size}`}
          aria-hidden="true"
        >
          <path className={styles['track']} d={arcPath(radius, stroke, 0, TURN)} />
          {/* An indeterminate ring draws a fixed sixth of the circle and spins
              it; a determinate one draws the value and does not move. */}
          <path
            className={styles['arc']}
            d={arcPath(radius, stroke, 0, determinate ? TURN * fraction : TURN / 6)}
          />
        </svg>
        {centre ? <span className={styles['centre']}>{centre}</span> : null}
      </div>
      <span
        className={cx(styles['label'], hideLabel && styles['hidden'])}
        id={`${id}-label`}
      >
        {label}
      </span>
    </div>
  );
});
