'use client';

/* CheckoutBlock — steps, address, shipping, payment, and the order summary.
 *
 * "Each step is a labelled region; errors summarise and link; **raw card data
 * never touches this component**." States: `at-rest`, `validating`,
 * `submitting`, `error`.
 *
 * Three opinions, each one of the clause's:
 *
 *   - **One step at a time, each a region named for itself.** The current step
 *     is the only one rendered, as a region whose heading is the step's name —
 *     "Delivery address", "Delivery", "Payment" — and `CheckoutSteps` above says
 *     where the reader is in the three. A completed step can be returned to from
 *     the steps; an upcoming one cannot be jumped to, because it depends on the
 *     answers before it.
 *   - **Errors are summarised at the top of the step and link to their fields.**
 *     `ErrorSummary` takes focus when the product reports errors, says how many,
 *     and each entry moves focus into its field. A failure that belongs to no
 *     field — a declined payment — is said once, as an alert, above the step.
 *   - **Payment is a boundary, not a form.** The payment step renders
 *     `PaymentMethod`, whose only way to take a new card is the host provider's
 *     own element in its `provider` slot. There is no card number, expiry or
 *     security code field anywhere in this block, by construction: the prop that
 *     would hold one does not exist. It keeps PCI scope out of the library.
 *
 * Moving between steps is the product's decision, because only the product can
 * validate an address or a delivery option: "Continue" asks it (`onContinue`),
 * and it answers with `onStepChange` or with errors.
 */
import type { ReactNode } from 'react';
import { CheckoutSteps } from '../CheckoutSteps/CheckoutSteps.js';
import { AddressForm, type AddressFormProps } from '../AddressForm/AddressForm.js';
import { ShippingSelector, type ShippingSelectorProps } from '../ShippingSelector/ShippingSelector.js';
import { PaymentMethod, type PaymentMethodProps } from '../PaymentMethod/PaymentMethod.js';
import { CartSummary, type SummaryLine } from '../CartSummary/CartSummary.js';
import { Button } from '../Button/Button.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { ErrorSummary } from '../../form/ErrorSummary.js';
import type { Money } from '../../commerce/money.js';
import { cx } from '../../styles/cx.js';
import styles from './CheckoutBlock.module.scss';

export type CheckoutStep = 'address' | 'shipping' | 'payment';
export type CheckoutState = 'at-rest' | 'validating' | 'submitting' | 'error';

const ORDER: readonly CheckoutStep[] = ['address', 'shipping', 'payment'];

export interface CheckoutBlockProps {
  step: CheckoutStep;
  onStepChange: (step: CheckoutStep) => void;
  /** "Continue" on a step: the product validates it and answers with `onStepChange` or `errors`. */
  onContinue: (step: CheckoutStep) => void;
  onPlaceOrder: () => void;
  address: Omit<AddressFormProps, 'onSubmit' | 'isSubmitting' | 'errors' | 'children'>;
  shipping: ShippingSelectorProps;
  /** The payment step. A new card is the host provider's own element, in `provider`. */
  payment: PaymentMethodProps;
  summary: { lines: readonly SummaryLine[]; total: Money };
  /** The current step's field errors, keyed by field name. */
  errors?: Readonly<Record<string, string>>;
  state?: CheckoutState;
  /** A failure that belongs to no field — a declined payment. Shown in `error`. */
  errorMessage?: ReactNode;
  stepLabels?: Readonly<Record<CheckoutStep, string>>;
  continueLabel?: string;
  backLabel?: string;
  placeOrderLabel?: string;
  className?: string;
}

const LABELS: Readonly<Record<CheckoutStep, string>> = {
  address: 'Delivery address',
  shipping: 'Delivery',
  payment: 'Payment',
};

export function CheckoutBlock({
  step, onStepChange, onContinue, onPlaceOrder, address, shipping, payment, summary,
  errors = {}, state = 'at-rest', errorMessage, stepLabels = LABELS,
  continueLabel = 'Continue', backLabel = 'Back', placeOrderLabel = 'Place order', className,
}: CheckoutBlockProps): React.JSX.Element {
  const index = ORDER.indexOf(step);
  const last = index === ORDER.length - 1;
  const busy = state === 'validating' || state === 'submitting';
  const headingId = `checkout-${step}-heading`;

  return (
    <div className={cx(styles['checkout'], className)} data-cr-state={state} aria-busy={busy || undefined}>
      <CheckoutSteps
        steps={ORDER.map((one, at) => ({
          id: one,
          label: stepLabels[one],
          state: at < index ? 'complete' : at === index ? 'current' : 'upcoming',
          /* Back to an answered step, never forward past an unanswered one. */
          isDisabled: at >= index,
        }))}
        onNavigate={(id) => { onStepChange(id as CheckoutStep); }}
        className={cx(styles['steps'])}
      />

      <div className={cx(styles['main'])}>
        <section aria-labelledby={headingId} className={cx(styles['step'], 'cr-frost')}>
          <h2 id={headingId} className={cx(styles['heading'])}>{stepLabels[step]}</h2>
          {state === 'error' && errorMessage ? (
            <div role="alert" className={cx(styles['failure'])}>{errorMessage}</div>
          ) : null}
          <ErrorSummary errors={errors} />
          <div className={cx(styles['fields'], 'cr-haze')}>
            {step === 'address' ? (
              <AddressForm {...address} errors={errors} isSubmitting={busy} />
            ) : step === 'shipping' ? (
              <ShippingSelector {...shipping} isDisabled={busy} />
            ) : (
              <PaymentMethod {...payment} isDisabled={busy} />
            )}
          </div>
          <div className={cx(styles['actions'])}>
            {index > 0 ? (
              <Button variant="quiet" isDisabled={busy} onPress={() => { onStepChange(ORDER[index - 1]!); }}>{backLabel}</Button>
            ) : null}
            {last ? (
              <Button variant="primary" isDisabled={busy} onPress={onPlaceOrder}>{placeOrderLabel}</Button>
            ) : (
              <Button variant="primary" isDisabled={busy} onPress={() => { onContinue(step); }}>{continueLabel}</Button>
            )}
          </div>
        </section>

        <CartSummary
          lines={summary.lines}
          total={summary.total}
          label="Order summary"
          className={cx(styles['summary'])}
        />
      </div>

      {/* Submission is announced: a checkout that goes quiet while an order is
          placed is one a reader presses twice. Rendered from the first frame. */}
      <VisuallyHidden role="status">
        {state === 'submitting' ? 'Placing your order' : state === 'validating' ? `Checking ${stepLabels[step].toLowerCase()}` : ''}
      </VisuallyHidden>
    </div>
  );
}
