'use client';

/* FormField, Fieldset and HelperText.
 *
 * `FormField` is the wrapper for a control this library does not ship — a
 * third-party editor, a canvas, something bespoke. Every Crystal input already
 * binds its own label and messages through React Aria; this exists so a product
 * that reaches outside the library does not have to rebuild the wiring, and get
 * it subtly wrong.
 *
 * The wiring is the whole component, and it is four things:
 *
 *   - `label` points at the control by id, so clicking it focuses the control.
 *   - `aria-describedby` points at the helper text **and** the error, because a
 *     field can have both and dropping one silently removes it from the
 *     announcement.
 *   - `aria-invalid` says so, rather than leaving it to a red border.
 *   - `aria-required` says so, rather than leaving it to an asterisk.
 *
 * **Errors are text, never colour alone.** That is the catalogue's wording and
 * the reason the error carries a mark as well as a colour. A red outline is
 * invisible to a reader who cannot distinguish it and says nothing to one who
 * cannot see it at all.
 *
 * `HelperText` is the same message element on its own, for a hint attached to
 * something that is not a field.
 */
import { cloneElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './FormField.module.scss';
import { useDistributedErrors } from './useDistributedErrors.js';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The visible label. A field without one is a field nobody can name. */
  label: ReactNode;
  /** Guidance beneath the field. Replaced by the error when there is one. */
  description?: ReactNode;
  /** The message. Supplying it marks the field invalid, so the two cannot disagree. */
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
  /** Overrides the inference from `errorMessage`, for a field invalid without a message. */
  isInvalid?: boolean;
  /**
   * The field's name in a form. Without it the field cannot be submitted, and a
   * `Form` distributing a server's errors has no name to match it against — so
   * the field sits there looking untouched while the server objects.
   */
  name?: string;
  /**
   * The control. Receives `id`, `aria-describedby`, `aria-invalid` and
   * `aria-required`, so it is wired whether or not it knows about this component.
   */
  children: ReactElement<Record<string, unknown>>;
}

export function FormField({
  label, description, errorMessage, isRequired = false, isDisabled = false,
  isInvalid, name, children, className, ...props
}: FormFieldProps): React.JSX.Element {
  const controlId = useId();
  const descriptionId = useId();
  const errorId = useId();

  /* An error message is the invalid state. Two ways to say the same thing
     eventually disagree, and the one the reader is told is the one that matters. */
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;

  /* Both, when there are both. Describing a field by only its error drops the
     guidance that would have prevented it. */
  const describedBy = [
    description ? descriptionId : null,
    validation.message ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div
      {...props}
      className={cx(styles['field'], className)}
      {...(isDisabled ? { 'data-disabled': true } : {})}
    >
      <label htmlFor={controlId} className={cx(styles['label'])}>
        {label}
        {isRequired ? <span aria-hidden="true" className={cx(styles['required'])}>*</span> : null}
      </label>
      {cloneElement(children, {
        id: controlId,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(invalid ? { 'aria-invalid': true } : {}),
        ...(isRequired ? { 'aria-required': true } : {}),
        ...(isDisabled ? { disabled: true } : {}),
      })}
      {description ? (
        <span id={descriptionId} className={cx(styles['description'])}>{description}</span>
      ) : null}
      {/* A live region, so a message that appears after submission is announced
          rather than only drawn. Errors are text with a mark, never colour. */}
      {validation.message ? (
        <span id={errorId} role="alert" className={cx(styles['error'])}>{validation.message}</span>
      ) : null}
    </div>
  );
}

export interface FieldsetProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** What the fields have in common. Rendered as a real `legend`. */
  legend: ReactNode;
  description?: ReactNode;
  /** Disabling the set disables its controls, which native `fieldset` does for free. */
  isDisabled?: boolean;
  /** Put the group on its own surface. Off by default. */
  panelled?: boolean;
  children?: ReactNode;
}

export function Fieldset({
  legend, description, isDisabled = false, panelled = false, className, children, ...props
}: FieldsetProps): React.JSX.Element {
  const descriptionId = useId();

  return (
    /* A native fieldset, so disabling the set disables every control in it
       without this component walking the tree to do it. */
    <fieldset
      {...props}
      disabled={isDisabled}
      {...(description ? { 'aria-describedby': descriptionId } : {})}
      className={cx(styles['fieldset'], panelled ? styles['panelled'] : undefined, className)}
    >
      <legend className={cx(styles['legend'])}>{legend}</legend>
      {description ? (
        <span id={descriptionId} className={cx(styles['description'])}>{description}</span>
      ) : null}
      {children}
    </fieldset>
  );
}

export interface HelperTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** An error rather than a hint. Carries a mark as well as a colour. */
  isError?: boolean;
  children?: ReactNode;
}

export function HelperText({ isError = false, className, children, ...props }: HelperTextProps): React.JSX.Element {
  return (
    <span
      {...props}
      {...(isError ? { role: 'alert' } : {})}
      className={cx(isError ? styles['error'] : styles['description'], className)}
    >
      {children}
    </span>
  );
}
