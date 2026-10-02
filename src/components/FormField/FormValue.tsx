'use client';

/* What a hand-built field puts in the form.
 *
 * React Aria's own components render a hidden input so their value reaches
 * `FormData`, and a control built here has to do the same. Without it, a
 * `name` makes the control addressable by a `Form` distributing errors while
 * submitting nothing, so a required field fails validation, gets fixed, and
 * fails again.
 *
 * Several values become several inputs of the same name. That is how HTML
 * carries a multiple selection, and `valuesFromForm` turns them back into an
 * array. No value becomes no input, so the key is absent and not empty. That is
 * also HTML's own behaviour, and it is what the schema expects.
 */
import type { ReactNode } from 'react';

export interface FormValueProps {
  /** Absent when the field is not part of a form; then nothing is rendered. */
  name?: string | undefined;
  value: string | readonly string[];
}

export function FormValue({ name, value }: FormValueProps): ReactNode {
  if (!name) return null;
  const values = Array.isArray(value) ? value : [value as string];
  return values
    .filter((each) => each !== '')
    .map((each, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <input key={`${each}-${index}`} type="hidden" name={name} value={each} />
    ));
}
