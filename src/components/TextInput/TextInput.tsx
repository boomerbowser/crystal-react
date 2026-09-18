'use client';

/* TextInput.
 *
 * React Aria's TextField owns the parts that are easy to get subtly wrong: the
 * label association, `aria-describedby` for the description and the error, the
 * invalid state, and the disabled semantics. Crystal owns the materials, the
 * focus ring and the motion.
 *
 * Motion binds to validation *state*, not to a blur handler. `field-invalid`
 * plays when the field becomes invalid however that happened — client rule,
 * server response, or form-level submission — so a field that failed on the
 * server looks exactly like one that failed locally. That is the same rule the
 * upstream engine follows, and the reason it binds to state rather than events.
 */
import { forwardRef, useEffect, useRef, type ReactNode } from 'react';
import {
  TextField as AriaTextField,
  Label,
  Input,
  Text,
  FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './TextInput.module.scss';

export interface TextInputProps extends Omit<AriaTextFieldProps, 'className' | 'style' | 'children'> {
  /** The visible label. Required: a field without one is a field nobody can name. */
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
  const shellRef = useRef<HTMLDivElement>(null);
  const play = useMotion(shellRef, { once: true });

  /* An error message is the invalid state: two ways to say the same thing would
     eventually disagree. An explicit `isInvalid` still wins if a caller sets it. */
  const invalid = props.isInvalid ?? Boolean(errorMessage);

  /* Bound to the state, not to an event. `previous` starts undefined so a field
     that mounts already invalid — a re-rendered server error — does not animate
     on arrival, which would be motion marking nothing that just changed. */
  const previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (previous.current !== undefined && previous.current !== invalid) {
      play(invalid ? 'field-invalid' : 'field-valid');
    }
    previous.current = invalid;
  }, [invalid, play]);

  const classes = cx(styles['field'], className);

  return (
    <AriaTextField
      {...props}
      isInvalid={invalid}
      className={classes}
      {...(style ? { style } : {})}
    >
      <Label className={cx(styles['label'])}>{label}</Label>
      <div
        ref={shellRef}
        className={cx(styles['shell'])}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        <Input
          ref={forwardedRef}
          className={cx(styles['input'])}
          {...(placeholder ? { placeholder } : {})}
          onFocus={() => play('field-focus')}
        />
      </div>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      {/* Rendered whether or not a message is supplied: React Aria fills it from
          native validation too, so a required field left empty still explains
          itself without the caller wiring anything. */}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </AriaTextField>
  );
});
