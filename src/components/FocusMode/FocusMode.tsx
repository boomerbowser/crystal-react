'use client';

/* FocusMode — hides chrome to leave one task visible.
 *
 * States: `off`, `on`, `transitioning`.
 * "Entering and leaving are announced; **nothing becomes unreachable, only
 * hidden**."
 *
 * That sentence contains a tension worth resolving in the open rather than
 * implementing one half of by accident. Chrome that is genuinely still reachable
 * has not been hidden — it is on screen, or it is `visibility: hidden` and still
 * in the tab order, which is the worst of both: invisible and focusable, so a
 * keyboard reader tabs into something nobody can see. Chrome that is genuinely
 * hidden is unreachable *while it is hidden*, and that is not a violation; it is
 * what hiding means.
 *
 * The reading that makes both halves true is about the mode, not the chrome:
 * **nothing is lost, because leaving is always available.** So the chrome is not
 * rendered — not shrunk, not transparent, not `visibility: hidden` — and the
 * control that leaves focus mode is rendered inside the task, where it cannot be
 * hidden by the thing it undoes. A focus mode whose exit is in the chrome it
 * hides is a mode with no way out.
 *
 * **The half that fails silently is focus itself.** If the reader's focus is
 * resting inside the chrome when the mode turns on, that element unmounts under
 * them and focus falls to the document body: a keyboard reader starts again from
 * the top of the page, and a screen reader says nothing at all, because nothing
 * happened that it reports.
 *
 * Knowing that has to be done in advance. The obvious version reads
 * `document.activeElement` in the effect that notices the change — and by then
 * the chrome has already unmounted and the answer is always `body`, so the
 * check passes on every render and moves focus on none of them. There is no
 * lifecycle point between "still focused" and "gone"; `useLayoutEffect` is
 * after the mutation too. So focus is tracked as it moves, and the effect reads
 * what was recorded rather than what is left. Only then is it moved, and only
 * when it was in the chrome: moving it unconditionally would take it away from
 * readers who were already working in the task.
 *
 * "Entering and leaving are announced" is a live region rather than a role
 * change: what the reader needs to know is that the chrome went, which nothing
 * else on screen will tell them.
 */
import {
  useEffect, useRef, useState, type HTMLAttributes, type ReactNode,
} from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './FocusMode.module.scss';

export interface FocusModeProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the chrome is hidden. */
  isOn?: boolean;
  /** Everything that goes when focus mode is on. */
  chrome?: ReactNode;
  /** The one task that stays. */
  children: ReactNode;
  /**
   * Said when the mode changes. `{state}` is replaced with `on` or `off`;
   * a product with its own words passes them.
   */
  announce?: (isOn: boolean) => string;
}

export function FocusMode({
  isOn = false, chrome, children, announce, className, ...props
}: FocusModeProps): React.JSX.Element {
  const task = useRef<HTMLDivElement>(null);
  const chromeRegion = useRef<HTMLDivElement>(null);
  const was = useRef(isOn);
  /* Where focus is *now*, recorded as it moves. See the note above: by the time
     an effect can see the mode change, the chrome it was in has gone. */
  const focusWasInChrome = useRef(false);
  const [said, setSaid] = useState('');

  useEffect(() => {
    if (was.current === isOn) return;
    const inTheChrome = focusWasInChrome.current;
    was.current = isOn;

    setSaid((announce ?? ((on: boolean) => (on ? 'Focus mode on' : 'Focus mode off')))(isOn));
    /* Only when it was in the chrome. Moving focus unconditionally would take
       it away from a reader who was already working in the task. */
    if (isOn && inTheChrome) task.current?.focus();
  }, [isOn, announce]);

  /* `focusin` rather than `focus`, because focus does not bubble and this has to
     hear about a control several levels down. Recorded on the way in and on the
     way out, so the flag describes the moment before the mode changed. */
  const trackFocus = (event: React.FocusEvent<HTMLDivElement>): void => {
    focusWasInChrome.current = chromeRegion.current?.contains(event.target) === true;
  };

  return (
    <div
      {...props}
      data-cr-state={isOn ? 'on' : 'off'}
      onFocus={trackFocus}
      className={cx(styles['wrap'], className)}
    >
      <VisuallyHidden role="status">{said}</VisuallyHidden>
      {isOn ? null : <div ref={chromeRegion}>{chrome}</div>}
      {/* Focusable only as the target of the move above, never a tab stop. */}
      <div ref={task} tabIndex={-1} className={cx(styles['task'])}>{children}</div>
    </div>
  );
}
