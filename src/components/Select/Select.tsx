'use client';

/* Select and NativeSelect.
 *
 * Two components, because the catalogue asks for two. A native select is the
 * right answer more often than a built one. On a phone it opens the platform
 * picker (a wheel, a full-screen list), which is faster, familiar, and works with
 * every assistive technology the platform ships. A built listbox is right when
 * the options need more than text: an icon, a description, a swatch.
 * `NativeSelect` exists so the native one can be chosen as a first choice.
 *
 * `NativeSelect` never restyles its options. The catalogue says so, and browsers
 * enforce it on most platforms. Crystal owns the shell around it and keeps the
 * platform's disclosure arrow uncovered.
 *
 * `Select` is React Aria's listbox, where selection is label weight and never a
 * check mark. In Crystal a check mark means validated or informational. The
 * popover is Frost, because a transient overlay is Frost and never Resin.
 */
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import {
  Select as AriaSelect, SelectValue, Label,  ListBox, ListBoxItem,
  Text, FieldError,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldButtonShell } from '../FormField/FieldShell.js';
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

  return (
    <AriaSelect {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldButtonShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell', styles['trigger'])}>
        <SelectValue className={cx(styles['value'])}>
          {({ selectedText, isPlaceholder }) => (
            <span className={cx(isPlaceholder ? styles['placeholder'] : undefined)}>
              {isPlaceholder ? placeholder : selectedText}
            </span>
          )}
        </SelectValue>
        <span className={cx(styles['disclosure'])} aria-hidden="true">{ChevronIcon}</span>
      </FieldButtonShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      {/* Frost: a transient overlay is Frost, never Resin. */}
      <ArrivingPopover recipe="menu-in" exit="menu-out" className={cx(styles['popover'], 'cr-frost', 'cr-scroll-frost')}>
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
      </ArrivingPopover>
      </>
      )}
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
 * A real `select`. Use it whenever the options are plain text. On a phone it
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
      <div className={cx(styles['shell'], 'cr-field-shell')} {...(invalid ? { 'data-invalid': true } : {})}>
        {/* `appearance: auto` keeps the platform's own disclosure, and the
            trailing padding leaves room for it so nothing is drawn over it. */}
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
