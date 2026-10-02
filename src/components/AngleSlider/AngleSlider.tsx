'use client';

/* AngleSlider and Knob.
 *
 * Two circular controls over one implementation. An angle runs 0 to 360 and
 * wraps. A knob runs between arbitrary bounds and does not. The material, the arc
 * and the keyboard contract are shared.
 *
 * React Aria's `useMove` supplies the interaction, as it does for `Resizable`. It
 * reports movement from a pointer and from the arrow keys through one interface,
 * so the keyboard path is not a second implementation. The catalogue asks that
 * "keyboard steps match the slider contract", and sharing the hook keeps that true.
 *
 * The value is also shown as text. Both catalogue entries ask for it. A dial with
 * a line on it is a number only a sighted user can estimate. `role="slider"` with
 * `aria-valuenow` makes it a number to assistive technology, and the visible
 * figure beside it is for everybody.
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { mergeProps, useMove } from 'react-aria';
import { cx } from '../../styles/cx.js';
import { SteppedValue } from '../Slider/SteppedValue.js';
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
  /** How the value reads, such as "45°" or "-6 dB". Becomes `aria-valuetext` and the figure. */
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
        /* A key press is one step. `useMove` reports arrow keys as a delta of
           one pixel, and scaling that by the pointer ratio below would move a 0
           to 100 dial by half a unit, which rounds back to where it started. */
        started.current = current + direction * step;
      } else {
        started.current += (event.deltaX - event.deltaY) * (span / 200);
      }
      set(started.current);
    },
  });

  /* `useMove` already delivers arrow keys as deltas. Home and End are the keys
     the hook does not cover, and they make a bounded control quick to set. This
     handler is merged with `moveProps`. JSX takes the last `onKeyDown` it is
     given, so setting this one after spreading the hook's props would replace
     the hook's key handling and stop the arrow keys working. */
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
          /* Points at the label already on screen. An `aria-label` copy works
             only when `label` is a string, so `<Knob label={<>Gain</>} />`, or
             an icon and a word, would leave the slider with no accessible
             name. */
          aria-labelledby={labelId}
          aria-valuenow={current}
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          /* The spoken value. Without it a dial announces a bare figure with no
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
              placement stays in CSS instead of becoming a magic number. */}
          <span
            className={cx(styles['orbit'])}
            style={{ '--cr-angle': `${angle}deg` } as CSSProperties}
          >
            <span className={cx(styles['thumb'])} />
          </span>
        </div>
        {/* The value as visible text, for everybody. */}
        <SteppedValue value={text} className={cx(styles['value'])} />
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
