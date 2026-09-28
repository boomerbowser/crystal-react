'use client';

/* NumberInput.
 *
 * React Aria's NumberField is doing more here than it looks. A number field is
 * one of the places where the native element is genuinely worse than a built one:
 * `<input type="number">` silently drops values it cannot parse, formats
 * according to the browser rather than the locale, scrolls the value on a mouse
 * wheel over the field, and announces nothing about its bounds. React Aria gives
 * locale-aware parsing through `@internationalized/number` and arrow keys that
 * step, which is what the catalogue requires.
 *
 * What it deliberately does *not* give is the `spinbutton` role. It computes the
 * spin-button props and then strips them — `role: null`, `aria-valuenow: null`,
 * `aria-valuemin: null`, `aria-valuemax: null` — with the reason in its own
 * comment: "we can't focus a spin button with VO". What arrives instead is an
 * ordinary text input with `inputmode="numeric"` and
 * `aria-roledescription="Number field"`, and the value is read as the input's
 * text. This header used to claim the opposite, which is worth naming: a stale
 * sentence in a header is a source somebody will believe. The catalogue used to
 * ask for `role=spinbutton` too; since R-22 was ruled on 28 September 2026 it
 * asks for this — a typable numeric field whose bounds are announced.
 *
 * The steppers are pointer affordances and nothing more. Each is short so the
 * pair reaches the field's height together; making each 44px would make the field
 * 88px tall. That is not a target-size exception, because the value is always
 * reachable by the arrow keys — the route the catalogue names first.
 *
 * At a bound the stepper is disabled and says so. A control that silently refuses
 * to move is indistinguishable from one that is broken.
 */
import { forwardRef, type ReactNode } from 'react';
import {
  NumberField, Label, Input, Button, Text, FieldError,
  type NumberFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import styles from './NumberInput.module.scss';

export interface NumberInputProps extends Omit<NumberFieldProps, 'className' | 'style' | 'children'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Chevron = ({ up }: { up: boolean }) => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </svg>
);

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { label, description, errorMessage, placeholder, className, style, ...props },
  forwardedRef,
) {

  return (
    <NumberField
      {...props}
      {...declaredInvalid(props.isInvalid, errorMessage)}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        <Input
          ref={forwardedRef}
          className={cx(styles['control'])}
          {...(placeholder ? { placeholder } : {})}
        />
        <div className={cx(styles['steppers'])}>
          {/* React Aria names these from the field's own label, so they are not
              two buttons called "Increase" on a form with three number fields. */}
          <Button slot="increment" className={cx(styles['stepper'], 'cr-bare')}><Chevron up /></Button>
          <Button slot="decrement" className={cx(styles['stepper'], 'cr-bare')}><Chevron up={false} /></Button>
        </div>
      </FieldGroupShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </NumberField>
  );
});
