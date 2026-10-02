'use client';

/* ShippingSelector.
 *
 * Delivery options, each stating its price and its estimate.
 *
 * "A radio group; each option states price and estimate together."
 *
 * A delivery option is a trade between two things, and a reader choosing one is
 * comparing them against each other: two pounds and three days against eight
 * pounds and one day. Split across a table's columns, or with the price in the
 * option and the estimate in a footnote, the comparison needs four numbers held
 * in your head. So each option carries both in its own accessible name, which is
 * what a screen reader reads when it arrives on the option.
 *
 * The whole card is the target. A radio dot with a label beside it gives a thumb
 * something small to find. These options are large enough to press and have no
 * dot, because selection here is label weight. That is the catalogue's rule and
 * Crystal's own for a choice among peers, as distinct from an action in an on
 * state. See `_option.scss` for why those two differ.
 *
 * It is built on `RadioGroup`, not on React Aria directly, so it keeps the field
 * shell that carries the validity React Aria resolved. A server saying "choose a
 * delivery method" has to move this group exactly as a local rule would.
 */
import { type ReactNode } from 'react';
import { RadioGroup, type RadioGroupProps } from '../Checkbox/Checkbox.js';
import { SelectedRadio } from '../Checkbox/SelectedRadio.js';
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
        <SelectedRadio
          key={option.value}
          value={option.value}
          isDisabled={option.unavailable !== undefined}
          className={cx(styles['option'])}
        >
          {/* No `aria-label`. The card's own text is its name, and it already
              holds all three facts in one place, as "states price and estimate
              together" asks. An `aria-label` would be a second copy of the same
              sentence, and the one a screen reader reads is the one nobody sees
              to check. */}
          <span className={styles['service']}>{option.label}</span>
          <span className={styles['estimate']}>
            {option.unavailable ?? option.estimate}
          </span>
          <Price value={option.price} as="span" className={cx(styles['price'])} />
        </SelectedRadio>
      ))}
    </RadioGroup>
  );
}
