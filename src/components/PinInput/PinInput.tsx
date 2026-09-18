'use client';

/* PinInput.
 *
 * A row of single-character wells that advance as they are filled. There is no
 * React Aria primitive for this, so the keyboard behaviour is built here — and
 * the catalogue names the three parts that are always missing from a hand-rolled
 * one:
 *
 *   - **Paste must fill the whole value.** A code arrives from a text message and
 *     is pasted as one string. A row of six inputs that each take one character
 *     turns that into one character in the first box, which is the single most
 *     common complaint about this pattern.
 *   - **Backspace must move back.** Deleting in an empty box moves to the
 *     previous one and deletes there; otherwise correcting a typo means clicking.
 *   - **One labelled group.** Six inputs each announced as "digit" is six fields;
 *     the group is what says "verification code, six characters".
 *
 * Arrow keys move between the wells too, because a person who wants to change the
 * third character should not have to delete the fourth, fifth and sixth.
 */
import { useCallback, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './PinInput.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';

export interface PinInputProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** How many characters. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once the last character is entered. */
  onComplete?: (value: string) => void;
  /** Hide the characters, for a one-time code that is also a secret. */
  isMasked?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  /**
   * The field's name in a form. Without it the field cannot be submitted, and a
   * `Form` distributing a server's errors has no name to match it against — so
   * the field sits there looking untouched while the server objects.
   */
  name?: string;
  className?: string;
}

export function PinInput({
  label, description, errorMessage, length = 6, value, defaultValue = '',
  onChange, onComplete, isMasked = false, isDisabled = false, isInvalid, name, className,
}: PinInputProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = (value ?? uncontrolled).slice(0, length);
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;
  const shellScope = useInvalidMotion(invalid);

  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const commit = useCallback((next: string) => {
    const bounded = next.slice(0, length);
    if (value === undefined) setUncontrolled(bounded);
    onChange?.(bounded);
    if (bounded.length === length) onComplete?.(bounded);
  }, [length, value, onChange, onComplete]);

  const focusCell = (index: number) => {
    cells.current[Math.min(length - 1, Math.max(0, index))]?.focus();
  };

  const setCharacter = (index: number, character: string) => {
    const characters = current.padEnd(length, ' ').split('');
    characters[index] = character;
    commit(characters.join('').trimEnd());
    if (character) focusCell(index + 1);
  };

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      /* Empty box: step back and delete there. Otherwise correcting a typo means
         reaching for the pointer. */
      if (!current[index] && index > 0) {
        setCharacter(index - 1, '');
        focusCell(index - 1);
      } else {
        setCharacter(index, '');
        focusCell(index);
      }
      return;
    }
    if (event.key === 'ArrowLeft') { event.preventDefault(); focusCell(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); focusCell(index + 1); }
  };

  /* A code arrives as one string. Six boxes that each take one character turn a
     paste into one character, which is the complaint this pattern always draws. */
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\s/g, '').slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusCell(pasted.length);
  };

  const describedBy = [
    description ? descriptionId : null,
    validation.message ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      {/* One group, so the row is announced as one field of N characters rather
          than as N fields each called "digit". */}
      <div
        ref={shellScope as never}
        role="group"
        aria-labelledby={labelId}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        className={cx(styles['wells'])}
      >
        {Array.from({ length }, (_, index) => (
          <div key={index} className={cx(styles['well'])} {...(invalid ? { 'data-invalid': true } : {})}>
            <input
              ref={(node) => { cells.current[index] = node; }}
              className={cx(styles['cell'])}
              type={isMasked ? 'password' : 'text'}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={isDisabled}
              aria-label={`Character ${index + 1} of ${length}`}
              value={current[index] ?? ''}
              onChange={(event) => setCharacter(index, event.target.value.slice(-1))}
              onKeyDown={onKeyDown(index)}
              onPaste={onPaste}
            />
          </div>
        ))}
      </div>
      {description ? (
        <span id={descriptionId} className={cx(styles['description'])}>{description}</span>
      ) : null}
      {validation.message ? (
        <span id={errorId} role="alert" className={cx(styles['error'])}>{validation.message}</span>
      ) : null}
    </div>
  );
}
