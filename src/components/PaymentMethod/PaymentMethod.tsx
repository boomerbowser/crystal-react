'use client';

/* PaymentMethod: a choice among stored methods, and a slot for the provider's.
 *
 * "A radio group. Card fields are never reimplemented: the host supplies its
 * provider element."
 *
 * The second sentence is the reason this component is in the catalogue. A card
 * number, an expiry and a CVC typed into inputs this library rendered would put
 * every product using Crystal inside PCI scope (the whole cardholder data
 * environment), because the data touched their page in the clear. Stripe, Adyen,
 * Braintree and the others hand you an element hosted on their origin that you
 * cannot read the inside of, so the number never reaches your JavaScript.
 *
 * So there is a `provider` slot and there are no card fields. A card form built
 * here would work, look right and pass every test in this repository, and it
 * would move a compliance obligation onto every product that adopted it.
 *
 * Everything else is the option group the shipping selector uses: the same
 * cards, and the same rule that selection is label weight rather than a fill.
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
  /** Anything more, such as an expiry or a billing name. Part of the option's
   *  name. */
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
   * The provider's own element, such as Stripe's `PaymentElement` or Adyen's
   * drop-in. Rendered inside the "a new method" option when that option is
   * chosen. This library never renders a card field of its own; see the note
   * above.
   */
  provider?: ReactNode;
  /** The value that selects the provider's element. */
  newMethodValue?: string;
  newMethodLabel?: ReactNode;
}

/* Whether the provider's element is mounted is read from the radio group's own
   state, not from a `value` prop.
 *
 * A group used with the `defaultValue` its props also offer has no `value`: it
 * stays `undefined`, so a check on that prop fails silently, leaving the option
 * selectable and looking chosen while it mounts nothing. React Aria publishes
 * the selection state that controlled and uncontrolled groups share, and that
 * state says whether this option is the chosen one. */
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
              that talks to a payment processor. Four of them behind unchosen
              options would open four sessions for nothing, and one of them
              would be focusable inside a card the reader did not pick. */}
          <ProviderSlot when={newMethodValue}>{provider}</ProviderSlot>
        </div>
      ) : null}
    </RadioGroup>
  );
}
