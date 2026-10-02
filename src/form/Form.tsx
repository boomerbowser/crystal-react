'use client';

/* Form.
 *
 * React Aria's `Form` with two things added: the submission state as a data
 * attribute, so the stylesheet can dress a form that is saving without the
 * product wiring it, and a place for the errors that belong to no field.
 *
 * A form-level error has nowhere else to go. "One of email or phone is required"
 * is true of the form and of neither field, and putting it under one of them
 * says something false. It is announced as well as drawn, because a submit that
 * fails silently looks like a button that does not work.
 */
import { type ReactNode, type Ref } from 'react';
import { Form as AriaForm, type FormProps as AriaFormProps } from 'react-aria-components';
import { cx } from '../styles/cx.js';
import type { CrystalFormProps } from './useCrystalForm.js';
import styles from './Form.module.scss';

export interface FormProps
  extends Omit<AriaFormProps, 'children' | 'className' | 'onSubmit' | 'onChange' | 'onReset' | 'validationErrors'> {
  /** `formProps` from `useCrystalForm`. */
  form: CrystalFormProps;
  /** Errors belonging to the form, not to any field. */
  formErrors?: readonly string[];
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLFormElement>;
}

export function Form({
  form, formErrors = [], children, className, ref, ...props
}: FormProps): React.JSX.Element {
  return (
    <AriaForm {...props} {...form} ref={ref} className={cx(styles['form'], className)}>
      {formErrors.length > 0 ? (
        <div role="alert" className={cx(styles['formErrors'])}>
          {formErrors.map((message) => <p key={message} className={cx(styles['formError'])}>{message}</p>)}
        </div>
      ) : null}
      {children}
    </AriaForm>
  );
}
