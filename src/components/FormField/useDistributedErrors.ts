'use client';

/* The errors a `Form` is distributing, for a field React Aria does not own.
 *
 * Most fields here are React Aria components, and React Aria hands them their
 * share of a `Form`'s `validationErrors` automatically. A few are not: a masked
 * input, a PIN, a tag list, a multi-select, a rich text surface and the generic
 * `FormField` wrapper. Without this hook, a server could reject a phone number
 * and such a field would look untouched, because the only error it could show
 * was one its own caller passed in.
 *
 * React Aria publishes the context its own fields read, so this hook reads the
 * same context instead of building a second route. Validation display stays
 * with React Aria, including for hand-built controls.
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
 * A caller's own `errorMessage` wins, because it is the more specific statement
 * and two messages at once would contradict each other. Failing that, the hook
 * returns whatever the enclosing `Form` was given for this `name`.
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
