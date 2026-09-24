'use client';

/* Slider and RangeSlider.
 *
 * React Aria's Slider gives it `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 * and — the one that matters most — `aria-valuetext`, so a slider whose value is
 * a price or a duration announces "£24" rather than "24". A number without its
 * unit is the difference between a usable control and a guess.
 *
 * A range slider is **two sliders with distinct names**, which the catalogue
 * states and which is not what most implementations do: one control with two
 * handles announces one value, and a reader moving the lower bound is told the
 * upper one. Each thumb announces its own bound here, because they are two
 * separate questions.
 *
 * Right-to-left is handled in two halves and both are needed. The layout mirrors
 * because everything here is logical rather than physical; the *value mapping*
 * reverses because React Aria does it — dragging left must increase the value in
 * a right-to-left locale, and no amount of CSS can express that.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Slider as AriaSlider, SliderTrack, SliderThumb, SliderOutput, Label,
  type SliderProps as AriaSliderProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import styles from './Slider.module.scss';

export interface SliderProps extends Omit<AriaSliderProps<number>, 'className' | 'style' | 'children'> {
  label: ReactNode;
  /**
   * How the value reads — `{ style: 'currency', currency: 'GBP' }`,
   * `{ style: 'unit', unit: 'hour' }`. `Intl.NumberFormat` options rather than a
   * function, deliberately: React Aria derives `aria-valuetext` from these, so
   * the figure on screen, the figure announced and the locale they are formatted
   * in all agree by construction.
   *
   * A formatting function cannot do that. The first version took one, used it for
   * the visible output only, and left the announcement as a bare number — a
   * budget slider showed £2,400 and said "2,400", which is precisely the failure
   * this component exists to prevent.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * What the thumb announces, when `Intl.NumberFormat` cannot say it.
   *
   * The narrow escape hatch from the rule above, and it is narrow on purpose:
   * the only values that need it are the ones no number format expresses, and
   * the case it was added for is a media time. `1:23` is right on the screen and
   * wrong in an announcement — a screen reader reads it as "one colon
   * twenty-three" — while `{ style: 'unit', unit: 'second' }` says "3,600
   * seconds" for an hour-long film.
   *
   * It sets `aria-valuetext` and nothing else, so the **visible** output is
   * still the formatted number and the two still describe the same value in two
   * notations rather than saying two different things. A caller reaching for
   * this to relabel an ordinary number wants `formatOptions`.
   */
  valueText?: (value: number) => string;
  /** Labels beneath the track, evenly spaced. */
  ticks?: readonly ReactNode[];
  /** Hide the numeric output. The value is still announced. */
  hideOutput?: boolean;
  className?: string;
}

/* `aria-valuetext` belongs on the `<input type="range">` React Aria renders
   inside the thumb — that input is the element with the `slider` role, and an
   attribute put on the thumb's own `<div>` lands on a wrapper nothing reads.
   React Aria owns the input's props and writes `aria-valuetext` from
   `formatOptions`, so the override is applied to the node afterwards rather
   than passed through: the value it is derived from is React's, and the write
   is idempotent. */
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
  label, formatOptions, valueText, ticks, hideOutput = false, className, ...props
}: SliderProps): React.JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  return (
    <AriaSlider
      {...props}
      {...(formatOptions ? { formatOptions } : {})}
      className={cx(styles['field'], className)}
    >
      <div className={cx(styles['header'])}>
        <Label className={cx(styles['label'])}>{label}</Label>
        {hideOutput ? null : (
          /* The same label React Aria puts in `aria-valuetext`, so the two cannot
             disagree. */
          <SliderOutput className={cx(styles['output'])}>
            {({ state }) => state.getThumbValueLabel(0)}
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
  /** What the lower bound is, for its own name — "Minimum price". */
  startLabel?: string;
  /** What the upper bound is, for its own name — "Maximum price". */
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
          {({ state }) => `${state.getThumbValueLabel(0)} – ${state.getThumbValueLabel(1)}`}
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
            {/* Two names, because they are two questions: a reader moving the
                lower bound must not be told the upper one. */}
            <SliderThumb index={0} aria-label={startLabel} className={cx(styles['thumb'])} />
            <SliderThumb index={1} aria-label={endLabel} className={cx(styles['thumb'])} />
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
