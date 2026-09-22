'use client';

/* Indicator — a small circular mark attached to a control, carrying state.
 *
 * Every word of "the real control supplies the state; the mark only shows it" is
 * load-bearing. The indicator is `aria-hidden` and is never a click target: it
 * sits beside or on a checkbox, a field, a tab — and that control already carries
 * `aria-checked`, `aria-invalid`, `aria-current` or `aria-busy`. A mark that
 * announced anything would say it twice, and a mark that could be pressed would
 * be a second control for the same thing.
 *
 * The vocabulary is the catalogue's, and one entry is missing on purpose: there
 * is no check mark in it. "Selection resolves to label weight, not a badge." The
 * `selection` state here is the *dot* a strip draws under a selected tab, which
 * is a position rather than a mark beside a label — a leading mark sits inside
 * the control and offsets the very label it points at.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Indicator.module.scss';

/** The states the catalogue lists. There is no check mark in this vocabulary. */
export type IndicatorState =
  | 'selection' | 'current' | 'busy'
  | 'field-idle' | 'field-focused' | 'required' | 'invalid';

export interface IndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Which state the control beside it is in. */
  state: IndicatorState;
  /** Take the field size — 24px rather than 20px. */
  onField?: boolean;
}

export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(function Indicator(
  { state, onField = false, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      /* The control says what this means. The mark only shows it. */
      aria-hidden="true"
      data-state={state}
      className={cx(styles['indicator'], onField ? styles['onField'] : undefined, className)}
    />
  );
});
