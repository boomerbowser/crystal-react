'use client';

/* SearchInput.
 *
 * React Aria's SearchField gives it `type="search"`, Escape to clear, and a clear
 * button that is a real named control.
 *
 * The catalogue asks for it to sit "inside a search landmark", and this component
 * leaves that to the page. A landmark is a statement about the page
 * ("this is the search for this view"). A component that emitted one on every
 * render would give a page with a header search and a filter box two search
 * landmarks, which is worse than none. `landmark` is offered, off by default, so
 * the page decides.
 *
 * The leading icon is decoration and is `aria-hidden` with pointer events off.
 * Making it pressable would put a tab stop in front of the field for something
 * that does nothing.
 *
 * Loading is announced. A spinner that only spins tells a reader who cannot see
 * it that nothing is happening, so the state is a live region as well as a mark.
 * Debounce and the results are the product's. Crystal renders the state it is
 * told about and never decides when a search has started.
 */
import { forwardRef, type ReactNode } from 'react';
import {
  SearchField, Label, Input, Button, Text, FieldError,
  type SearchFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './SearchInput.module.scss';

export interface SearchInputProps extends Omit<SearchFieldProps, 'className' | 'style' | 'children'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /**
   * Whether a search is running. It is announced as well as drawn, because a
   * spinner says nothing to a reader who cannot see it.
   */
  isLoading?: boolean;
  /**
   * Wrap the field in a `search` landmark. Off by default: a landmark is a
   * statement about the page, and two of them is worse than none.
   */
  landmark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SearchIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-4.3-4.3" />
  </svg>
);

const CrossIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, description, errorMessage, placeholder, isLoading = false, landmark = false, className, style, ...props },
  forwardedRef,
) {
  const field = (
    <SearchField
      {...props}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The field shell plays Crystal's field motion: \`field-focus\` as focus
          arrives, \`field-invalid\` and \`field-valid\` on the validity React Aria
          resolved. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        {/* Decoration: hidden from assistive technology, and not pressable. */}
        <span className={cx(styles['leadingIcon'])} aria-hidden="true">{SearchIcon}</span>
        <Input
          ref={forwardedRef}
          className={cx(styles['control'])}
          {...(placeholder ? { placeholder } : {})}
        />
        {/* React Aria names this from the field's label and hides it when the
            field is empty, so it is not a permanent control that does nothing. */}
        <Button className={cx(styles['inlineAction'], 'cr-bare')}>{CrossIcon}</Button>
      </FieldGroupShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {isLoading ? 'Searching' : ''}
      </VisuallyHidden>
      </>
      )}
    </SearchField>
  );

  return landmark ? <search>{field}</search> : field;
});
