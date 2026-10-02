'use client';

/* CartItem: one line of a basket.
 *
 * "Removal is announced and undoable; quantity changes announce the new
 * subtotal."
 *
 * Both halves have the same cause: a basket line changes the price of the whole
 * order, and the reader making the change is not looking at the total.
 *
 * A quantity change announces the subtotal, not the quantity. The stepper
 * already says the quantity, because it is the value of the control being
 * operated. What the reader does not have is what the change did to the money.
 * So the announcement is "Two Harbour prints, £80.00". It is the line's
 * subtotal and not the order's, because this component knows one and not the
 * other, and it would have to guess an order total it was not given.
 *
 * At a bound, two regions speak, and that is intended. The stepper owes "the
 * bounds are announced when reached" and this line owes the new subtotal, so
 * raising a quantity to the maximum updates both live regions in one tick: the
 * constraint, then its consequence. They are two facts, and merging them into
 * a single region would drop one of the two catalogue sentences. DOM order
 * decides which is heard first, and the stepper precedes this line's region,
 * so the constraint arrives ahead of the consequence. The test pins that order,
 * because moving a node would change it.
 *
 * Removal is undoable, so the undo is a control and not a gesture. A basket
 * line removed by mistake is a purchase that does not happen, and "press
 * Ctrl+Z" is not an affordance. Removal hands the product an undo to offer,
 * through `Toast`'s action, which has the shape this needs. This component
 * announces that the line went and leaves focus somewhere that still exists.
 *
 * Focus after removal is the component's job. The control the reader pressed
 * has just been unmounted. Without somewhere to send focus, it falls to the
 * document body and a keyboard reader starts again from the top of the page.
 * `Banner` takes `returnFocusTo` for the same reason.
 */
import {
  forwardRef, useMemo, useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { useNumberFormatter } from 'react-aria';
import { Button } from '../Button/Button.js';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper.js';
import { Price } from '../Price/Price.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useListItemMotion } from '../../motion/ListPresence.js';
import { moneyFormat, type Money } from '../../commerce/money.js';
import styles from './CartItem.module.scss';

export interface CartItemProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'> {
  /** What it is. The line's own name. */
  name: ReactNode;
  /** Said in the announcements, where a `ReactNode` cannot go. */
  nameText: string;
  /** A thumbnail, a swatch or anything else. Decorative, because the name
   *  carries the meaning. */
  media?: ReactNode;
  /** Variant, size, colour: the things that make this line this line. */
  detail?: ReactNode;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  minQuantity?: number;
  maxQuantity?: number;
  /** The price for one. */
  unitPrice: Money;
  /** The price for all of them. Given, not multiplied here: rounding, bundling
   *  and per-line discounts are the product's arithmetic. */
  subtotal: Money;
  onRemove?: () => void;
  removeLabel?: (name: string) => string;
  /** Where focus goes once this line stops existing. */
  returnFocusTo?: RefObject<HTMLElement | null>;
  /** The line is being recalculated. */
  isUpdating?: boolean;
  /** What a quantity change says. Given the new count and the new subtotal. */
  announceQuantity?: (quantity: number, subtotal: string, name: string) => string;
}

export const CartItem = forwardRef<HTMLElement, CartItemProps>(function CartItem({
  name, nameText, media, detail, quantity, onQuantityChange,
  minQuantity = 1, maxQuantity, unitPrice, subtotal, onRemove,
  removeLabel = (one) => `Remove ${one}`, returnFocusTo, isUpdating = false,
  announceQuantity, className, ...props
}, ref): ReactNode {
  const money = useNumberFormatter(moneyFormat(subtotal));
  /* State, not a ref. A ref written in an effect changes nothing on the page:
     the live region would keep the empty string it was first rendered with.
     Every test of the region's content would still pass, because it would
     check what the component last decided, not what it last rendered. */
  const [said, setSaid] = useState('');
  const first = useRef(true);

  /* On a change, never on mount: a line that renders showing two of something
     has not just been changed to two. */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaid((announceQuantity
      ?? ((count, total, one) => `${String(count)} × ${one}, ${total}`))(
      quantity, money.format(subtotal.amount), nameText,
    ));
  }, [quantity, subtotal.amount, nameText, announceQuantity, money]);

  /* In a product's `ListPresence`, this arrives with `list-in` when it is
     added and leaves with `list-out` when it is removed. Anywhere else it
     does not move. */
  const scope = useListItemMotion();
  const merged = useMemo(() => mergeRefs(ref, scope as never), [ref, scope]);
  return (
    <article
      {...props}
      ref={merged as never}
      aria-label={nameText}
      {...(isUpdating ? { 'data-updating': '' } : {})}
      className={cx(styles['item'], className)}
    >
      {media ? <div aria-hidden="true" className={styles['media']}>{media}</div> : null}

      <div className={styles['text']}>
        <p className={styles['name']}>{name}</p>
        {detail ? <p className={styles['detail']}>{detail}</p> : null}
        <p className={styles['unit']}>
          <Price value={unitPrice} as="span" tabular={false} /> each
        </p>
      </div>

      <QuantityStepper
        label={`Quantity of ${nameText}`}
        showLabel={false}
        value={quantity}
        onChange={onQuantityChange}
        minValue={minQuantity}
        {...(maxQuantity === undefined ? {} : { maxValue: maxQuantity })}
        className={cx(styles['quantity'])}
      />

      <Price value={subtotal} as="p" className={cx(styles['subtotal'])} />

      {onRemove ? (
        <Button
          variant="quiet"
          aria-label={removeLabel(nameText)}
          onPress={() => {
            onRemove();
            /* After, not before. The caller's handler removes this line, and
               focusing first would move the reader and then remove the element
               they were moved from. */
            returnFocusTo?.current?.focus();

          }}
          className={cx(styles['remove'])}
        >
          Remove
        </Button>
      ) : null}

      {/* The subtotal, announced. The stepper already says the quantity, as
          the value of the control being operated, and what the reader does
          not have is what the change did to the money. */}
      <span role="status" className={styles['announcement']}>{said}</span>
    </article>
  );
});
