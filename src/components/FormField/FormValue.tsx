'use client';

/* What a hand-built field puts in the form.
 *
 * React Aria's own components render a hidden input so their value reaches
 * `FormData`; a control built here has to do the same, and four of them did not.
 * Giving them a `name` made them addressable by a `Form` distributing errors and
 * submitted exactly nothing, which is the worse of the two failures: a required
 * field that never submits fails validation, gets fixed, and fails again.
 *
 * Several values become several inputs of the same name, which is how HTML has
 * always carried a multiple selection and what `valuesFromForm` turns back into
 * an array. Nothing at all becomes no input, so the key is absent rather than
 * empty — again HTML's own behaviour, and again what the schema is told to
 * expect rather than something invented here.
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
