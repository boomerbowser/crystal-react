'use client';

/* The errors a `Form` is distributing, for a field React Aria does not own.
 *
 * Most fields here are React Aria components, and React Aria hands them their
 * share of a `Form`'s `validationErrors` without anybody asking. A handful are
 * not — a masked input, a PIN, a tag list, a multi-select, a rich text surface,
 * the generic `FormField` wrapper — and those were invisible to the whole
 * mechanism: a server could reject a phone number and the field would sit there
 * looking untouched, because the only error it knew how to show was one its own
 * caller had passed in.
 *
 * React Aria publishes the same context its own fields read, so the answer is to
 * read it rather than to build a second route to the same place. Validation
 * display is React Aria's wheelhouse; this is how a hand-built control stays
 * inside it.
 */
import { useContext, type ReactNode } from 'react';
import { FormValidationContext } from 'react-aria-components';

export interface FieldValidation {
  /** What to render beneath the field. Empty when there is nothing to say. */
  message: ReactNode;
  /** Whether the field should draw and announce itself as wrong. */
  isInvalid: boolean;
}

/**
 * A caller's own `errorMessage` wins — it is the more specific statement, and two
 * messages at once would be a field arguing with itself. Failing that, whatever
 * the enclosing `Form` was given for this `name`.
 */
export function useDistributedErrors(
  name: string | undefined,
  errorMessage: ReactNode,
  isInvalid?: boolean,
): FieldValidation {
  const distributed = useContext(FormValidationContext);

  if (errorMessage !== undefined && errorMessage !== null && errorMessage !== false) {
    return { message: errorMessage, isInvalid: isInvalid ?? true };
  }

  const forThisField = name ? distributed?.[name] : undefined;
  const messages = forThisField === undefined
    ? []
    : (Array.isArray(forThisField) ? forThisField : [forThisField]);

  if (messages.length === 0) return { message: null, isInvalid: isInvalid ?? false };
  return { message: messages.join(' '), isInvalid: isInvalid ?? true };
}
