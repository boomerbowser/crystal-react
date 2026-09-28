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
import { useContext, type ReactNode } from 'react';
import { RadioGroupStateContext } from 'react-aria-components';
import { RadioGroup, type RadioGroupProps } from '../Checkbox/Checkbox.js';
import { SelectedRadio } from '../Checkbox/SelectedRadio.js';
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
}

/* Whether the provider's element is mounted is asked of the radio group's own
   state rather than of a `value` prop.
 *
 * The obvious version of this reads a `value` the caller passed. It typechecks,
 * it works in every controlled example, and it fails silently for anyone using
 * the `defaultValue` the group's props also offer: `value` is `undefined`
 * forever, so the option is selectable, looks chosen, and mounts nothing. A
 * component whose one job is to host somebody else's payment element cannot
 * have an uncontrolled mode that quietly hosts nothing.
 *
 * React Aria publishes the state both modes share, which is the answer to the
 * question actually being asked — "is this option the chosen one" — rather than
 * to a proxy for it. */
function ProviderSlot(
  { when, children }: { when: string; children: ReactNode },
): React.JSX.Element | null {
  const state = useContext(RadioGroupStateContext);
  if (state?.selectedValue !== when) return null;
  return <div className={styles['provider']}>{children}</div>;
}

export function PaymentMethod({
  methods = [], label = 'Payment method', provider,
  newMethodValue = 'new', newMethodLabel = 'A different card',
  className, ...props
}: PaymentMethodProps): React.JSX.Element {
  return (
    <RadioGroup
      {...props}
      label={label}
      className={cx(styles['group'], className)}
    >
      {methods.map((method) => (
        <SelectedRadio
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
        </SelectedRadio>
      ))}

      {provider ? (
        <div className={styles['new']}>
          <SelectedRadio value={newMethodValue} className={cx(styles['option'])}>
            <span className={styles['name']}>{newMethodLabel}</span>
          </SelectedRadio>
          {/* Mounted only while it is chosen. A provider's element is an iframe
              that talks to a payment processor; four of them sitting behind
              unchosen options is four sessions opened for nothing, and one of
              them is focusable inside a card the reader did not pick. */}
          <ProviderSlot when={newMethodValue}>{provider}</ProviderSlot>
        </div>
      ) : null}
    </RadioGroup>
  );
}
