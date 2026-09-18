'use client';

/* TextArea.
 *
 * The field anatomy with a multi-line well. React Aria's TextField owns the
 * label, the description and error association and the invalid state; Crystal
 * owns the material and the motion.
 *
 * Autosize uses `field-sizing: content` rather than measuring the text in a
 * hidden element and setting a height. The reason is the catalogue's: "autosize
 * must not trap the caret". Every JavaScript autosize sets `height` from a
 * measurement, and every one of them has a frame where the caret is outside the
 * visible box and the browser scrolls to find it — which at the end of a long
 * paragraph reads as the field jumping. The CSS one has no such frame.
 *
 * The character count is announced rather than only drawn, and only when it
 * matters: a live region that speaks on every keystroke is unusable, so it
 * announces as the limit approaches and not before.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import {
  TextField as AriaTextField, Label, TextArea as AriaTextArea, Text, FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './TextArea.module.scss';

export interface TextAreaProps extends Omit<AriaTextFieldProps, 'className' | 'style' | 'children' | 'onBlur'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** Visible rows before it grows. Ignored when autosizing is unsupported. */
  rows?: number;
  /** Grow with the content rather than scrolling. On by default. */
  autosize?: boolean;
  /** Show a character count against this limit. */
  maxLength?: number;
  /**
   * Blur of the control itself. React Aria's TextField does not forward this to
   * the element inside it, so it is passed through explicitly — a field that
   * validates on blur has nowhere else to listen.
   */
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  className?: string;
  style?: React.CSSProperties;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, description, errorMessage, placeholder, rows = 3, autosize = true, maxLength, onBlur, className, style, ...props },
  forwardedRef,
) {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);
  const [length, setLength] = useState((props.value ?? props.defaultValue ?? '').length);

  const remaining = maxLength === undefined ? undefined : maxLength - length;
  const over = remaining !== undefined && remaining < 0;

  return (
    <AriaTextField
      {...props}
      isInvalid={invalid || over}
      onChange={(value) => { setLength(value.length); props.onChange?.(value); }}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      <Label className={cx(styles['label'])}>{label}</Label>
      <div
        ref={shellScope as never}
        className={cx(styles['shell'])}
        {...(invalid || over ? { 'data-invalid': true } : {})}
      >
        <AriaTextArea
          ref={forwardedRef}
          rows={rows}
          {...(onBlur ? { onBlur } : {})}
          className={cx(styles['control'], autosize ? styles['autosize'] : undefined)}
          {...(placeholder ? { placeholder } : {})}
        />
        {maxLength !== undefined ? (
          /* Announced only as the limit approaches. A live region that speaks on
             every keystroke is a field nobody can use with a screen reader. */
          <span
            className={cx(styles['count'], over ? styles['over'] : undefined)}
            {...(remaining !== undefined && remaining <= 20
              ? { role: 'status', 'aria-live': 'polite' as const }
              : {})}
          >
            {length} / {maxLength}
          </span>
        ) : null}
      </div>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </AriaTextField>
  );
});
