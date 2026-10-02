'use client';

/* Slider and RangeSlider.
 *
 * React Aria's Slider gives it `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 * and `aria-valuetext`. The last matters most: a slider whose value is a price or
 * a duration announces "£24" instead of "24", and a number without its unit
 * leaves the reader guessing.
 *
 * A range slider is two sliders with distinct names, as the catalogue states.
 * Most implementations differ: one control with two handles announces one value,
 * and a reader moving the lower bound is told the upper one. Here each thumb
 * announces its own bound.
 *
 * Right-to-left needs two parts. The layout mirrors because everything here is
 * logical, not physical. The value mapping reverses because React Aria reverses
 * it: dragging left must increase the value in a right-to-left locale, and CSS
 * cannot express that.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Slider as AriaSlider, SliderTrack, SliderThumb, SliderOutput, Label,
  type SliderProps as AriaSliderProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { SteppedValue } from './SteppedValue.js';
import styles from './Slider.module.scss';

export interface SliderProps extends Omit<AriaSliderProps<number>, 'className' | 'style' | 'children'> {
  label: ReactNode;
  /**
   * How the value reads, as in `{ style: 'currency', currency: 'GBP' }` or
   * `{ style: 'unit', unit: 'hour' }`. These are `Intl.NumberFormat` options, not
   * a function, because React Aria derives `aria-valuetext` from them. The figure
   * on screen, the figure announced and the locale they are formatted in then
   * always agree.
   *
   * A formatting function formats the visible output only and leaves the
   * announcement as a bare number, so a budget slider shows £2,400 and says
   * "2,400".
   */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * What the thumb announces, when `Intl.NumberFormat` cannot say it.
   *
   * A narrow exception to the rule above. Only values that no number format
   * expresses need it, and the case it was added for is a media time. `1:23` is
   * right on the screen and wrong in an announcement, where a screen reader reads
   * it as "one colon twenty-three", while `{ style: 'unit', unit: 'second' }`
   * says "3,600 seconds" for an hour-long film.
   *
   * It sets `aria-valuetext` and nothing else, so the visible output is still the
   * formatted number, and the two describe the same value in two notations. To
   * relabel an ordinary number, use `formatOptions`.
   */
  valueText?: (value: number) => string;
  /** Labels beneath the track, evenly spaced. */
  ticks?: readonly ReactNode[];
  /** Hide the numeric output. The value is still announced. */
  hideOutput?: boolean;
  /**
   * Hide the label visually. It stays the slider's accessible name. Use it for a
   * slider whose purpose its surroundings already show, as a transport's
   * scrubber and volume do.
   */
  hideLabel?: boolean;
  className?: string;
}

/* `aria-valuetext` belongs on the `<input type="range">` React Aria renders
   inside the thumb. That input is the element with the `slider` role, and an
   attribute put on the thumb's own `<div>` lands on a wrapper nothing reads.
   React Aria owns the input's props and writes `aria-valuetext` from
   `formatOptions`, so the override is applied to the node afterwards instead of
   passed through. The value it is derived from is React's, and the write is
   idempotent. */
function ValueText({ input, text }: {
  input: React.RefObject<HTMLInputElement | null>;
  text: string;
}): null {
  useEffect(() => {
    input.current?.setAttribute('aria-valuetext', text);
  }, [input, text]);
  return null;
}

export function Slider({
  label, formatOptions, valueText, ticks, hideOutput = false, hideLabel = false, className, ...props
}: SliderProps): React.JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  return (
    <AriaSlider
      {...props}
      {...(formatOptions ? { formatOptions } : {})}
      className={cx(styles['field'], className)}
    >
      {/* Hidden, not left out, because the label names the slider. With
          nothing visible in it the header takes no room, so the track is the
          whole of the control's height. */}
      <div className={cx(styles['header'], hideLabel && hideOutput ? styles['hidden'] : undefined)}>
        <Label className={cx(styles['label'], hideLabel ? styles['hidden'] : undefined)}>{label}</Label>
        {hideOutput ? null : (
          /* The same label React Aria puts in `aria-valuetext`, so the two cannot
             disagree. */
          <SliderOutput className={cx(styles['output'])}>
            {({ state }) => <SteppedValue value={state.getThumbValueLabel(0)} />}
          </SliderOutput>
        )}
      </div>
      <SliderTrack className={cx(styles['track'])}>
        {({ state }) => (
          <>
            <span
              className={cx(styles['fill'])}
              style={{ '--cr-fill-size': `${state.getThumbPercent(0) * 100}%` } as React.CSSProperties}
            />
            <SliderThumb className={cx(styles['thumb'])} {...(valueText ? { inputRef: input } : {})} />
            {valueText ? <ValueText input={input} text={valueText(state.getThumbValue(0))} /> : null}
          </>
        )}
      </SliderTrack>
      {ticks ? (
        <div className={cx(styles['ticks'])} aria-hidden="true">
          {ticks.map((tick, index) => <span key={index}>{tick}</span>)}
        </div>
      ) : null}
    </AriaSlider>
  );
}

export interface RangeSliderProps extends Omit<AriaSliderProps<number[]>, 'className' | 'style' | 'children'> {
  label: ReactNode;
  /** What the lower bound is, for its own name. For example, "Minimum price". */
  startLabel?: string;
  /** What the upper bound is, for its own name. For example, "Maximum price". */
  endLabel?: string;
  /** As `Slider`: `Intl` options, so the output and the announcement agree. */
  formatOptions?: Intl.NumberFormatOptions;
  className?: string;
}

export function RangeSlider({
  label, startLabel = 'Minimum', endLabel = 'Maximum', formatOptions, className, ...props
}: RangeSliderProps): React.JSX.Element {
  return (
    <AriaSlider
      {...props}
      {...(formatOptions ? { formatOptions } : {})}
      className={cx(styles['field'], className)}
    >
      <div className={cx(styles['header'])}>
        <Label className={cx(styles['label'])}>{label}</Label>
        <SliderOutput className={cx(styles['output'])}>
          {({ state }) => <SteppedValue value={`${state.getThumbValueLabel(0)} – ${state.getThumbValueLabel(1)}`} />}
        </SliderOutput>
      </div>
      <SliderTrack className={cx(styles['track'])}>
        {({ state }) => (
          <>
            <span
              className={cx(styles['fill'])}
              style={{
                '--cr-fill-start': `${state.getThumbPercent(0) * 100}%`,
                '--cr-fill-size': `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`,
              } as React.CSSProperties}
            />
            {/* Two names, so a reader moving the lower bound is not told the
                upper one. */}
            <SliderThumb index={0} aria-label={startLabel} className={cx(styles['thumb'])} />
            <SliderThumb index={1} aria-label={endLabel} className={cx(styles['thumb'])} />
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
