'use client';

/* How much of the layout viewport the on-screen keyboard covers, in pixels.
 *
 * A toolbar that sticks to the bottom of the screen on a phone has to sit above
 * the keyboard, or the formatting a person is using is under their thumb's
 * keyboard. CSS has `env(keyboard-inset-height)`, but only where the
 * VirtualKeyboard API is on and the page has opted into it, which is a whole
 * page's decision and not a component's. iOS Safari does not shrink the layout
 * viewport for the keyboard at all. What every mobile engine does report is the
 * visual viewport, which the keyboard does shrink, so the inset is the part of
 * the layout viewport below the visual one.
 *
 * Returns 0 where there is no `visualViewport` (server rendering, old engines)
 * and while no keyboard is open. Listens only while `active`, which the editor
 * sets while it has focus, so a page of editors does not keep a listener each.
 */
import { useEffect, useState } from 'react';

export function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!active || typeof window === 'undefined' || !window.visualViewport) {
      setInset(0);
      return undefined;
    }
    const viewport = window.visualViewport;
    const read = (): void => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      /* A few pixels of difference is browser chrome settling, not a keyboard. */
      setInset(covered > 40 ? Math.round(covered) : 0);
    };
    read();
    viewport.addEventListener('resize', read);
    viewport.addEventListener('scroll', read);
    return () => {
      viewport.removeEventListener('resize', read);
      viewport.removeEventListener('scroll', read);
    };
  }, [active]);

  return inset;
}
