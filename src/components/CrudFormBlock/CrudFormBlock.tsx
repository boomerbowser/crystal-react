'use client';

/* CrudFormBlock: a create or edit form, in sections, with validation and submit.
 *
 * "Errors summarise at the top and link to their fields; submission state is
 * announced." States: `at-rest`, `validating`, `submitting`, `saved`, `error`.
 *
 * The schema and the mutation belong to the product. The block owns what
 * happens around them:
 *
 *   - Errors reach their fields and the top of the form from one object.
 *     The product hands back errors keyed by field name, in the same shape
 *     whether they come from validation or a server's rejection. React Aria's
 *     `Form` gives each named field its own message, and `ErrorSummary` lists
 *     them at the top, takes focus, and links to each. With one source, the
 *     summary and the fields cannot disagree about what is wrong.
 *   - Every submission state is said. Checking, saving, saved and failed
 *     are each announced from one polite region, and saved is also shown,
 *     because a form that saves silently gets pressed twice. A failure that
 *     belongs to no field is one alert.
 *   - Sections are Crystal's `Fieldset`. Each has a legend, so a screen reader
 *     names a field's group as the reader moves into it, and disabling a
 *     section while the form is busy disables every control in it.
 *
 * Nothing moves at rest. The form arrives with the view and does not animate
 * itself in.
 */
import type { FormEvent, ReactNode } from 'react';
import { Form } from 'react-aria-components';
import { Button } from '../Button/Button.js';
import { Fieldset } from '../FormField/FormField.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { ErrorSummary } from '../../form/ErrorSummary.js';
import { cx } from '../../styles/cx.js';
import styles from './CrudFormBlock.module.scss';

export type CrudFormState = 'at-rest' | 'validating' | 'submitting' | 'saved' | 'error';

export interface CrudFormSection {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** The section's fields. Each needs a `name`, which is how its error finds it. */
  children: ReactNode;
}

export interface CrudFormBlockProps {
  title: ReactNode;
  headingLevel?: 1 | 2 | 3;
  sections: readonly CrudFormSection[];
  /** The form's values, as the browser collects them from the named fields. */
  onSubmit: (values: FormData) => void;
  onCancel?: () => void;
  /** Field name to message. The same shape from validation or from the server. */
  errors?: Readonly<Record<string, string>>;
  state?: CrudFormState;
  /** A failure that belongs to no field. Shown in `error`. */
  errorMessage?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  savedLabel?: string;
  className?: string;
}

const SAID: Readonly<Record<CrudFormState, string>> = {
  'at-rest': '',
  validating: 'Checking',
  submitting: 'Saving',
  saved: 'Saved',
  error: 'Not saved',
};

export function CrudFormBlock({
  title, headingLevel = 2, sections, onSubmit, onCancel, errors = {}, state = 'at-rest', errorMessage,
  submitLabel = 'Save', cancelLabel = 'Cancel', savedLabel = 'Saved', className,
}: CrudFormBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const busy = state === 'validating' || state === 'submitting';

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (busy) return;
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <Form
      onSubmit={submit}
      validationErrors={errors}
      validationBehavior="aria"
      aria-busy={busy || undefined}
      data-cr-state={state}
      className={cx(styles['form'], 'cr-frost', className)}
    >
      <Heading className={cx(styles['heading'])}>{title}</Heading>
      {state === 'error' && errorMessage ? (
        <div role="alert" className={cx(styles['failure'])}>{errorMessage}</div>
      ) : null}
      <ErrorSummary errors={errors} />

      {sections.map((section) => (
        <Fieldset
          key={section.id}
          legend={section.title}
          {...(section.description ? { description: section.description } : {})}
          isDisabled={busy}
          panelled
          className={cx(styles['section'], 'cr-haze')}
        >
          {section.children}
        </Fieldset>
      ))}

      <div className={cx(styles['actions'])}>
        {state === 'saved' ? <span className={cx(styles['saved'])}>{savedLabel}</span> : null}
        {onCancel ? <Button variant="quiet" isDisabled={busy} onPress={onCancel}>{cancelLabel}</Button> : null}
        <Button type="submit" variant="primary" isDisabled={busy}>{submitLabel}</Button>
      </div>

      {/* One polite region for every submission state, present from the first frame. */}
      <VisuallyHidden role="status">{state === 'saved' ? savedLabel : SAID[state]}</VisuallyHidden>
    </Form>
  );
}
