'use client';

/* Pressable.
 *
 * Makes any element respond to press across pointer, keyboard and touch, plays
 * Crystal's press recipe, and extends the hit area to the 44px minimum.
 *
 * React Aria's `Pressable` is the behaviour, and the reason to take it rather
 * than add an `onClick` is the list of things a click handler does not do: it
 * does not fire on Space for a non-button, it fires on a drag that ends outside
 * the element, it double-fires on some touch stacks, and it has no notion of a
 * press being cancelled.
 *
 * What React Aria deliberately does not do is name the thing. It makes the child
 * focusable and pressable and leaves the role to the caller, which means a bare
 * `Pressable` around a span is a tab stop a screen reader announces as nothing.
 * Crystal's catalogue is stricter — "gives its child button semantics unless told
 * otherwise" — so the role is applied here, and skipped when the child is already
 * an element that has one.
 *
 * Motion binds to the press *state*, not to a pointer event. That is Crystal's
 * rule and it is the reason a keyboard user sees the same animation a mouse user
 * does: `onPressStart`/`onPressEnd` fire for Space and Enter too.
 */
import { cloneElement, useRef, type DOMAttributes, type ReactElement } from 'react';
import { Pressable as AriaPressable } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Pressable.module.scss';

export interface PressableProps {
  /** What the press does. */
  onPress?: () => void;
  isDisabled?: boolean;
  /**
   * Override the button semantics React Aria gives the child — `link`, `tab`,
   * `menuitem`. Leave unset when the thing really is a button.
   */
  role?: string;
  /**
   * Exactly one host element. React Aria clones it to attach DOM handlers, so a
   * component will not do — the type says so rather than letting it fail at
   * runtime.
   */
  children: ReactElement<DOMAttributes<Element> & { className?: string; ref?: React.Ref<HTMLElement> }, string>;
}

/* Elements that already carry an interactive role. Overwriting one is worse than
   adding none: a link announced as a button tells the reader it will not navigate. */
const ALREADY_NAMED = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

export function Pressable({ children, role, ...props }: PressableProps): React.JSX.Element {
  const [scope, play] = useMotion();
  const pressed = useRef(false);
  const semantics = role ?? (ALREADY_NAMED.has(children.type) ? undefined : 'button');

  /* `cloneElement` widens the element's tag back to "string or component", which
     loses the host-element guarantee the prop type just established. The cast
     restores what the input already proved rather than asserting something new. */
  const child = cloneElement(children, {
    className: cx(styles['pressable'], children.props.className),
    ref: scope as never,
    ...(semantics ? { role: semantics } : {}),
  }) as typeof children;

  return (
    <AriaPressable
      {...props}
      /* Bound to the press state rather than to a pointer event, so Space and
         Enter animate exactly as a pointer does. `pressed` guards the repeat: a
         held key repeats its keydown, and restarting a 120ms recipe on every
         repeat is what makes a held control stutter. */
      onPressStart={() => { if (!pressed.current) { pressed.current = true; play('press'); } }}
      onPressEnd={() => { pressed.current = false; }}
    >
      {child}
    </AriaPressable>
  );
}
