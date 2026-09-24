'use client';

/* CheckoutSteps — progress through a purchase.
 *
 * "The current step is `aria-current`; **completion is stated in words**, and a
 * check mark here means validated rather than selected."
 *
 * All three of those are `Stepper`'s, which is why this is `Stepper` with a
 * shape and a default name rather than a second implementation. The catalogue
 * asks for two *drawings* — circular markers on a Haze track for a stepper,
 * pills with hairline connectors for this — and one set of semantics. Writing
 * the semantics twice would be two places for `aria-current` and the state
 * wording to drift, and the wording is the part that carries the meaning to
 * anybody not looking at the markers.
 *
 * **The check mark is the one place in Crystal this glyph is right.** It means
 * validated — this step is done and correct — which is information display. It
 * never means "selected"; selection is label weight, and the current step here
 * takes exactly that.
 */
import { Stepper, type StepperProps } from '../Stepper/Stepper.js';

export interface CheckoutStepsProps extends Omit<StepperProps, 'shape'> {
  /** Names the sequence. Defaults to "Checkout". */
  'aria-label'?: string;
}

export function CheckoutSteps({ ...props }: CheckoutStepsProps): React.JSX.Element {
  return <Stepper {...props} shape="pill" aria-label={props['aria-label'] ?? 'Checkout'} />;
}
