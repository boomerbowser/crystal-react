'use client';

/* NumberInput.
 *
 * React Aria's NumberField is doing more here than it looks. A number field is
 * one of the places where the native element is genuinely worse than a built one:
 * `<input type="number">` silently drops values it cannot parse, formats
 * according to the browser rather than the locale, scrolls the value on a mouse
 * wheel over the field, and announces nothing about its bounds. React Aria gives
 * a `spinbutton` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`,
 * locale-aware parsing through `@internationalized/number`, and arrow keys that
 * step — which the catalogue requires.
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
  NumberField, Label, Input, Button, Group, Text, FieldError,
  type NumberFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
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
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  return (
    <NumberField
      {...props}
      isInvalid={invalid}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group
        ref={shellScope as never}
        className={cx(styles['shell'])}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        <Input
          ref={forwardedRef}
          className={cx(styles['control'])}
          {...(placeholder ? { placeholder } : {})}
        />
        <div className={cx(styles['steppers'])}>
          {/* React Aria names these from the field's own label, so they are not
              two buttons called "Increase" on a form with three number fields. */}
          <Button slot="increment" className={cx(styles['stepper'])}><Chevron up /></Button>
          <Button slot="decrement" className={cx(styles['stepper'])}><Chevron up={false} /></Button>
        </div>
      </Group>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </NumberField>
  );
});
