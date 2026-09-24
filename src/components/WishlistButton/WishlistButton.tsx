'use client';

/* WishlistButton — a toggle, with a name that stays put.
 *
 * "A toggle with a pressed state and **a name that says what it will do**."
 *
 * There are two readings of that sentence and only one of them is safe. The
 * unsafe one flips the name with the state — "Save" becomes "Remove" once the
 * item is saved — and it produces a control that a screen reader announces as
 * "Remove from wishlist, pressed", which is a contradiction: pressed says the
 * item is in the list and the name says pressing is what puts it there. The
 * reader is left to work out which half is the state. It is also two things
 * changing at once for one press, so the announcement is heard twice.
 *
 * The safe reading is that the name is a *verb phrase* rather than a noun — "Save
 * to wishlist", not "Wishlist" — so it says what the control is for, and
 * `aria-pressed` carries whether it has been done. That is the ARIA toggle
 * pattern, and it is the decision `MediaControls` already made about play and
 * pause for exactly the same reason: one toggle, one name, the state on the
 * state attribute.
 *
 * **The item is in the name.** A listing page has thirty of these, and thirty
 * controls called "Save to wishlist" are thirty identical rows in a screen
 * reader's element list. What distinguishes them is the thing being saved.
 *
 * Two shapes, both from the catalogue — "Resin pill or icon button". The pill
 * carries the words; the icon carries the same name invisibly.
 */
import { forwardRef, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { cx } from '../../styles/cx.js';
import styles from './WishlistButton.module.scss';

export interface WishlistButtonProps {
  /** What is being saved. Part of the name, so thirty of these are thirty names. */
  item: string;
  /** Whether it is in the list. Carried by `aria-pressed`, not by the name. */
  isSaved: boolean;
  onChange: (saved: boolean) => void;
  /**
   * The name, given the item. A verb phrase — what the control is for, not what
   * the next press would do. Default English.
   */
  name?: (item: string) => string;
  /** The icon shape rather than the pill. */
  iconOnly?: boolean;
  /** The words on the pill. The name is separate, and is what is announced. */
  children?: ReactNode;
  isDisabled?: boolean;
  className?: string;
}

const Heart = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 20s-7-4.6-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.4 12 20 12 20Z" />
  </svg>
);

export const WishlistButton = forwardRef<HTMLButtonElement, WishlistButtonProps>(
  function WishlistButton({
    item, isSaved, onChange, name, iconOnly = false, children,
    isDisabled, className, ...props
  }, ref) {
    const label = (name ?? ((one) => `Save ${one} to your wishlist`))(item);
    const shared = {
      ...props,
      ref,
      isSelected: isSaved,
      onPress: () => onChange(!isSaved),
      ...(isDisabled === undefined ? {} : { isDisabled }),
    };

    if (iconOnly) {
      return (
        <IconButton
          {...shared}
          label={label}
          icon={Heart}
          variant="resin"
          circle
          className={cx(styles['wish'], className)}
        />
      );
    }

    return (
      <Button {...shared} aria-label={label} className={cx(styles['pill'], className)}>
        <span aria-hidden="true" className={styles['mark']}>{Heart}</span>
        {children ?? 'Save'}
      </Button>
    );
  },
);
