'use client';

/* Chip.
 *
 * A compact pill for a value, a filter or a selection. Three shapes in one
 * component, and the accessibility differs for each:
 *
 *   - **Static** — a label. Not a control, not focusable, nothing announced
 *     beyond its text. A chip that merely displays a value must not be a tab stop.
 *   - **Selectable** — `aria-pressed`, which the catalogue names. Not
 *     `aria-selected`: that belongs inside a listbox or a tablist, and outside one
 *     it tells a screen reader the chip is part of a collection it is not in.
 *   - **Removable** — the remove control is a **separate named button**, because
 *     "remove" and "select" are two different actions on the same object. A chip
 *     that removes itself when pressed cannot also be selected, and one whose
 *     remove is a decorated span cannot be reached by keyboard at all.
 *
 * A chip that is **both** selectable and removable is a container with two
 * buttons inside it, not a button containing a button. Nesting them is invalid
 * HTML and, more to the point, unusable: a button inside a button is one control
 * to the accessibility tree and to the pointer, so the remove target and the
 * select target fight over every press. The story is what showed it — the nested
 * control rendered 48px tall inside a 32px chip.
 *
 * Selection is label weight here as everywhere in Crystal; the soft fill is the
 * second signal rather than the only one.
 */
import { forwardRef, type ReactNode } from 'react';
import { ToggleButton, Button, type ToggleButtonProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import styles from './Chip.module.scss';

const CrossIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export interface ChipProps extends Omit<ToggleButtonProps, 'className' | 'style' | 'children'> {
  children?: ReactNode;
  /**
   * Makes the chip selectable. Without it the chip is a label: not focusable,
   * and not announced as a control.
   */
  isSelectable?: boolean;
  /** Called when the remove control is pressed. Its presence adds the control. */
  onRemove?: () => void;
  /** What removing does, for the control's name — "Remove the London filter". */
  removeLabel?: string;
  className?: string;
}

export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  { children, isSelectable = false, onRemove, removeLabel, className, ...props },
  ref,
) {
  const remove = onRemove ? (
    /* Its own button with its own name: "remove" and "select" are two actions on
       one object, and a decorated span is reachable by neither keyboard nor
       screen reader. */
    <Button
      aria-label={removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')}
      onPress={onRemove}
      className={cx(styles['remove'], 'cr-bare')}
    >
      {CrossIcon}
    </Button>
  ) : null;

  if (!isSelectable) {
    /* A label, not a control. Making it focusable would put a tab stop on a
       thing that does nothing. */
    return (
      <div
        ref={ref}
        className={cx(styles['chip'], onRemove ? styles['removable'] : undefined, className)}
      >
        <span>{children}</span>
        {remove}
      </div>
    );
  }

  if (!onRemove) {
    return (
      <ToggleButton {...props} className={cx(styles['chip'], styles['pressable'], 'cr-bare', className)}>
        <span>{children}</span>
      </ToggleButton>
    );
  }

  /* Both: two sibling controls in one pill. A button inside a button is one
     control to the accessibility tree and to the pointer, and the two targets
     then fight over every press. */
  return (
    <div
      ref={ref}
      className={cx(styles['chip'], styles['removable'], className)}
      {...(props.isSelected ? { 'data-selected': true } : {})}
    >
      <ToggleButton {...props} className={cx(styles['chipLabel'], styles['pressable'], 'cr-bare')}>
        {children}
      </ToggleButton>
      {remove}
    </div>
  );
});
