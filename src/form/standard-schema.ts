/* Standard Schema, version 1. The types only.
 *
 * https://standardschema.dev · the specification is frozen at version 1.
 *
 * Declared here instead of depended on. `@standard-schema/spec` ships exactly
 * this interface and nothing else. A package in the dependency tree for twenty
 * lines of frozen type is one more thing a consumer resolves, audits and keeps
 * in step, for no runtime benefit.
 *
 * Zod, Valibot, ArkType and anything else implementing `~standard` work here
 * unchanged, and none of them is a dependency of this library. The product
 * picks its validator, not Crystal.
 */

/** A validator that speaks Standard Schema v1. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => StandardSchemaV1.Result<Output> | Promise<StandardSchemaV1.Result<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}

export declare namespace StandardSchemaV1 {
  type Result<Output> = SuccessResult<Output> | FailureResult;
  interface SuccessResult<Output> { readonly value: Output; readonly issues?: undefined }
  interface FailureResult { readonly issues: ReadonlyArray<Issue> }
  interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }
  interface PathSegment { readonly key: PropertyKey }
  type InferOutput<Schema extends StandardSchemaV1> =
    NonNullable<Schema['~standard']['types']> extends { output: infer Output } ? Output : unknown;
}

/** Errors keyed by field name, in the shape React Aria's `Form` distributes. */
export type FieldErrors = Record<string, string[]>;

export interface SchemaOutcome<Output> {
  readonly value?: Output;
  /** Keyed by field name, such as `address.city` for a nested issue. */
  readonly fieldErrors: FieldErrors;
  /** Issues with no path: the form is wrong, no single field is. */
  readonly formErrors: string[];
}

/**
 * Run a schema and sort its issues into the two kinds a form has.
 *
 * An issue's `path` is a mix of bare keys and `{ key }` segments. Both forms are
 * in the specification and vendors differ, so both are normalised. An issue with
 * no path belongs to the form, not a field. A rule like "one of these two must be
 * filled in" is about the form, and under a field the message would explain
 * nothing.
 */
export async function runSchema<Schema extends StandardSchemaV1>(
  schema: Schema,
  input: unknown,
): Promise<SchemaOutcome<StandardSchemaV1.InferOutput<Schema>>> {
  const result = await schema['~standard'].validate(input);

  if (!result.issues) {
    return { value: result.value as StandardSchemaV1.InferOutput<Schema>, fieldErrors: {}, formErrors: [] };
  }

  const fieldErrors: FieldErrors = {};
  const formErrors: string[] = [];

  for (const issue of result.issues) {
    const name = (issue.path ?? [])
      .map((segment) => String(
        typeof segment === 'object' && segment !== null && 'key' in segment ? segment.key : segment,
      ))
      .join('.');

    if (name === '') formErrors.push(issue.message);
    else (fieldErrors[name] ??= []).push(issue.message);
  }

  return { fieldErrors, formErrors };
}

/**
 * A form's values, as the browser reports them.
 *
 * No coercion. `FormData` yields strings and `File`s, a repeated name becomes an
 * array, and an unchecked checkbox is absent instead of `false`, which is how
 * HTML has always worked. Turning `"3"` into `3` or an absent checkbox into
 * `false` is the schema's job (`z.coerce.number()`,
 * `v.pipe(v.string(), v.transform(Number))`). Doing it here would mean guessing
 * at a type the schema already states.
 */
export function valuesFromForm(form: HTMLFormElement): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const [name, value] of new FormData(form).entries()) {
    if (!(name in values)) { values[name] = value; continue; }
    const existing = values[name];
    if (Array.isArray(existing)) existing.push(value);
    else values[name] = [existing, value];
  }
  return values;
}
