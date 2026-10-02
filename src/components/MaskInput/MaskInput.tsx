'use client';

/* MaskInput.
 *
 * A field that formats as it is typed: a card number, a phone number, a date.
 * `react-imask` (MIT) does the masking because of the caret. A hand-rolled mask
 * reformats the value on change and puts the caret back where the string index
 * says, which after an inserted separator is one character off, so a digit in
 * the middle of a card number cannot be corrected.
 *
 * Two rules from the catalogue, both about what leaves the component:
 *
 *   - The raw value is what submits. The mask only displays the value. A form
 *     that receives `(555) 012-3456` where the API wants `5550123456` leaves the
 *     formatting problem to the server.
 *   - The mask never traps a screen reader. The formatted string is the field's
 *     value, so it is read as one string. A mask applied by rewriting the input
 *     on every key is read as characters interrupted by announcements of the
 *     inserted punctuation.
 */
import { forwardRef, useId, useState, type ReactNode } from 'react';
import { IMaskInput } from 'react-imask';
import { cx } from '../../styles/cx.js';
import { useFieldMotion } from '../FormField/useInvalidMotion.js';
import styles from '../TextInput/TextInput.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';

export interface MaskInputProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** The pattern, such as `'0000 0000 0000 0000'` or `'(000) 000-0000'`. `0` is a digit. */
  mask: string;
  /** The unformatted value, which is what a form receives. */
  value?: string;
  defaultValue?: string;
  /** Called with the raw value, never the formatted one. */
  onChange?: (raw: string) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  name?: string;
  className?: string;
  id?: string;
}

export const MaskInput = forwardRef<HTMLInputElement, MaskInputProps>(function MaskInput(
  {
    label, description, errorMessage, placeholder, mask, value, defaultValue = '',
    onChange, isDisabled = false, isRequired = false, isInvalid, name, className, id,
  },
  ref,
) {
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;
  const [shellScope, playField] = useFieldMotion(invalid);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const raw = value ?? uncontrolled;

  /* Derived from React's own id counter. A fallback built from the mask's
     length and the field's name gives two unnamed phone fields on one form the
     same id (`mask-14-field`), so the second label focuses the first input and
     a screen reader announces the wrong name. */
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const describedBy = [
    description ? descriptionId : null,
    validation.message ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      <label htmlFor={fieldId} className={cx(styles['label'])}>{label}</label>
      <div
        ref={shellScope as never}
        /* React's onFocus is focusin, so focus arriving at any control inside
           marks the field once with Crystal's `field-focus`. */
        onFocus={() => { void playField('field-focus'); }}
        className={cx(styles['shell'], 'cr-field-shell')}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        <IMaskInput
          id={fieldId}
          inputRef={ref}
          mask={mask}
          value={raw}
          unmask
          /* `unmask` is what makes the raw value the one that leaves: the field
             shows "(555) 012-3456" and reports "5550123456". */
          onAccept={(unmasked: string) => {
            if (value === undefined) setUncontrolled(unmasked);
            onChange?.(unmasked);
          }}
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={invalid || undefined}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
          {...(name ? { name } : {})}
          {...(placeholder ? { placeholder } : {})}
          className={cx(styles['input'])}
        />
      </div>
      {description ? (
        <span id={descriptionId} className={cx(styles['description'])}>{description}</span>
      ) : null}
      {validation.message ? (
        <span id={errorId} role="alert" className={cx(styles['error'])}>{validation.message}</span>
      ) : null}
    </div>
  );
});
