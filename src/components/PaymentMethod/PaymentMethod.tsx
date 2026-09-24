'use client';

/* PaymentMethod — a choice among stored methods, and a slot for the provider's.
 *
 * "A radio group. **Card fields are never reimplemented — the host supplies its
 * provider element.**"
 *
 * That second sentence is a boundary, not a preference, and it is the reason
 * this component is in the catalogue at all. A card number, an expiry and a CVC
 * typed into inputs this library rendered would put every product using Crystal
 * inside PCI scope — the whole cardholder data environment — because the data
 * touched their page in the clear. Stripe, Adyen, Braintree and the rest all
 * solve this the same way: they hand you an element you cannot read the inside
 * of, hosted on their origin, and the number never reaches your JavaScript.
 *
 * So there is a `provider` slot and there are no card fields. It is worth
 * stating the failure mode plainly, because it does not look like a failure:
 * a card form built here would work, would look right, would pass every test in
 * this repository, and would quietly move a compliance obligation onto every
 * product that adopted it.
 *
 * Everything else is the option group the shipping selector uses — the same
 * cards, the same rule that selection is label weight rather than a fill.
 */
import { type ReactNode } from 'react';
import { Radio as AriaRadio } from 'react-aria-components';
import { RadioGroup, type RadioGroupProps } from '../Checkbox/Checkbox.js';
import { cx } from '../../styles/cx.js';
import styles from './PaymentMethod.module.scss';

export interface StoredMethod {
  value: string;
  /** How the method reads. "Visa ending 4242". Never the full number. */
  label: string;
  /** Anything more — an expiry, a billing name. Part of the option's name. */
  detail?: ReactNode;
  /** A brand mark. Decorative: the label is what says which card this is. */
  mark?: ReactNode;
  unavailable?: string;
}

export interface PaymentMethodProps
  extends Omit<RadioGroupProps, 'children' | 'label'> {
  /** Methods already on file. */
  methods?: readonly StoredMethod[];
  label?: ReactNode;
  /**
   * The provider's own element — Stripe's `PaymentElement`, Adyen's drop-in.
   * Rendered inside the "a new method" option when that option is chosen.
   * This library never renders a card field of its own; see the note above.
   */
  provider?: ReactNode;
  /** The value that selects the provider's element. */
  newMethodValue?: string;
  newMethodLabel?: ReactNode;
  /** The chosen method, so the provider's element shows only when it is chosen. */
  value?: string;
}

export function PaymentMethod({
  methods = [], label = 'Payment method', provider,
  newMethodValue = 'new', newMethodLabel = 'A different card',
  value, className, ...props
}: PaymentMethodProps): React.JSX.Element {
  return (
    <RadioGroup
      {...props}
      {...(value === undefined ? {} : { value })}
      label={label}
      className={cx(styles['group'], className)}
    >
      {methods.map((method) => (
        <AriaRadio
          key={method.value}
          value={method.value}
          isDisabled={method.unavailable !== undefined}
          className={cx(styles['option'])}
        >
          {method.mark ? (
            <span aria-hidden="true" className={styles['mark']}>{method.mark}</span>
          ) : null}
          <span className={styles['name']}>{method.label}</span>
          {method.unavailable ?? method.detail ? (
            <span className={styles['detail']}>{method.unavailable ?? method.detail}</span>
          ) : null}
        </AriaRadio>
      ))}

      {provider ? (
        <div className={styles['new']}>
          <AriaRadio value={newMethodValue} className={cx(styles['option'])}>
            <span className={styles['name']}>{newMethodLabel}</span>
          </AriaRadio>
          {/* Mounted only while it is chosen. A provider's element is an iframe
              that talks to a payment processor; four of them sitting behind
              unchosen options is four sessions opened for nothing, and one of
              them is focusable inside a card the reader did not pick. */}
          {value === newMethodValue ? (
            <div className={styles['provider']}>{provider}</div>
          ) : null}
        </div>
      ) : null}
    </RadioGroup>
  );
}
