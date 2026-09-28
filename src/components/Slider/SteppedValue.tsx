'use client';

/* A value readout that marks the value changing — Crystal's `slider-step`.
 *
 * The catalogue gives `slider-step` to every control whose value moves in steps
 * — a slider, a range, a dial, a colour channel, a quantity — and the recipe's
 * own text says where it goes: "range outputs, steppers and scrubber labels;
 * value updates immediately". So it plays on the readout, not on the thumb: the
 * number is what changed, and it has already changed when the recipe starts.
 *
 * Coalesced (`once`), because a drag commits a value many times a second and
 * restarting a 400ms response on every one of them is a stutter, not a
 * response. Never on the render that first shows the value.
 */
import type { ReactNode } from 'react';
import { useChangeMotion } from '../../motion/useChangeMotion.js';

export function SteppedValue({ value, className, children }: {
  /** What the readout says, compared between renders. */
  value: string;
  className?: string | undefined;
  /** What to render, when it is more than the text. Defaults to `value`. */
  children?: ReactNode;
}): React.JSX.Element {
  const scope = useChangeMotion(value, () => 'slider-step', { once: true });
  return <span ref={scope as never} {...(className ? { className } : {})}>{children ?? value}</span>;
}
