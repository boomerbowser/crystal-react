'use client';

/* QuantityStepper — a bounded integer, with both controls reachable.
 *
 * **Why this is not `NumberInput` with a different stylesheet.** The two
 * disagree about one number, and the number is the point. `NumberInput` says of
 * its own chevrons that "each is short so the pair reaches the field's height
 * together; making each 44px would make the field 88px tall", and that is right
 * for a field in a form where the arrow keys are the primary route. The
 * catalogue says of *this* one: "Pill; **both controls reach 44px**." A stepper
 * beside a price in a cart is pressed with a thumb, on a phone, next to a Remove
 * control it must not be mistaken for — so the controls sit side by side and each
 * is a full target. Same primitive underneath, opposite geometry decision, and
 * neither is a stylesheet variant of the other.
 *
 * **"A typable numeric field … not role=spinbutton."** Crystal 2.2.0's wording,
 * since Meridian ruled on R-22 on 28 September 2026. It used to read "A spin
 * button: the value is typable", and the first half of that was not available to
 * deliver. React Aria's
 * `NumberField` computes the spin-button props and then strips them — `role:
 * null`, `aria-valuenow: null`, `aria-valuemin: null`, `aria-valuemax: null` —
 * with the reason in its own source comment: "we can't focus a spin button with
 * VO". What ships is a text input with `inputmode="numeric"` and
 * `aria-roledescription="Number field"`, whose value is read as its text.
 *
 * That was a deviation from the catalogue's wording, and it was filed as R-22
 * rather than decided here, because which of the two was wrong was not a call
 * this component got to make quietly. Meridian ruled for the reachable control:
 * a role VoiceOver cannot focus is a regression of the accessible surface, and
 * the catalogue now describes what ships. What was never negotiable is the part
 * the role was there for — the value is typable, and the arrow keys step.
 *
 * **"The bounds are announced when reached."** With `aria-valuemin` and
 * `aria-valuemax` stripped, the bounds are on nothing: the live region here is
 * not a nicety over the top of the primitive, it is the only thing that conveys
 * them. Disabling a control shows a bound and does not say it — a reader who
 * cannot see it grey out presses it again and is told nothing at all.
 *
 * Announced on a *change*, never on mount: a stepper that opens at its minimum
 * has not reached anything. Nothing moves at rest, and nothing speaks at rest
 * either.
 *
 * Integers only, by `formatOptions`: the catalogue calls this "a bounded
 * integer", and two and a half of something is a different component's problem.
 */
import { forwardRef, useCallback, useState, type ReactNode } from 'react';
import {
  NumberField, Label, Input, Button, Group,
  type NumberFieldProps,
} from 'react-aria-components';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './QuantityStepper.module.scss';

export interface QuantityStepperProps
  extends Omit<NumberFieldProps, 'className' | 'style' | 'children' | 'formatOptions'> {
  /** What is being counted. Required: "2" on its own is not a quantity. */
  label: ReactNode;
  /**
   * Show the label. Off in a cart row, where the product name beside it is what
   * the quantity is *of* and a second "Quantity" on every line is noise — the
   * label is still there, and still the control's accessible name.
   */
  showLabel?: boolean;
  /** Said when the smallest value is reached. */
  atMin?: (value: number) => string;
  /** Said when the largest value is reached. */
  atMax?: (value: number) => string;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Minus = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

const Plus = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const QuantityStepper = forwardRef<HTMLInputElement, QuantityStepperProps>(
  function QuantityStepper({
    label, showLabel = true, atMin, atMax,
    decrementLabel = 'One fewer', incrementLabel = 'One more',
    onChange, minValue, maxValue, className, style, ...props
  }, forwardedRef) {
    const [reached, setReached] = useState('');

    /* On a change, so a stepper rendered at its minimum has not "reached" it.
       The catalogue's word is *reached*, and arriving somewhere is not the same
       as starting there. */
    const change = useCallback((next: number) => {
      onChange?.(next);
      if (maxValue !== undefined && next >= maxValue) {
        setReached((atMax ?? ((at) => `${at} is the largest quantity`))(next));
      } else if (minValue !== undefined && next <= minValue) {
        setReached((atMin ?? ((at) => `${at} is the smallest quantity`))(next));
      } else {
        setReached('');
      }
    }, [atMax, atMin, maxValue, minValue, onChange]);

    return (
      <NumberField
        {...props}
        {...(minValue === undefined ? {} : { minValue })}
        {...(maxValue === undefined ? {} : { maxValue })}
        onChange={change}
        /* "A bounded integer." */
        formatOptions={{ maximumFractionDigits: 0 }}
        className={cx(styles['field'], className)}
        {...(style ? { style } : {})}
      >
        <Label className={cx(styles['label'], showLabel ? undefined : styles['hidden'])}>
          {label}
        </Label>
        {/* A `Group`, which is what carries React Aria's field context to the
            three controls inside it. */}
        <Group className={cx(styles['shell'])}>
          {/* React Aria names these from the field's own label, so a page with
              four steppers does not have four buttons called "One more". */}
          <Button slot="decrement" aria-label={decrementLabel} className={cx(styles['step'], 'cr-bare')}>
            {Minus}
          </Button>
          <Input ref={forwardedRef} className={cx(styles['control'])} />
          <Button slot="increment" aria-label={incrementLabel} className={cx(styles['step'], 'cr-bare')}>
            {Plus}
          </Button>
        </Group>
        {/* Polite: a bound is a fact about what just happened, not an
            interruption. Rendered always and filled on a change, because a live
            region that arrives with its text already in it announces nothing. */}
        <VisuallyHidden role="status">{reached}</VisuallyHidden>
      </NumberField>
    );
  },
);
