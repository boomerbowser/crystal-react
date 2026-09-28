'use client';

/* TagsInput and TokenField.
 *
 * One component, two names, because the catalogue has two entries and they differ
 * only in when a value is committed: tags are created by a delimiter as you type,
 * tokens by leaving the field. Both end as removable chips.
 *
 * Three requirements, and the third is the one that is almost always missing:
 *
 *   - **Each chip has a named remove control.** `Chip` already does that.
 *   - **Additions and removals are announced.** A chip appearing is a visual
 *     event; a live region is what makes it an event at all for somebody who
 *     cannot see it. Without this the field appears to swallow what was typed.
 *   - **Focus returns after a removal.** Removing the last chip destroys the
 *     element that had focus, and the browser then puts focus on the body — which
 *     drops a keyboard user out of the form entirely. Focus goes back to the entry
 *     field, which is where they were working.
 *
 * A duplicate is refused rather than silently dropped, and the refusal names
 * itself: "nothing happened" is the worst possible answer to a keypress.
 */
import {
  useCallback, useId, useRef, useState,
  type KeyboardEvent, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { Chip } from '../Chip/Chip.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './TagsInput.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';
import { FormValue } from '../FormField/FormValue.js';

export interface TagsInputProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: readonly string[]) => void;
  /**
   * Characters that commit a value as it is typed. Leaving the field commits too.
   * Empty means nothing commits until blur, which is the token-field behaviour.
   */
  delimiters?: readonly string[];
  /** Most values allowed. Reaching it says so rather than refusing quietly. */
  maxTags?: number;
  /** Reject a value before it is added — a validator, a length rule. */
  validate?: (value: string) => string | null;
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

function useTags({
  value, defaultValue = [], onChange, maxTags, validate,
}: Pick<TagsInputProps, 'value' | 'defaultValue' | 'onChange' | 'maxTags' | 'validate'>) {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const tags = value ?? uncontrolled;

  const set = useCallback((next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  }, [value, onChange]);

  const add = useCallback((raw: string) => {
    const candidate = raw.trim();
    if (!candidate) return true;

    /* Refused, and told why. "Nothing happened" is the worst possible answer to
       a keypress. */
    if (tags.includes(candidate)) { setRefusal(`${candidate} is already here`); return false; }
    if (maxTags !== undefined && tags.length >= maxTags) {
      setRefusal(`That is the most you can add — ${maxTags}`);
      return false;
    }
    const complaint = validate?.(candidate);
    if (complaint) { setRefusal(complaint); return false; }

    setRefusal(null);
    set([...tags, candidate]);
    setAnnouncement(`${candidate} added`);
    return true;
  }, [tags, maxTags, validate, set]);

  const remove = useCallback((tag: string) => {
    set(tags.filter((each) => each !== tag));
    setAnnouncement(`${tag} removed`);
    setRefusal(null);
  }, [tags, set]);

  return { tags, add, remove, refusal, announcement };
}

function Field({
  label, description, errorMessage, placeholder, delimiters = [',', 'Enter'],
  isDisabled = false, isInvalid, name, className, ...rest
}: TagsInputProps): React.JSX.Element {
  const { tags, add, remove, refusal, announcement } = useTags(rest);
  const [draft, setDraft] = useState('');
  const entry = useRef<HTMLInputElement | null>(null);
  const labelId = useId();
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  /* A refusal is this component saying no to a tag, which is its own business
     and not the form's. */
  const invalid = refusal ? true : validation.isInvalid;
  const shellScope = useInvalidMotion(invalid);

  const commit = () => { if (add(draft)) setDraft(''); };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (delimiters.includes(event.key)) { event.preventDefault(); commit(); return; }
    /* Backspace in an empty field removes the last chip, which is the gesture
       every field of this shape has and the one people reach for first. */
    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      event.preventDefault();
      remove(tags[tags.length - 1]!);
    }
  };

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <div
        ref={shellScope as never}
        className={cx(styles['shell'], 'cr-field-shell')}
        {...(invalid ? { 'data-invalid': true } : {})}
        onClick={() => entry.current?.focus()}
      >
        {tags.map((tag) => (
          <Chip
            key={tag}
            onRemove={() => {
              remove(tag);
              /* Removing the last chip destroys the element that had focus, and
                 the browser then focuses the body — which drops a keyboard user
                 out of the form. Focus goes where they were working. */
              entry.current?.focus();
            }}
            removeLabel={`Remove ${tag}`}
          >
            {tag}
          </Chip>
        ))}
        <input
          ref={entry}
          className={cx(styles['entry'])}
          aria-labelledby={labelId}
          aria-invalid={invalid || undefined}
          disabled={isDisabled}
          value={draft}
          placeholder={tags.length === 0 ? placeholder : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
        />
      </div>
      {/* A chip appearing is a visual event. Without this the field appears to
          swallow what was typed. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">{announcement}</VisuallyHidden>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      <FormValue name={name} value={tags} />
      {refusal ?? validation.message ? (
        <span role="alert" className={cx(styles['error'])}>{refusal ?? validation.message}</span>
      ) : null}
    </div>
  );
}

/** Values committed by a delimiter as you type. */
export function TagsInput(props: TagsInputProps): React.JSX.Element {
  return <Field {...props} />;
}

export type TokenFieldProps = Omit<TagsInputProps, 'delimiters'>;

/** Values committed when the field is left. The same anatomy, a later commit. */
export function TokenField(props: TokenFieldProps): React.JSX.Element {
  return <Field {...props} delimiters={['Enter']} />;
}
