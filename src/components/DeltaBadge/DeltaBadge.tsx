'use client';

/* DeltaBadge — a compact signed change.
 *
 * "The sign is a character, not a colour." So the sign is written, and it is
 * written properly: U+2212 MINUS SIGN for a negative, not the hyphen a keyboard
 * produces. A hyphen next to a figure is read as a hyphen by some screen readers
 * and rendered at hyphen width by every font, which is why a column of deltas
 * signed with hyphens does not line up.
 *
 * The component formats the sign rather than taking it in the string, because a
 * caller passing "-2.4%" has already made both of those mistakes and this is the
 * only place that can stop them.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { ChangeHighlight } from '../../feedback/ChangeHighlight.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './DeltaBadge.module.scss';

export interface DeltaBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The change. Its sign decides the badge's state; zero is neutral. */
  value: number;
  /**
   * How the magnitude reads. `Intl.NumberFormat` options rather than a
   * function, so the figure and the way it is announced cannot disagree — the
   * same reason `Slider` takes them.
   */
  format?: Intl.NumberFormatOptions;
  /** The locale to format in. Defaults to the reader's. */
  locale?: string;
  /** What the change is *of*, appended for assistive technology. */
  description?: ReactNode;
}

/** U+2212, not the hyphen a keyboard produces. */
const MINUS = '−';

export function deltaSign(value: number): '+' | typeof MINUS | '' {
  if (value > 0) return '+';
  if (value < 0) return MINUS;
  return '';
}

export const DeltaBadge = forwardRef<HTMLSpanElement, DeltaBadgeProps>(function DeltaBadge(
  { value, format, locale, description, className, ...props },
  ref,
) {
  const state = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  const magnitude = new Intl.NumberFormat(locale, format).format(Math.abs(value));

  return (
    <span
      {...props}
      ref={ref}
      data-state={state}
      className={cx(styles['delta'], 'cr-haze', className)}
    >
      <span aria-hidden="true">{`${deltaSign(value)}${magnitude}`}</span>
      <ChangeHighlight />
      {/* Said in words, because a synthesiser may or may not expand "+" and
          "\u2212" — and "minus two point four per cent" is what the badge means
          whether or not it does. */}
      <VisuallyHidden>
        {state === 'neutral' ? 'no change' : `${magnitude} ${state === 'positive' ? 'up' : 'down'}`}
        {description === undefined ? null : <> in {description}</>}
      </VisuallyHidden>
    </span>
  );
});
