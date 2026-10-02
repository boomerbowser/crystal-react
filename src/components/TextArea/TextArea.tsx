'use client';

/* TextArea.
 *
 * The field anatomy with a multi-line well. React Aria's TextField owns the
 * label, the description and error association and the invalid state; Crystal
 * owns the material and the motion.
 *
 * Autosize uses `field-sizing: content` instead of measuring the text in a
 * hidden element and setting a height, because the catalogue says "autosize
 * must not trap the caret". A JavaScript autosize sets `height` from a
 * measurement and has a frame where the caret is outside the visible box and
 * the browser scrolls to find it. At the end of a long paragraph that looks
 * like the field jumping. The CSS autosize has no such frame.
 *
 * The character count is announced as well as drawn, but only as the limit
 * approaches. A live region that speaks on every keystroke is unusable.
 *
 * The count uses two elements instead of switching one element's role. The
 * visible figure is `aria-hidden`. A separate, permanently mounted live region
 * carries the announcement and holds an empty string until the limit is near.
 * A live region inserted at the same moment as its content is not reliably
 * announced, because assistive technology has to be watching the node before
 * the text arrives.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import {
  TextField as AriaTextField, Label, TextArea as AriaTextArea, Text, FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldShell } from '../FormField/FieldShell.js';
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
   * the element inside it, so it is passed through explicitly. A field that
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
  const [length, setLength] = useState((props.value ?? props.defaultValue ?? '').length);

  const remaining = maxLength === undefined ? undefined : maxLength - length;
  const over = remaining !== undefined && remaining < 0;

  return (
    <AriaTextField
      {...props}
      /* Over the limit is this component's decision, so it is declared. Short of
         the limit nothing is declared and React Aria keeps validity, so a native
         constraint or a server's error still reaches the field. */
      {...declaredInvalid(over ? true : props.isInvalid, errorMessage)}
      onChange={(value) => { setLength(value.length); props.onChange?.(value); }}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* Uses the validity React Aria resolved instead of the one the caller
          declared, so a server's rejection moves the field exactly as a local
          rule would. Over the limit is this component's own judgement and is
          added to it. */}
      <FieldShell isInvalid={isInvalid || over} className={cx(styles['shell'], 'cr-field-shell')}>
        <AriaTextArea
          ref={forwardedRef}
          rows={rows}
          {...(onBlur ? { onBlur } : {})}
          className={cx(styles['control'], autosize ? styles['autosize'] : undefined)}
          {...(placeholder ? { placeholder } : {})}
        />
        {maxLength !== undefined ? (
          <>
            <span
              aria-hidden="true"
              className={cx(styles['count'], over ? styles['over'] : undefined)}
            >
              {length} / {maxLength}
            </span>
            {/* Present from mount and empty until the limit is near, so the
                announcement is a text change inside a region that was already
                being watched. Spoken as words, because a screen reader
                renders "180 / 200" as a date. */}
            <VisuallyHidden role="status" aria-live="polite">
              {remaining === undefined || remaining > 20
                ? ''
                : over
                  ? `${-remaining} characters over the limit`
                  : `${remaining} characters remaining`}
            </VisuallyHidden>
          </>
        ) : null}
      </FieldShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </AriaTextField>
  );
});
