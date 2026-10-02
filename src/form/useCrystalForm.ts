'use client';

/* useCrystalForm is the whole of §3.8 in one hook.
 *
 * React Hook Form is deliberately not wrapped. React Aria already owns
 * validation display, `aria-describedby` wiring and submission semantics. A
 * second form library competing with it is a known source of bugs, and the one
 * thing it would add, a value store, is a store the DOM already keeps.
 *
 * So this hook is thin. It does four things React Aria does not:
 *
 *   1. Runs a Standard Schema over the submitted values, so Zod, Valibot and
 *      ArkType all work and none of them is a dependency.
 *   2. Tracks submission as a state (idle, submitting, succeeded, failed) and
 *      publishes it as a data attribute, so the SCSS styles it and the product
 *      does not wire a spinner by hand.
 *   3. Takes a mutation of any shape with `mutateAsync`, which TanStack Query
 *      satisfies exactly and a `fetch` wrapper satisfies in four lines.
 *   4. Lands a server's errors on the same field state as a client rule, so a
 *      field looks the same however it failed.
 *
 * Native validation stays on. React Aria's `Form` only sets `noValidate` when
 * `validationBehavior` is not `'native'`, so with the default the browser
 * blocks a structurally invalid submit before this hook runs. That order is
 * intended. A field already declares `isRequired`, `minLength` and `pattern`,
 * and making the schema restate them would be the redeclaration CONTRACT §1
 * forbids, with validation rules instead of values. The browser checks shape,
 * the schema checks meaning, and the server checks truth.
 */
import { useCallback, useRef, useState, type FormEvent } from 'react';
import {
  runSchema, valuesFromForm,
  type FieldErrors, type StandardSchemaV1,
} from './standard-schema.js';

export type CrystalSubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

/**
 * Anything with a `mutateAsync`. TanStack Query's mutation object is this shape
 * already; so is `{ mutateAsync: (value) => fetch(…) }`. Neither is a dependency.
 */
export interface CrystalMutation<Value> {
  mutateAsync: (value: Value) => Promise<unknown>;
}

export interface UseCrystalFormOptions<Schema extends StandardSchemaV1> {
  /** Any Standard Schema validator. Without one, whatever the browser accepts is submitted. */
  schema?: Schema;
  /** What to do with values that passed. Runs after `mutation`, if both are given. */
  onSubmit?: (value: StandardSchemaV1.InferOutput<Schema>) => void | Promise<void>;
  /** A mutation to send the values through. */
  mutation?: CrystalMutation<StandardSchemaV1.InferOutput<Schema>>;
  /**
   * Turn a thrown error into field errors. A 422 carrying
   * `{ email: 'Already registered' }` becomes the same state a client rule
   * produces, so a field looks the same however it failed.
   * Anything this does not claim stays a form-level error.
   */
  onError?: (error: unknown) => FieldErrors | undefined | void;
  /** Empty the fields after a submission that succeeded. */
  resetOnSuccess?: boolean;
}

export interface CrystalFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  validationErrors: FieldErrors;
  'data-cr-submission': CrystalSubmissionStatus;
}

export interface CrystalForm {
  /** Spread onto `Form`, or onto a bare `<form>`, which loses only the distribution. */
  formProps: CrystalFormProps;
  status: CrystalSubmissionStatus;
  isSubmitting: boolean;
  /** Issues with no field of their own. Render these; nothing else will. */
  formErrors: string[];
  fieldErrors: FieldErrors;
  /** Whatever was thrown, unchanged, for a product that wants the original. */
  error: unknown;
  submitCount: number;
  /** Put errors on fields from outside, such as a websocket or a second request. */
  setErrors: (errors: FieldErrors, formErrors?: string[]) => void;
  reset: () => void;
}

export function useCrystalForm<Schema extends StandardSchemaV1>(
  options: UseCrystalFormOptions<Schema> = {},
): CrystalForm {
  const { schema, onSubmit, mutation, onError, resetOnSuccess = false } = options;

  const [status, setStatus] = useState<CrystalSubmissionStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(undefined);
  const [submitCount, setSubmitCount] = useState(0);

  /* A ref instead of the state, because a second submit can arrive in the same
     tick as the first (pressing Enter in a text field submits whatever the
     button is doing), and state read inside the handler would still be 'idle'. */
  const inFlight = useRef(false);

  const setErrors = useCallback((next: FieldErrors, form: string[] = []) => {
    setFieldErrors(next);
    setFormErrors(form);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setFieldErrors({});
    setFormErrors([]);
    setError(undefined);
  }, []);

  /* A server error survives until something replaces it. React Aria holds
     `validationErrors` until the prop changes, and editing a field does not
     clear one, so this handler clears that field's error. Without it, a
     rejected email stays marked wrong while the person retypes it, and only a
     second submit removes the message. */
  const handleChange = useCallback((event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement | null)?.name;
    if (!name) return;
    setFieldErrors((previous) => {
      if (!(name in previous)) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;

    const form = event.currentTarget;
    const values = valuesFromForm(form);

    inFlight.current = true;
    setStatus('submitting');
    setSubmitCount((count) => count + 1);
    setError(undefined);

    void (async () => {
      try {
        let value = values as StandardSchemaV1.InferOutput<Schema>;

        if (schema) {
          const outcome = await runSchema(schema, values);
          if (outcome.value === undefined
            && (Object.keys(outcome.fieldErrors).length > 0 || outcome.formErrors.length > 0)) {
            setErrors(outcome.fieldErrors, outcome.formErrors);
            setStatus('failed');
            return;
          }
          value = outcome.value as StandardSchemaV1.InferOutput<Schema>;
        }

        setErrors({});
        if (mutation) await mutation.mutateAsync(value);
        await onSubmit?.(value);

        setStatus('succeeded');
        if (resetOnSuccess) form.reset();
      } catch (thrown) {
        setError(thrown);
        const claimed = onError?.(thrown);
        setFieldErrors(claimed ?? {});
        /* Something went wrong and nothing said which field. A failed submit
           with no message looks like a form that silently does nothing, so the
           error is shown at form level. */
        setFormErrors(claimed && Object.keys(claimed).length > 0
          ? []
          : [thrown instanceof Error ? thrown.message : 'That could not be saved.']);
        setStatus('failed');
      } finally {
        inFlight.current = false;
      }
    })();
  }, [schema, mutation, onSubmit, onError, resetOnSuccess, setErrors]);

  return {
    formProps: {
      onSubmit: handleSubmit,
      onChange: handleChange,
      onReset: reset,
      validationErrors: fieldErrors,
      'data-cr-submission': status,
    },
    status,
    isSubmitting: status === 'submitting',
    formErrors,
    fieldErrors,
    error,
    submitCount,
    setErrors,
    reset,
  };
}
