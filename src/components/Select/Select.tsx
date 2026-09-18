'use client';

/* Select and NativeSelect.
 *
 * Two components because the catalogue asks for two, and the reason is worth
 * stating: **a native select is the right answer more often than a built one.**
 * On a phone it opens the platform picker — a wheel, a full-screen list — which
 * is faster, familiar, and works with every assistive technology the platform
 * ships. A built listbox is right when the options need more than text: an icon,
 * a description, a swatch. `NativeSelect` exists so choosing the native one is a
 * deliberate decision rather than a fallback.
 *
 * `NativeSelect` never restyles its options. The catalogue says so and browsers
 * enforce it anyway on most platforms; what Crystal owns is the shell around it
 * and leaving the platform's disclosure arrow uncovered.
 *
 * `Select` is React Aria's listbox, where selection is **label weight** and never
 * a check mark — in Crystal a check mark means validated or informational, and a
 * list that uses one for selection has said something else. The popover is Frost,
 * because a transient overlay is Frost and never Resin.
 */
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import {
  Select as AriaSelect, SelectValue, Label, Button, Popover, ListBox, ListBoxItem,
  Text, FieldError,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { declaredInvalid, useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './Select.module.scss';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Announced and shown beneath the label, for options that need explaining. */
  description?: ReactNode;
  isDisabled?: boolean;
}

export interface SelectProps extends Omit<AriaSelectProps<SelectOption>, 'className' | 'style' | 'children'> {
  label: ReactNode;
  options: readonly SelectOption[];
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  className?: string;
}

export function Select({
  label, options, description, errorMessage, placeholder = 'Choose one', className, ...props
}: SelectProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  return (
    <AriaSelect {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      <Label className={cx(styles['label'])}>{label}</Label>
      <Button
        ref={shellScope as never}
        className={cx(styles['shell'], styles['control'])}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        <SelectValue className={cx(styles['value'])}>
          {({ selectedText, isPlaceholder }) => (
            <span className={cx(isPlaceholder ? styles['placeholder'] : undefined)}>
              {isPlaceholder ? placeholder : selectedText}
            </span>
          )}
        </SelectValue>
        <span className={cx(styles['disclosure'])} aria-hidden="true">{ChevronIcon}</span>
      </Button>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      {/* Frost: a transient overlay is Frost, never Resin. */}
      <Popover className={cx(styles['popover'], 'cr-scroll-frost')}>
        <ListBox items={options} className={cx(styles['list'])}>
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
  );
}

export interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * A real `select`. Right whenever the options are plain text — on a phone it
 * opens the platform picker, which is faster and works with everything.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { label, description, errorMessage, className, children, id, ...props },
  ref,
) {
  const invalid = Boolean(errorMessage);

  return (
    <div className={cx(styles['field'], className)}>
      <label htmlFor={id} className={cx(styles['label'])}>{label}</label>
      <div className={cx(styles['shell'])} {...(invalid ? { 'data-invalid': true } : {})}>
        {/* `appearance: auto` keeps the platform's own disclosure, and the
            trailing padding leaves room for it rather than drawing over it. */}
        <select
          {...props}
          id={id}
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cx(styles['control'], styles['native'])}
        >
          {children}
        </select>
      </div>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
    </div>
  );
});
