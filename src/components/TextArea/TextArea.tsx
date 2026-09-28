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
 *
 * It does that with two elements rather than by switching one element's role.
 * The visible figure is `aria-hidden`; a separate, permanently mounted live
 * region carries the announcement and holds an empty string until the limit is
 * near. A live region that is *inserted* at the same moment as its content is
 * not reliably announced — the assistive technology has to have been watching
 * the node before the text arrives — which is what the first version did.
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
  const [length, setLength] = useState((props.value ?? props.defaultValue ?? '').length);

  const remaining = maxLength === undefined ? undefined : maxLength - length;
  const over = remaining !== undefined && remaining < 0;

  return (
    <AriaTextField
      {...props}
      /* Over the limit is a decision this component has made, so it is said; short
         of that nothing is said, and React Aria keeps validity — which is how a
         native constraint or a server's error still reaches the field. */
      {...declaredInvalid(over ? true : props.isInvalid, errorMessage)}
      onChange={(value) => { setLength(value.length); props.onChange?.(value); }}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. Over
          the limit is this component's own judgement and is added to it. */}
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
                being watched. Spoken as words rather than as "180 / 200",
                which a reader renders as a date. */}
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
