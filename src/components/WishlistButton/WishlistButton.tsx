'use client';

/* WishlistButton is a toggle whose name does not change.
 *
 * "A toggle with a pressed state and a name that says what it will do."
 *
 * The name does not flip with the state. If "Save" became "Remove" once the item
 * was saved, a screen reader would announce "Remove from wishlist, pressed".
 * Pressed says the item is in the list, and the name says pressing puts it
 * there, so the reader has to work out which half is the state. Two things
 * would also change for one press, so the announcement would be heard twice.
 *
 * The name is a verb phrase, "Save to wishlist", not a noun such as "Wishlist".
 * It says what the control is for, and `aria-pressed` carries whether it has
 * been done. That is the ARIA toggle pattern, and `MediaControls` makes the same
 * decision about play and pause for the same reason: one toggle, one name, the
 * state on the state attribute.
 *
 * The item is in the name. A listing page has thirty of these, and thirty
 * controls called "Save to wishlist" are thirty identical rows in a screen
 * reader's element list. The thing being saved distinguishes them.
 *
 * There are two shapes, both from the catalogue ("Resin pill or icon button").
 * The pill shows the words, and the icon carries the same name without showing
 * it.
 */
import { forwardRef, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './WishlistButton.module.scss';

export interface WishlistButtonProps {
  /** What is being saved. Part of the name, so thirty of these are thirty names. */
  item: string;
  /** Whether it is in the list. Carried by `aria-pressed`, not by the name. */
  isSaved: boolean;
  onChange: (saved: boolean) => void;
  /**
   * The name, given the item. A verb phrase that says what the control is for,
   * not what the next press would do. Default English.
   */
  name?: (item: string) => string;
  /** The icon shape instead of the pill. */
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
    /* `selection` plays when the item becomes saved, by this press or by the list
       changing elsewhere, and not on a render that shows it already saved. The
       press itself plays the button's own \`press\`. */
    const scope = useChangeMotion(isSaved, entered('selection'));
    const shared = {
      ...props,
      ref: mergeRefs(ref, scope as never),
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
