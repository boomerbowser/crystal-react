'use client';

/* JsonInput.
 *
 * A textarea that validates and formats JSON. The whole component is one
 * accessibility rule from the catalogue: **parse errors are described in text and
 * associated with the field.**
 *
 * A red border on a syntax error tells the reader something is wrong and nothing
 * about what. `JSON.parse` already produces a message naming the position — "Unexpected
 * token } in JSON at position 41" — and passing that through is the difference
 * between a field a person can fix and one they have to stare at. It is
 * associated through the field's own error message, so it is announced rather
 * than only drawn.
 *
 * Validation is on **blur**, not on every keystroke. JSON is invalid for almost
 * the whole time it is being typed, and a field that reports an error after every
 * character is a field shouting at somebody who is halfway through a sentence.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { TextArea } from '../TextArea/TextArea.js';
import { Button } from '../Button/Button.js';

export interface JsonInputProps {
  label: ReactNode;
  description?: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called with the parsed value whenever the text is valid JSON. */
  onValidChange?: (parsed: unknown) => void;
  /** Offer a control that reformats the value. */
  formattable?: boolean;
  /** Indent width for the formatter. */
  indent?: number;
  rows?: number;
  isDisabled?: boolean;
  className?: string;
}

export function JsonInput({
  label, description, value, defaultValue = '', onChange, onValidChange,
  formattable = true, indent = 2, rows = 8, isDisabled = false, className,
}: JsonInputProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const text = value ?? uncontrolled;

  const set = useCallback((next: string) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  }, [value, onChange]);

  /* On blur rather than on change: JSON is invalid for almost the whole time it
     is being typed, and reporting that after every character is noise. */
  const validate = useCallback(() => {
    if (!text.trim()) { setError(null); return; }
    try {
      /* Parsed before the callback, not inside it. `onValidChange?.(JSON.parse(text))`
         looks equivalent and is not: optional call short-circuits its arguments,
         so with no callback attached the parse never ran — a JsonInput with no
         `onValidChange` silently validated nothing. The test is what found it. */
      const parsed: unknown = JSON.parse(text);
      onValidChange?.(parsed);
      setError(null);
    } catch (parseError) {
      /* The parser's own message names the position. Replacing it with "Invalid
         JSON" throws away the only part that helps. */
      setError(parseError instanceof Error ? parseError.message : 'That is not valid JSON.');
    }
  }, [text, onValidChange]);

  const format = useCallback(() => {
    try {
      set(JSON.stringify(JSON.parse(text), null, indent));
      setError(null);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'That is not valid JSON.');
    }
  }, [text, indent, set]);

  return (
    <div className={className}>
      <TextArea
        label={label}
        {...(description ? { description } : {})}
        {...(error ? { errorMessage: error } : {})}
        value={text}
        onChange={set}
        onBlur={validate}
        rows={rows}
        autosize={false}
        isDisabled={isDisabled}
      />
      {formattable ? (
        <Button variant="quiet" onPress={format} isDisabled={isDisabled || !text.trim()}>
          Format
        </Button>
      ) : null}
    </div>
  );
}
