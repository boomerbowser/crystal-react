'use client';

/* ErrorSummary lists the problems with a form at its top, each linked to its field.
 *
 * "Errors summarise at the top and link to their fields" is the catalogue's
 * wording for the CRUD form and the checkout. It makes two promises:
 *
 *   - The reader learns there are errors without hunting for them. After a
 *     failed submission, focus moves to the summary, whose heading says how
 *     many there are, and a screen reader reads the heading and the list. Focus
 *     only, without `role="alert"`, because both would say it twice.
 *   - Each error takes the reader to the field. An entry is a link, and
 *     following it moves focus into the field it names. The field is found by
 *     its `name` inside the form, which the form already needs to submit, so the
 *     summary does not have to be told an id. A select's named element is React
 *     Aria's hidden native one, which cannot take focus, so the link goes to the
 *     select's own button beside it.
 *
 * The messages are the fields' own, so they should say what to do ("Enter a
 * postcode") instead of what went wrong in the abstract ("Invalid").
 */
import { useEffect, useId, useRef } from 'react';
import { cx } from '../styles/cx.js';
import styles from './Form.module.scss';

export interface ErrorSummaryProps {
  /** Message by field name, in the order the fields appear. Empty renders nothing. */
  errors: Readonly<Record<string, string>>;
  /** The heading, given the count. */
  title?: (count: number) => string;
  className?: string;
}

export function ErrorSummary({
  errors, title = (count) => (count === 1 ? 'There is a problem' : `There are ${String(count)} problems`), className,
}: ErrorSummaryProps): React.JSX.Element | null {
  const headingId = useId();
  const box = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors);
  const count = entries.length;

  /* Focus arrives when the errors do, after a submission found them, and again
     if the set changes, since that is a new submission's answer. Not while there
     are none. */
  const key = entries.map(([name]) => name).join('\u0000');
  useEffect(() => {
    if (count > 0) box.current?.focus();
  }, [key, count]);

  if (count === 0) return null;

  return (
    <div
      ref={box}
      tabIndex={-1}
      role="region"
      aria-labelledby={headingId}
      className={cx(styles['errorSummary'], className)}
    >
      <p id={headingId} className={cx(styles['errorSummaryTitle'])}>{title(count)}</p>
      <ul className={cx(styles['errorSummaryList'])}>
        {entries.map(([name, message]) => (
          <li key={name}>
            <a
              href={`#${name}`}
              onClick={(event) => {
                event.preventDefault();
                focusField(box.current, name);
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* The control a reader types or chooses in for the field named `name`, in the
   form the summary belongs to. */
function focusField(from: HTMLElement | null, name: string): void {
  const scope = from?.closest('form') ?? from?.ownerDocument;
  const named = scope?.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`);
  if (!named) return;
  const hidden = named.closest('[aria-hidden="true"]');
  /* React Aria's hidden native select sits in an aria-hidden wrapper beside the
     select's own button, inside the field. */
  const target = hidden
    ? hidden.parentElement?.querySelector<HTMLElement>('button') ?? null
    : named;
  target?.focus();
  target?.scrollIntoView?.({ block: 'center' });
}

