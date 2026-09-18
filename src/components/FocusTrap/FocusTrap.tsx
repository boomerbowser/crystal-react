'use client';

/* FocusTrap.
 *
 * The catalogue's `product` column for this component says it in as many words:
 * "Use a maintained primitive rather than rebuilding it." So this is React Aria's
 * `FocusScope` with Crystal's contract stated around it, and nothing else.
 *
 * Rebuilding a focus trap means reimplementing tab-order traversal across shadow
 * roots, `inert`, iframes, and every element that is focusable but not tabbable —
 * and getting one wrong strands a keyboard user inside a region with no way out.
 * That is the failure this component exists to prevent, so it must not be the
 * failure this component introduces.
 *
 * Crystal adds one rule React Aria cannot enforce: **never trap without a
 * visible, keyboard-reachable exit.** A dialog has its close button; a menu has
 * Escape. If the region you are trapping has neither, the trap is the bug.
 */
import type { ReactNode } from 'react';
import { FocusScope } from 'react-aria';

export interface FocusTrapProps {
  /**
   * Whether focus is contained. False leaves the subtree alone entirely, which is
   * what makes this safe to render unconditionally around something that is only
   * sometimes modal.
   */
  isActive?: boolean;
  /**
   * Move focus into the region when it becomes active. On by default: a region
   * that contains focus but never receives it traps the user outside it.
   */
  autoFocus?: boolean;
  /**
   * Return focus to whatever had it when the region closes. On by default, and
   * the half most often forgotten — without it a keyboard user is returned to the
   * top of the document every time a menu closes.
   */
  restoreFocus?: boolean;
  children?: ReactNode;
}

export function FocusTrap({
  isActive = true,
  autoFocus = true,
  restoreFocus = true,
  children,
}: FocusTrapProps): React.JSX.Element {
  return (
    <FocusScope contain={isActive} autoFocus={isActive && autoFocus} restoreFocus={restoreFocus}>
      {children}
    </FocusScope>
  );
}
