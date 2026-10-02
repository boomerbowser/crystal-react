'use client';

/* Rating.
 *
 * Interactive, it is a radio group: five mutually exclusive values with arrow-key
 * movement and one tab stop. Read-only, it is text with a picture beside it. A
 * disabled radio group would announce "you may not change this" when the truth
 * is "this is not a control".
 *
 * Never symbol-only. That is the catalogue's rule, so the value is always text.
 * Four filled stars out of five is a picture of a number, which a reader who
 * cannot see it does not get, and which is hard to tell from five at a glance.
 *
 * A fractional symbol is one glyph clipped rather than two overlaid. Overlaying
 * doubles the stroke where the two meet, which reads as a thicker outline on the
 * partial symbol.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { RadioGroup, Radio, Label, type RadioProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './Rating.module.scss';

const StarIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 3l2.8 6.3 6.2.6-4.7 4.3 1.4 6.3L12 17.3 6.3 20.5l1.4-6.3L3 9.9l6.2-.6z" />
  </svg>
);

export interface RatingProps {
  label: ReactNode;
  /** How many symbols. Five unless a product says otherwise. */
  max?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Not a control: text with a picture beside it, and fractions are allowed. */
  isReadOnly?: boolean;
  isDisabled?: boolean;
  /** How the value reads, such as "4 out of 5" or "4.2 stars". Always rendered. */
  formatValue?: (value: number, max: number) => string;
  className?: string;
}

export function Rating({
  label, max = 5, value, defaultValue = 0, onChange, isReadOnly = false,
  isDisabled = false, formatValue, className,
}: RatingProps): React.JSX.Element {
  /* Uncontrolled unless a value is given. Passing the prop through to the radio
     group unconditionally makes every Rating fully controlled, so one given only
     a `defaultValue` could never change. */
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const text = formatValue ? formatValue(current, max) : `${current} out of ${max}`;

  const set = (next: number) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  if (isReadOnly) {
    /* Text with a picture beside it. A disabled radio group would announce "you
       may not change this", which is not what a published score means. */
    return (
      <div className={cx(styles['field'], styles['readonly'], className)}>
        <span className={cx(styles['label'])}>{label}</span>
        <div className={cx(styles['row'])}>
          <span className={cx(styles['symbols'])} aria-hidden="true">
            {Array.from({ length: max }, (_, index) => {
              const fraction = Math.min(1, Math.max(0, current - index));
              return (
                <span key={index} className={cx(styles['symbol'], styles['fraction'])}>
                  {StarIcon}
                  {fraction > 0 ? (
                    <span
                      className={cx(styles['partial'])}
                      style={{ '--cr-fraction': `${fraction * 100}%` } as CSSProperties}
                    >
                      {StarIcon}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </span>
          {/* The value, as text. Never only the symbols. */}
          <span className={cx(styles['value'])}>{text}</span>
        </div>
      </div>
    );
  }

  return (
    <RadioGroup
      value={String(current)}
      onChange={(next) => set(Number(next))}
      isDisabled={isDisabled}
      className={cx(styles['field'], className)}
    >
      <Label className={cx(styles['label'])}>{label}</Label>
      <div className={cx(styles['row'])}>
        <div className={cx(styles['symbols'])}>
          {Array.from({ length: max }, (_, index) => {
            const score = index + 1;
            return (
              <Symbol
                key={score}
                isChosen={score === current}
                value={String(score)}
                /* Each symbol says what it means, so arrowing through them
                   announces "3 out of 5" rather than "radio button, 3". */
                aria-label={formatValue ? formatValue(score, max) : `${score} out of ${max}`}
                className={cx(styles['symbol'], score <= current ? styles['filled'] : undefined)}
              >
                {StarIcon}
              </Symbol>
            );
          })}
        </div>
        <span className={cx(styles['value'])}>{text}</span>
      </div>
    </RadioGroup>
  );
}

/* One symbol. It plays `selection` when it becomes the chosen score (by a press,
   an arrow key or a value set from outside), and not on the render that shows a
   rating already given. Only the chosen symbol moves. The symbols beneath it
   change fill, which shows the value. */
function Symbol({ isChosen, ...props }: RadioProps & { isChosen: boolean }): React.JSX.Element {
  const scope = useChangeMotion(isChosen, entered('selection'));
  return <Radio ref={scope as never} {...props} />;
}
