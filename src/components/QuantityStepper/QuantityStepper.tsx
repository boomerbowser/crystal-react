'use client';

/* QuantityStepper: a bounded integer, with both controls reachable.
 *
 * It differs from `NumberInput` in the size of its controls. `NumberInput` says
 * of its own chevrons that "each is short so the pair reaches the field's height
 * together; making each 44px would make the field 88px tall", which suits a
 * field in a form where the arrow keys are the primary route. The catalogue says
 * of this one: "Pill; both controls reach 44px." A stepper beside a price in a
 * cart is pressed with a thumb, on a phone, next to a Remove control it must not
 * be mistaken for. The controls sit side by side and each is a full target. The
 * primitive underneath is the same; the geometry is not a stylesheet variant.
 *
 * "A typable numeric field … not role=spinbutton." This is Crystal 2.2.0's
 * wording, after Meridian ruled on R-22 on 28 September 2026. React Aria's
 * `NumberField` computes the spin-button props and then strips them (`role:
 * null`, `aria-valuenow: null`, `aria-valuemin: null`, `aria-valuemax: null`),
 * with the reason in its own source comment: "we can't focus a spin button with
 * VO". What ships is a text input with `inputmode="numeric"` and
 * `aria-roledescription="Number field"`, whose value is read as its text.
 * Meridian ruled for the reachable control, because a role VoiceOver cannot
 * focus is a regression of the accessible surface. The value is typable and the
 * arrow keys step.
 *
 * "The bounds are announced when reached." With `aria-valuemin` and
 * `aria-valuemax` stripped, the live region here is the only thing that conveys
 * the bounds. Disabling a control shows a bound but does not say it; a reader
 * who cannot see it grey out would press it again and be told nothing.
 *
 * The bound is announced on a change, never on mount. A stepper that opens at
 * its minimum has not reached anything.
 *
 * Integers only, through `formatOptions`: the catalogue calls this "a bounded
 * integer".
 */
import { forwardRef, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  NumberField, NumberFieldStateContext, Label, Input, Button, Group,
  type NumberFieldProps,
} from 'react-aria-components';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import styles from './QuantityStepper.module.scss';

export interface QuantityStepperProps
  extends Omit<NumberFieldProps, 'className' | 'style' | 'children' | 'formatOptions'> {
  /** What is being counted. Required: "2" on its own is not a quantity. */
  label: ReactNode;
  /**
   * Show the label. Off in a cart row, where the product name beside it says
   * what the quantity is of. The hidden label is still the control's accessible
   * name.
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
       The catalogue's word is reached. */
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
        {/* A `Group` carries React Aria's field context to the three controls
            inside it. */}
        <Group className={cx(styles['shell'], 'cr-field-shell')}>
          {/* React Aria names these from the field's own label, so a page with
              four steppers does not have four buttons called "One more". */}
          <Button slot="decrement" aria-label={decrementLabel} className={cx(styles['step'], 'cr-bare')}>
            {Minus}
          </Button>
          <SteppedInput inputRef={forwardedRef} className={cx(styles['control'])} />
          <Button slot="increment" aria-label={incrementLabel} className={cx(styles['step'], 'cr-bare')}>
            {Plus}
          </Button>
        </Group>
        {/* Polite, because a bound reports what just happened. Always rendered
            and filled on a change, because a live region that arrives with its
            text already in it announces nothing. */}
        <VisuallyHidden role="status">{reached}</VisuallyHidden>
      </NumberField>
    );
  },
);

/* The quantity. It marks a committed change (from a step button, an arrow key or
   a typed value) with Crystal's \`slider-step\`, and does not mark the render
   that shows the first quantity. React Aria's number field state is read from
   its context, so the input moves on the value React Aria committed. */
function SteppedInput({ inputRef, className }: {
  inputRef: React.ForwardedRef<HTMLInputElement>;
  className: string;
}): React.JSX.Element {
  const state = useContext(NumberFieldStateContext);
  const scope = useChangeMotion(state?.numberValue, () => 'slider-step', { once: true });
  return <Input ref={mergeRefs<HTMLInputElement>(inputRef, scope as never)} className={className} />;
}
