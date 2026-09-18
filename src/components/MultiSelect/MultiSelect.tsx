'use client';

/* MultiSelect.
 *
 * A field whose value is a set of chips, and a listbox beneath it that toggles
 * them. The accessibility question is which of the two is the control, and the
 * answer decides everything else: **the listbox is**, and the chips are a
 * rendering of its value with their own remove buttons.
 *
 * That is why the chips are not focusable stops of their own. A field with six
 * selected values would otherwise be seven tab stops before the next field, and
 * a keyboard user tabbing through a form would walk the contents of every answer
 * they had already given. The catalogue's requirement — "removal must be
 * reachable by keyboard" — is met by each chip's remove button being reachable
 * *within* the field, not by every chip being a stop.
 *
 * The shell grows in whole line steps, because a field that grows by a fraction
 * of a line as each chip wraps makes the whole form jump.
 */
import { useState, type ReactNode } from 'react';
import {
  Select as AriaSelect, Label, Button, Popover, ListBox, ListBoxItem, Text,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { Chip } from '../Chip/Chip.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import type { SelectOption } from '../Select/Select.js';
import styles from './MultiSelect.module.scss';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface MultiSelectProps {
  label: ReactNode;
  options: readonly SelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: readonly string[]) => void;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  className?: string;
}

export function MultiSelect({
  label, options, value, defaultValue = [], onChange, description, errorMessage,
  placeholder = 'Choose any', isDisabled = false, isInvalid, className,
}: MultiSelectProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const selected = value ?? uncontrolled;
  const invalid = isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  const set = (next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const labelFor = (id: string) => options.find((option) => option.value === id)?.label ?? id;

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      {/* React Aria's Select owns the listbox, its keyboard behaviour and the
          popover; what is different here is that the trigger renders the whole
          selection rather than one value. */}
      <AriaSelect
        {...(typeof label === 'string' ? { 'aria-label': label } : {})}
        isDisabled={isDisabled}
        selectedKey={null}
        onSelectionChange={(key) => {
          const id = String(key);
          set(selected.includes(id) ? selected.filter((each) => each !== id) : [...selected, id]);
        }}
      >
        <Label className={cx(styles['label'])}>{label}</Label>
        <Button
          ref={shellScope as never}
          className={cx(styles['shell'])}
          {...(invalid ? { 'data-invalid': true } : {})}
        >
          {selected.length === 0
            ? <span className={cx(styles['placeholder'])}>{placeholder}</span>
            : selected.map((id) => (
              /* Not focusable stops of their own: six values would be six tab
                 stops before the next field. The remove control inside each is
                 what keyboard removal goes through. */
              <Chip
                key={id}
                onRemove={() => set(selected.filter((each) => each !== id))}
                removeLabel={`Remove ${typeof labelFor(id) === 'string' ? labelFor(id) : id}`}
              >
                {labelFor(id)}
              </Chip>
            ))}
          <span className={cx(styles['spacer'])} />
          <span className={cx(styles['disclosure'])} aria-hidden="true">{ChevronIcon}</span>
        </Button>
        <Popover className={cx(styles['popover'], 'cr-scroll-frost')}>
          <ListBox
            items={options}
            selectionMode="multiple"
            selectedKeys={new Set(selected)}
            onSelectionChange={(keys) => set([...keys].map(String))}
            className={cx(styles['list'])}
          >
            {(option) => (
              <ListBoxItem
                id={option.value}
                textValue={typeof option.label === 'string' ? option.label : option.value}
                isDisabled={option.isDisabled ?? false}
                className={cx(styles['option'])}
              >
                {option.label}
              </ListBoxItem>
            )}
          </ListBox>
        </Popover>
      </AriaSelect>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
    </div>
  );
}
