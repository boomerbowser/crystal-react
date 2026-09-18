'use client';

/* AngleSlider and Knob.
 *
 * Two circular controls over one implementation: an angle runs 0–360 and wraps,
 * a knob runs between arbitrary bounds and does not. Everything else — the
 * material, the arc, the keyboard contract — is shared.
 *
 * React Aria's `useMove` supplies the interaction, as it does for `Resizable`, and
 * for the same reason: it reports movement from a pointer **and** from the arrow
 * keys through one interface, so the keyboard path is not a second implementation.
 * The catalogue asks that "keyboard steps match the slider contract", and sharing
 * the hook is how that stays true rather than being separately maintained.
 *
 * **The value is text, not only an arc.** Both catalogue entries say so, in
 * different words, because it is the failure this control always has: a dial with
 * a line on it is a picture of a number that only a sighted user can estimate, and
 * `role="slider"` with `aria-valuenow` is what makes it a number to everybody
 * else. The visible figure beside it is for everybody.
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { mergeProps, useMove } from 'react-aria';
import { cx } from '../../styles/cx.js';
import styles from './AngleSlider.module.scss';

interface DialProps {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isDisabled?: boolean;
  /** How the value reads — "45°", "-6 dB". Becomes `aria-valuetext` and the figure. */
  formatValue?: (value: number) => string;
  className?: string;
}

export type AngleSliderProps = Omit<DialProps, 'minValue' | 'maxValue'>;
export type KnobProps = DialProps;

function Dial({
  label, value, defaultValue = 0, onChange, minValue = 0, maxValue = 360,
  step = 1, isDisabled = false, formatValue, className, wraps,
}: DialProps & { wraps: boolean }): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const started = useRef(current);

  const labelId = useId();
  const span = maxValue - minValue;
  const clamp = (next: number) => (wraps
    ? ((next - minValue) % span + span) % span + minValue
    : Math.min(maxValue, Math.max(minValue, next)));

  const set = (next: number) => {
    const bounded = clamp(Math.round(next / step) * step);
    if (value === undefined) setUncontrolled(bounded);
    onChange?.(bounded);
  };

  const { moveProps } = useMove({
    onMoveStart: () => { started.current = current; },
    /* Horizontal movement and vertical movement both turn the dial, because a
       circular control has no single axis and insisting on one makes half the
       gestures do nothing. Up and right increase. */
    onMove: (event) => {
      const direction = Math.sign(event.deltaX - event.deltaY);
      if (event.pointerType === 'keyboard') {
        /* A key press is one step, not a distance. `useMove` reports arrow keys
           as a delta of one pixel, and scaling that by the pointer ratio below
           moved a 0–100 dial by half a unit — which then rounded back to where
           it started, so arrow keys did nothing at all. */
        started.current = current + direction * step;
      } else {
        started.current += (event.deltaX - event.deltaY) * (span / 200);
      }
      set(started.current);
    },
  });

  /* Arrow keys step, which `useMove` already delivers as deltas — Home and End
     are the two the hook does not cover, and they are the ones that make a
     bounded control quick to set. Merged with `moveProps` rather than written
     after it: JSX takes the last `onKeyDown` it is given, so spreading the hook's
     props and then setting this one replaced the hook's key handling outright,
     and arrow keys moved the dial not at all. */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home') { event.preventDefault(); set(minValue); }
    if (event.key === 'End') { event.preventDefault(); set(wraps ? maxValue - step : maxValue); }
  };

  const fraction = (current - minValue) / span;
  const angle = fraction * 360;
  const text = formatValue ? formatValue(current) : String(current);

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <div className={cx(styles['row'])}>
        <div
          {...(isDisabled ? {} : mergeProps(moveProps, { onKeyDown }))}
          role="slider"
          tabIndex={isDisabled ? -1 : 0}
          /* Points at the label that is already on screen, rather than at a
             copy of it. The first version wrote `aria-label` only when `label`
             was a string, so `<Knob label={<>Gain</>} />` — a fragment, an
             icon and a word, anything not a bare string — produced a slider
             with no accessible name at all. */
          aria-labelledby={labelId}
          aria-valuenow={current}
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          /* The number, spoken. Without it a dial announces a bare figure with no
             unit, which for an angle or a gain is not enough to act on. */
          aria-valuetext={text}
          aria-disabled={isDisabled || undefined}
          className={cx(styles['dial'])}
        >
          <span
            className={cx(styles['arc'])}
            style={{ '--cr-arc': `${angle}deg` } as CSSProperties}
          />
          {/* Only the angle comes from here. The rim radius is a token, so the
              placement stays in CSS rather than becoming a magic number. */}
          <span
            className={cx(styles['orbit'])}
            style={{ '--cr-angle': `${angle}deg` } as CSSProperties}
          >
            <span className={cx(styles['thumb'])} />
          </span>
        </div>
        {/* The value, for everybody. An arc is a picture of a number. */}
        <span className={cx(styles['value'])}>{text}</span>
      </div>
    </div>
  );
}

/** A circular control for an angle. Wraps at 360°. */
export function AngleSlider({ formatValue, ...props }: AngleSliderProps): React.JSX.Element {
  return (
    <Dial
      {...props}
      minValue={0}
      maxValue={360}
      wraps
      formatValue={formatValue ?? ((value) => `${value}°`)}
    />
  );
}

/** A rotary control for a bounded value. Does not wrap. */
export function Knob(props: KnobProps): React.JSX.Element {
  return <Dial {...props} wraps={false} />;
}
