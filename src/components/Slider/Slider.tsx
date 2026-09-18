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
import type { ReactNode } from 'react';
import {
  Slider as AriaSlider, SliderTrack, SliderThumb, SliderOutput, Label,
  type SliderProps as AriaSliderProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import styles from './Slider.module.scss';

export interface SliderProps extends Omit<AriaSliderProps<number>, 'className' | 'style' | 'children'> {
  label: ReactNode;
  /**
   * How the value reads aloud and on screen — "£24", "2 hours". A number without
   * its unit is a guess, and this becomes `aria-valuetext` as well as the output.
   */
  formatValue?: (value: number) => string;
  /** Labels beneath the track, evenly spaced. */
  ticks?: readonly ReactNode[];
  /** Hide the numeric output. The value is still announced. */
  hideOutput?: boolean;
  className?: string;
}

export function Slider({
  label, formatValue, ticks, hideOutput = false, className, ...props
}: SliderProps): React.JSX.Element {
  return (
    <AriaSlider {...props} className={cx(styles['field'], className)}>
      <div className={cx(styles['header'])}>
        <Label className={cx(styles['label'])}>{label}</Label>
        {hideOutput ? null : (
          <SliderOutput className={cx(styles['output'])}>
            {({ state }) => (formatValue ? formatValue(state.getThumbValue(0)) : state.getThumbValueLabel(0))}
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
            <SliderThumb className={cx(styles['thumb'])} />
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
  formatValue?: (value: number) => string;
  className?: string;
}

export function RangeSlider({
  label, startLabel = 'Minimum', endLabel = 'Maximum', formatValue, className, ...props
}: RangeSliderProps): React.JSX.Element {
  return (
    <AriaSlider {...props} className={cx(styles['field'], className)}>
      <div className={cx(styles['header'])}>
        <Label className={cx(styles['label'])}>{label}</Label>
        <SliderOutput className={cx(styles['output'])}>
          {({ state }) => (formatValue
            ? `${formatValue(state.getThumbValue(0))} – ${formatValue(state.getThumbValue(1))}`
            : `${state.getThumbValueLabel(0)} – ${state.getThumbValueLabel(1)}`)}
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
