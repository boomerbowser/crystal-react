'use client';

/* FocusMode hides chrome to leave one task visible.
 *
 * States: `off`, `on`, `transitioning`.
 * "Entering and leaving are announced; **nothing becomes unreachable, only
 * hidden**."
 *
 * Hidden chrome cannot also be reachable. Chrome left `visibility: hidden` in
 * the tab order is invisible and focusable, so a keyboard reader tabs into
 * something nobody can see. Chrome that is hidden is unreachable while it is
 * hidden.
 *
 * The sentence holds for the mode as a whole: nothing is lost, because leaving
 * is always available. The chrome is not rendered (not shrunk, not transparent,
 * not `visibility: hidden`), and the control that leaves focus mode is rendered
 * inside the task, where hiding the chrome cannot hide it. An exit placed in
 * the chrome would leave the mode with no way out.
 *
 * Focus can fail without any warning. If the reader's focus is inside the
 * chrome when the mode turns on, that element unmounts and focus falls to the
 * document body. A keyboard reader starts again from the top of the page, and a
 * screen reader says nothing at all.
 *
 * The effect that notices the change cannot read `document.activeElement`. By
 * then the chrome has unmounted and the answer is always `body`.
 * `useLayoutEffect` also runs after the mutation, and no lifecycle point falls
 * between "still focused" and "gone". So focus is tracked as it moves, and the
 * effect reads what was recorded. Focus is moved only when it was in the
 * chrome, so a reader already working in the task keeps their place.
 *
 * "Entering and leaving are announced" is a live region and not a role change.
 * The reader needs to know that the chrome went, and nothing else on screen
 * tells them.
 */
import {
  useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode,
} from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import { AnimatePresence } from 'motion/react';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
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
  /* Where focus is now, recorded as it moves. By the time an effect can see
     the mode change, the chrome it was in has gone (see the note above). */
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
      {/* The chrome leaves with `page-out` as focus mode begins and returns
          with `page-in` as it ends, held in presence so it can be seen going.
          Neither plays on the render that opens the page. */}
      <AnimatePresence initial={false}>
        {isOn ? null : <Chrome key="chrome" region={chromeRegion}>{chrome}</Chrome>}
      </AnimatePresence>
      {/* Focusable only as the target of the move above, never a tab stop. */}
      <div ref={task} tabIndex={-1} className={cx(styles['task'])}>{children}</div>
    </div>
  );
}

function Chrome({ region, children }: { region: React.Ref<HTMLDivElement>; children: ReactNode }): React.JSX.Element {
  const presence = usePresenceMotion('page-in', 'page-out');
  const merged = useMemo(() => mergeRefs(region, presence as never), [region, presence]);
  return <div ref={merged}>{children}</div>;
}
