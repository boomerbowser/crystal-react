'use client';

/* TextInput.
 *
 * React Aria's TextField owns the parts that are easy to get subtly wrong: the
 * label association, `aria-describedby` for the description and the error, the
 * invalid state, and the disabled semantics. Crystal owns the materials, the
 * focus ring and the motion.
 *
 * Motion binds to validation state instead of a blur handler. `field-invalid`
 * plays when the field becomes invalid by any route (a client rule, a server
 * response or a form-level submission), so a field that failed on the server
 * looks exactly like one that failed locally. The upstream engine follows the
 * same rule.
 */
import { forwardRef, type ReactNode } from 'react';
import {
  TextField as AriaTextField,
  Label,
  Input,
  Text,
  FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { FieldShell } from '../FormField/FieldShell.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import styles from './TextInput.module.scss';

export interface TextInputProps extends Omit<AriaTextFieldProps, 'className' | 'style' | 'children'> {
  /** The visible label. Required, because a field without one has no name. */
  label: ReactNode;
  /** Helper text, associated with the field through `aria-describedby`. */
  description?: ReactNode;
  /**
   * The error message. Supplying it marks the field invalid, so the message and
   * the state cannot disagree.
   */
  errorMessage?: ReactNode;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, description, errorMessage, placeholder, className, style, ...props },
  forwardedRef,
) {
  const classes = cx(styles['field'], className);

  return (
    <AriaTextField
      {...props}
      /* Declared only when the caller has decided. A defined `isInvalid` takes
         validity away from React Aria, and with it every error a `Form` was
         given to distribute. See `declaredInvalid`. */
      {...declaredInvalid(props.isInvalid, errorMessage)}
      className={classes}
      {...(style ? { style } : {})}
    >
      {({ isInvalid }) => (
        <>
          <Label className={cx(styles['label'])}>{label}</Label>
          {/* Uses the validity React Aria resolved instead of the one the caller
              declared, so a server's rejection moves the field exactly as a
              local rule would. */}
          <FieldShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
            <Input
              ref={forwardedRef}
              className={cx(styles['input'])}
              {...(placeholder ? { placeholder } : {})}
            />
          </FieldShell>
          {description ? (
            <Text slot="description" className={cx(styles['description'])}>{description}</Text>
          ) : null}
          {/* Rendered whether or not a message is supplied. React Aria also fills
              it from native validation and from a `Form`'s errors, so a required
              field left empty explains itself without the caller wiring
              anything. */}
          <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
        </>
      )}
    </AriaTextField>
  );
});
