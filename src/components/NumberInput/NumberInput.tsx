'use client';

/* NumberInput.
 *
 * Built on React Aria's NumberField, because the native element is worse here.
 * `<input type="number">` silently drops values it cannot parse, formats
 * according to the browser instead of the locale, scrolls the value on a mouse
 * wheel over the field, and announces nothing about its bounds. React Aria gives
 * locale-aware parsing through `@internationalized/number` and arrow keys that
 * step, which is what the catalogue requires.
 *
 * React Aria does not give the `spinbutton` role, and that is its decision. It
 * computes the spin-button props and then strips them (`role: null`,
 * `aria-valuenow: null`, `aria-valuemin: null`, `aria-valuemax: null`), with
 * the reason in its own comment: "we can't focus a spin button with VO". The
 * result is an ordinary text input with `inputmode="numeric"` and
 * `aria-roledescription="Number field"`, and the value is read as the input's
 * text. Until R-22 was ruled on 28 September 2026 the catalogue asked for
 * `role=spinbutton`. It now asks for a typable numeric field whose bounds are
 * announced.
 *
 * The steppers are pointer affordances only. Each is short so the pair reaches
 * the field's height together. Making each 44px would make the field 88px tall.
 * This is not a target-size exception, because the arrow keys, the route the
 * catalogue names first, always reach the value.
 *
 * At a bound the stepper is disabled and says so. A control that silently
 * refuses to move cannot be told apart from a broken one.
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
      {/* The validity React Aria resolved, which can differ from the one the
          caller declared, so a server's rejection moves the field exactly as a
          local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        <Input
          ref={forwardedRef}
          className={cx(styles['control'])}
          {...(placeholder ? { placeholder } : {})}
        />
        <div className={cx(styles['steppers'])}>
          {/* React Aria names these from the field's own label, so a form with
              three number fields does not have several buttons all called
              "Increase". */}
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
