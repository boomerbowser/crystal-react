'use client';

/* ComboBox and Autocomplete.
 *
 * Two names for one React Aria primitive with a different policy on free text.
 * The catalogue treats them separately because they promise different things. A
 * combobox has a set of values and the text is a way of finding one. An
 * autocomplete has suggestions and the text is the value. Both are
 * `role="combobox"`; only the second sets `aria-autocomplete="list"` and keeps
 * whatever was typed.
 *
 * "The list is never focus-stealing." Focus stays in the text field throughout,
 * and the highlighted row is named by `aria-activedescendant`. Any
 * implementation that moves focus into the list breaks typing, and most do.
 *
 * Empty and loading are surfaces, shown in the popover. A list that shows
 * nothing cannot be told apart from one that is still loading, or from a broken
 * field. Each state says which it is, in text.
 */
import type { ReactNode } from 'react';
import {
  ComboBox as AriaComboBox, Label, Input, Button,  ListBox, ListBoxItem,
  Text, FieldError,
  type ComboBoxProps as AriaComboBoxProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import styles from './ComboBox.module.scss';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface ComboBoxOption {
  value: string;
  label: string;
  /** Shown beneath the label and announced with it. */
  description?: ReactNode;
  isDisabled?: boolean;
}

export interface ComboBoxProps
  extends Omit<AriaComboBoxProps<ComboBoxOption>, 'className' | 'style' | 'children' | 'items'> {
  label: ReactNode;
  options: readonly ComboBoxOption[];
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** Whether a fetch is running. Said in words, not spun. */
  isLoading?: boolean;
  /** What to say when nothing matches. */
  emptyMessage?: ReactNode;
  /**
   * The product has already filtered `options`, because it fetched them or
   * filtered by something the text does not express. Off by default, which is
   * the common case. React Aria's own contains-filter is locale-aware and
   * handles the highlight, so a product that filters by substring should use it.
   */
  isFiltered?: boolean;
  className?: string;
}

function Field({
  label, options, description, errorMessage, placeholder, isLoading = false,
  emptyMessage = 'No matches', isFiltered = false, className, allowsCustomValue, ...props
}: ComboBoxProps): React.JSX.Element {

  return (
    <AriaComboBox
      {...props}
      {...(allowsCustomValue ? { allowsCustomValue } : {})}
      /* Without this, React Aria closes the popover the moment the collection is
         empty, and the "no matches" and "loading" surfaces below would never be
         seen. */
      allowsEmptyCollection
      /* `defaultItems` makes React Aria filter. `items` means the collection is
         the product's and is already filtered, so passing `items` always would
         filter nothing. `allowsEmptyCollection` keeps the popover open to say so
         when nothing matches. */
      {...(isFiltered ? { items: options } : { defaultItems: options })}
      {...declaredInvalid(props.isInvalid, errorMessage)}
      className={cx(styles['field'], className)}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        {/* Focus never leaves this input. The highlighted row is named through
            `aria-activedescendant`, which React Aria maintains. */}
        <Input className={cx(styles['control'])} {...(placeholder ? { placeholder } : {})} />
        <Button className={cx(styles['trigger'], 'cr-bare')}>{ChevronIcon}</Button>
      </FieldGroupShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <ArrivingPopover recipe="popover-in" exit="popover-out" className={cx(styles['popover'], 'cr-frost', 'cr-scroll-frost')}>
        {isLoading ? (
          /* In words. A reader who cannot see a spinner would get no sign that
             anything is happening. */
          <div role="status" aria-live="polite" className={cx(styles['state'])}>Loading suggestions</div>
        ) : (
          <ListBox
            className={cx(styles['list'])}
            renderEmptyState={() => (
              <div className={cx(styles['state'])}>{emptyMessage}</div>
            )}
          >
            {(option: ComboBoxOption) => (
              <ListBoxItem
                id={option.value}
                textValue={option.label}
                isDisabled={option.isDisabled ?? false}
                className={cx(styles['option'])}
              >
                <span>{option.label}</span>
                {option.description ? (
                  <span className={cx(styles['optionDescription'])}>{option.description}</span>
                ) : null}
              </ListBoxItem>
            )}
          </ListBox>
        )}
      </ArrivingPopover>
      </>
      )}
    </AriaComboBox>
  );
}

/** A set of values, found by typing. The text is a way in, not the value. */
export function ComboBox(props: ComboBoxProps): React.JSX.Element {
  return <Field {...props} />;
}

export type AutocompleteProps = Omit<ComboBoxProps, 'allowsCustomValue'>;

/**
 * Suggestions over free text. Whatever was typed is the value, and the list is a
 * shortcut, which is why `allowsCustomValue` is not a choice here.
 */
export function Autocomplete(props: AutocompleteProps): React.JSX.Element {
  return <Field {...props} allowsCustomValue />;
}
