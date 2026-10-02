'use client';

/* CheckoutSteps shows progress through a purchase.
 *
 * "The current step is `aria-current`; **completion is stated in words**, and a
 * check mark here means validated rather than selected."
 *
 * All three come from `Stepper`, so this is `Stepper` with a shape and a
 * default name, not a second implementation. The catalogue asks for two
 * drawings (circular markers on a Haze track for a stepper, pills with hairline
 * connectors for this) and one set of semantics. Writing the semantics twice
 * would give `aria-current` and the state wording two places to drift, and the
 * wording carries the meaning to anybody not looking at the markers.
 *
 * This is the one place in Crystal the check mark glyph is right. It means
 * validated (the step is done and correct), which is information display. It never means "selected". Selection is label weight,
 * and the current step here takes exactly that.
 */
import { Stepper, type StepperProps } from '../Stepper/Stepper.js';

export interface CheckoutStepsProps extends Omit<StepperProps, 'shape'> {
  /** Names the sequence. Defaults to "Checkout". */
  'aria-label'?: string;
}

export function CheckoutSteps({ ...props }: CheckoutStepsProps): React.JSX.Element {
  return <Stepper {...props} shape="pill" aria-label={props['aria-label'] ?? 'Checkout'} />;
}
