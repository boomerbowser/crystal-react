'use client';

/* ClickAway.
 *
 * React Aria's `useInteractOutside` does the hard part, and the hard part is not
 * "did the click land outside". It is that a pointer press starting inside and
 * ending outside is not a click-away — dragging to select text out of a popover
 * should not close it — and that touch, pen and mouse all report that sequence
 * differently. A `document.addEventListener('click')` implementation closes on
 * the text selection every time.
 *
 * Crystal's rule, which no library can supply: **dismissal is never only a
 * click-away.** Escape must work too, and something visible must close it. A
 * keyboard user has no way to click outside, and a screen reader user may not
 * know there is an outside. This component therefore also listens for Escape and
 * calls the same callback, so taking it gets both halves rather than one.
 */
import { useRef, type ReactNode } from 'react';
import { useInteractOutside, useKeyboard } from 'react-aria';
import { mergeProps } from 'react-aria';

export interface ClickAwayProps {
  /** Called when a pointer finishes outside the subtree, or when Escape is pressed. */
  onDismiss: () => void;
  /** Stop listening without unmounting. */
  isDisabled?: boolean;
  children?: ReactNode;
}

export function ClickAway({ onDismiss, isDisabled = false, children }: ClickAwayProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);

  useInteractOutside({
    ref,
    isDisabled,
    onInteractOutside: () => onDismiss(),
  });

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (event.key === 'Escape' && !isDisabled) {
        onDismiss();
        return;
      }
      event.continuePropagation();
    },
  });

  return (
    <div {...mergeProps(keyboardProps, { style: { display: 'contents' } })} ref={ref}>
      {children}
    </div>
  );
}
