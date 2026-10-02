'use client';

/* Progress: a determinate or indeterminate track showing work in flight.
 *
 * "role=progressbar with aria-valuenow when determinate; **indeterminate omits
 * the value rather than faking one**." A progress bar whose value is unknown
 * and which reports 30% anyway announces a measurement that nobody took. So an
 * indeterminate bar carries no `aria-valuenow`, no `aria-valuemin` and no
 * `aria-valuemax` at all, which is what the ARIA pattern specifies for an
 * indeterminate progressbar, and it is labelled "busy" in words rather than by
 * a number.
 *
 * "Never simulate progress for work that is not measurable" is the product's
 * half of the same rule, and this component cannot enforce it. It does make the
 * accurate case the default: omit `value` and you get the indeterminate bar,
 * with no way to pass a fake one by accident.
 *
 * The track is the slider's track, at Crystal's own 8px and pill radius, from
 * `component.slider.trackHeight` rather than from an 8 typed here. The catalogue
 * says "matching the slider track", so the two components must not drift and
 * share one token.
 *
 * Motion. `progress-change` plays when the value actually moves. The recipe's
 * own note is "actual progress is set first; this animation does not fabricate
 * completion", so the value is applied first and the settle is marked after
 * it. The indeterminate travel is Crystal's continuous recipe
 * `activity-travel` (D-19, 2.2.0). It runs only while the work is pending, and
 * under reduced motion the bar becomes a still, filled track that still reads
 * as busy.
 */
import {
  forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode,
} from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { useContinuous } from '../../motion/useContinuous.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Progress.module.scss';

/** The states the catalogue lists past the two the value itself expresses. */
export type ProgressState = 'at-rest' | 'error' | 'paused';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What is in flight. Required: a bar with no name reports nothing. */
  label: ReactNode;
  /**
   * How far along. Omit it for indeterminate. There is deliberately no
   * `indeterminate` flag, so "we do not know" cannot be typed alongside a number.
   */
  value?: number;
  min?: number;
  max?: number;
  /** The value in words, shown and announced. Defaults to a percentage. */
  valueLabel?: string;
  /** Stopped, or failed. Neither is a colour alone; both are said in the text. */
  state?: ProgressState;
  /** Hide the label visually. It stays the bar's accessible name. */
  hideLabel?: boolean;
  /** What an indeterminate bar says it is doing. */
  busyLabel?: string;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress({
  label, value, min = 0, max = 100, valueLabel, state = 'at-rest',
  hideLabel = false, busyLabel = 'Working', className, ...props
}, ref): ReactNode {
  const id = useId();
  const [scope, play] = useMotion();
  const determinate = value !== undefined;
  const at = determinate ? clamp(value, min, max) : min;
  const fraction = max > min ? (at - min) / (max - min) : 0;
  const said = valueLabel ?? (determinate ? `${Math.round(fraction * 100)}%` : busyLabel);
  /* Crystal's `activity-travel` while the work is pending and cannot be measured.
     Paused or failed work is not pending. The recipe moves the element by its own
     width, so it plays on a runner as wide as the track, carrying the segment.
     Played on the segment itself, a 40% bar would cross only 80% of the way. */
  const runner = useContinuous('activity-travel', !determinate && state === 'at-rest');

  /* The settle is marked after the value has been applied, and only when it
     actually changed. A recipe played on mount would be ambient movement, which
     2.0 withdrew; a recipe played on every render would be movement nobody
     caused. */
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
      className={cx(styles['progress'], className)}
      data-state={state}
      data-determinate={determinate ? '' : undefined}
    >
      <div className={cx(styles['header'], hideLabel && styles['hidden'])}>
        <span className={styles['label']} id={`${id}-label`}>{label}</span>
        <span className={styles['value']}>{said}</span>
      </div>
      <div
        role="progressbar"
        /* Named by the visible label, not by a string copied out of it. `label`
           is a `ReactNode`, and a name taken from a plain string would be lost
           silently as soon as somebody emphasised a word in the label. */
        aria-labelledby={`${id}-label`}
        /* Indeterminate carries none of the three. This is the ARIA pattern: a
           range with no position in it. */
        {...(determinate
          ? { 'aria-valuenow': at, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuetext': said }
          : { 'aria-valuetext': said })}
        className={styles['track']}
      >
        {determinate ? (
          <div className={styles['fill']} style={{ inlineSize: `${fraction * 100}%` }} />
        ) : (
          <div ref={runner as never} className={styles['runner']}>
            <div className={styles['fill']} />
          </div>
        )}
      </div>
    </div>
  );
});
