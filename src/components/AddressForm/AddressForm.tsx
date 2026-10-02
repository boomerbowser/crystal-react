'use client';

/* AddressForm: a locale-aware address, with the country in charge.
 *
 * "**Field order, labels and required-ness change by country**; postcode
 * validation is per-locale, not one regular expression."
 *
 * The country selector is first and it is not one of the descriptor's fields.
 * That is the whole structure: everything below it is decided by what is chosen
 * in it, so a country picked last is a form filled in wrong and then rearranged
 * under the reader's hands. Changing it re-renders the fields in that country's
 * own order ("postcode, city" in one place and "city, state, ZIP" in another)
 * rather than showing every field any country might want and greying out the
 * rest.
 *
 * The country list and the descriptors are the product's. See
 * `commerce/address.ts` for why: a design system that ships a table of countries
 * has taken on a data set that is wrong the week it is written, and a wrong one
 * is invisible. The form renders, and one country's addresses stop working
 * without any error.
 *
 * Every field carries an autofill token, which is why `autoComplete` is
 * required rather than optional on the descriptor. An address form without them
 * is a form every reader types by hand every time, and it is the single largest
 * thing a checkout can do for somebody using a screen reader, a switch, or one
 * hand on a phone.
 *
 * Validation is per-field and per-locale, and its message goes on the field
 * it is about. A summary at the top saying "there are errors" is a message about
 * the form; the reader needs to know which box.
 */
import {
  forwardRef, useCallback, useState, type FormEvent, type HTMLAttributes, type ReactNode,
} from 'react';
import { TextInput } from '../TextInput/TextInput.js';
import { Select } from '../Select/Select.js';
import { cx } from '../../styles/cx.js';
import type { AddressDescriptor, AddressValue } from '../../commerce/address.js';
import styles from './AddressForm.module.scss';

export interface AddressFormProps
  extends Omit<HTMLAttributes<HTMLFormElement>, 'onChange' | 'onSubmit' | 'children'> {
  /** The countries offered, in the order they should be offered. */
  countries: readonly AddressDescriptor[];
  /** Which one is chosen, by ISO code. */
  country: string;
  onCountryChange: (country: string) => void;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  /** Errors the product knows about: a server's rejection, usually. */
  errors?: Record<string, string>;
  onSubmit?: (value: AddressValue) => void;
  /** On its way. The controls stay put and stop accepting. */
  isSubmitting?: boolean;
  countryLabel?: string;
  /** The form's own name. */
  label?: string;
  children?: ReactNode;
}

export const AddressForm = forwardRef<HTMLFormElement, AddressFormProps>(
  function AddressForm({
    countries, country, onCountryChange, value, onChange, errors = {},
    onSubmit, isSubmitting = false, countryLabel = 'Country', label = 'Address',
    children, className, ...props
  }, ref) {
    /* Per-field, and only after the reader has left the field: telling somebody
       their postcode is invalid while they are three characters into typing it
       is telling them off for not having finished. */
    const [touched, setTouched] = useState<Record<string, string>>({});

    const descriptor = countries.find((one) => one.country === country) ?? countries[0];

    const set = useCallback((name: string, next: string) => {
      onChange({ ...value, [name]: next });
    }, [onChange, value]);

    const submit = (event: FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;
      onSubmit?.(value);
    };

    return (
      <form
        {...props}
        ref={ref}
        aria-label={label}
        onSubmit={submit}
        noValidate
        className={cx(styles['form'], className)}
      >
        {/* First, and not one of the descriptor's fields: everything below is
            decided by it, so a country picked last is a form filled in wrong and
            then rearranged under the reader's hands. */}
        <Select
          label={countryLabel}
          selectedKey={country}
          onSelectionChange={(key) => onCountryChange(String(key))}
          options={countries.map((one) => ({ value: one.country, label: one.countryLabel }))}
          isDisabled={isSubmitting}
          autoComplete="country"
          className={cx(styles['country'])}
        />

        {descriptor?.fields.map((field) => {
          /* The product's error wins: it knows something this form does not. */
          const message = errors[field.name] ?? touched[field.name];
          const shared = {
            /* Named, so the form submits like one and an error summary can find
               the field its message is about. */
            name: field.name,
            label: field.label,
            isRequired: field.required ?? false,
            isDisabled: isSubmitting,
            ...(field.description === undefined ? {} : { description: field.description }),
            ...(message === undefined ? {} : { errorMessage: message, isInvalid: true }),
          };

          if (field.options) {
            return (
              /* The token goes on a select as much as on an input: a state or
                 a province is part of an address a browser can fill in, and
                 leaving it off makes autofill complete three of four fields and
                 stop, which is worse than not offering it, because the reader
                 has to find the one it missed. */
              <Select
                {...shared}
                key={field.name}
                selectedKey={value[field.name] ?? null}
                onSelectionChange={(key) => set(field.name, key === null ? '' : String(key))}
                options={[...field.options]}
                autoComplete={field.autoComplete}
                />
            );
          }

          return (
            <TextInput
              {...shared}
              key={field.name}
              value={value[field.name] ?? ''}
              onChange={(next) => set(field.name, next)}
              autoComplete={field.autoComplete}
              onBlur={() => {
                const said = field.validate?.(value[field.name] ?? '');
                setTouched((was) => {
                  const next = { ...was };
                  if (said === undefined) delete next[field.name];
                  else next[field.name] = said;
                  return next;
                });
              }}
            />
          );
        })}

        {children}
      </form>
    );
  },
);
