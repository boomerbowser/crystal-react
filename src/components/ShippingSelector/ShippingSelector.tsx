'use client';

/* ShippingSelector — delivery options, each stating its price and its estimate.
 *
 * "A radio group; **each option states price and estimate together**."
 *
 * The word doing the work is *together*. A delivery option is a trade between
 * two things, and a reader choosing one is comparing them against each other:
 * two pounds and three days against eight pounds and one day. Split across a
 * table's columns, or with the price in the option and the estimate in a
 * footnote, and the comparison stops being possible without holding four numbers
 * in your head. So each option carries both, in its own accessible name, which
 * is what a screen reader reads when it arrives on the option — not when the
 * reader goes looking for the rest of it.
 *
 * **The whole card is the target.** A radio dot with a label beside it gives a
 * thumb something small to find; these options are large enough to press and the
 * dot is gone, because selection here is label weight — the catalogue's rule and
 * Crystal's own for anything that is a choice among peers rather than an action
 * in an on state. See `_option.scss` for why those two differ.
 *
 * It is built on `RadioGroup` rather than on React Aria directly, so it keeps
 * the field shell that carries the validity React Aria *resolved*: a server
 * saying "choose a delivery method" has to move this group exactly as a local
 * rule would.
 */
import { type ReactNode } from 'react';
import { Radio as AriaRadio } from 'react-aria-components';
import { RadioGroup, type RadioGroupProps } from '../Checkbox/Checkbox.js';
import { Price } from '../Price/Price.js';
import { cx } from '../../styles/cx.js';
import type { Money } from '../../commerce/money.js';
import styles from './ShippingSelector.module.scss';

export interface ShippingOption {
  value: string;
  /** What the service is called. "Standard", "Next day". */
  label: string;
  price: Money;
  /** When it arrives, in words. "3 to 5 working days", "Tomorrow". */
  estimate: string;
  /** Not available, and why. Shown and said. */
  unavailable?: string;
}

export interface ShippingSelectorProps
  extends Omit<RadioGroupProps, 'children' | 'label'> {
  options: readonly ShippingOption[];
  label?: ReactNode;
}

export function ShippingSelector({
  options, label = 'Delivery', className, ...props
}: ShippingSelectorProps): React.JSX.Element {
  return (
    <RadioGroup {...props} label={label} className={cx(styles['group'], className)}>
      {options.map((option) => (
        <AriaRadio
          key={option.value}
          value={option.value}
          isDisabled={option.unavailable !== undefined}
          className={cx(styles['option'])}
        >
          {/* No `aria-label`. The card's own text is its name, and the card's
              own text is already all three facts in one place — which is what
              "states price and estimate together" asks for. An `aria-label`
              here would be a second version of the same sentence, and the one a
              screen reader reads is the one nobody checks. */}
          <span className={styles['service']}>{option.label}</span>
          <span className={styles['estimate']}>
            {option.unavailable ?? option.estimate}
          </span>
          <Price value={option.price} as="span" className={cx(styles['price'])} />
        </AriaRadio>
      ))}
    </RadioGroup>
  );
}
