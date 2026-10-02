'use client';

/* Pressable.
 *
 * Makes any element respond to press across pointer, keyboard and touch, plays
 * Crystal's press recipe, and extends the hit area to the 44px minimum.
 *
 * React Aria's `Pressable` is the behaviour. It is used instead of an `onClick`
 * because a click handler does not fire on Space for a non-button, fires on a
 * drag that ends outside the element, double-fires on some touch stacks, and has
 * no notion of a press being cancelled.
 *
 * React Aria does not name the thing. It makes the child focusable and
 * pressable and leaves the role to the caller, so a bare `Pressable` around a
 * span is a tab stop a screen reader announces as nothing. Crystal's catalogue
 * says it "gives its child button semantics unless told otherwise", so the role
 * is applied here, and skipped when the child is already an element that has
 * one.
 *
 * Motion binds to the press state, not to a pointer event. That is Crystal's
 * rule, and it means a keyboard user sees the same animation a mouse user does:
 * `onPressStart`/`onPressEnd` fire for Space and Enter too.
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
   * Override the button semantics React Aria gives the child with `link`, `tab`
   * or `menuitem`. Leave unset when the thing really is a button.
   */
  role?: string;
  /**
   * Exactly one host element. React Aria clones it to attach DOM handlers, so a
   * component will not work. The type rejects one so it does not fail at
   * runtime.
   */
  children: ReactElement<DOMAttributes<Element> & { className?: string; ref?: React.Ref<HTMLElement> }, string>;
}

/* Elements that already carry an interactive role, which is never overwritten.
   A link announced as a button tells the reader it will not navigate. */
const ALREADY_NAMED = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

export function Pressable({ children, role, ...props }: PressableProps): React.JSX.Element {
  const [scope, play] = useMotion();
  const pressed = useRef(false);
  const semantics = role ?? (ALREADY_NAMED.has(children.type) ? undefined : 'button');

  /* `cloneElement` widens the element's tag back to "string or component", which
     loses the host-element guarantee the prop type just established. The cast
     restores what the input type already proved. */
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
         repeat makes a held control stutter. */
      onPressStart={() => { if (!pressed.current) { pressed.current = true; play('press'); } }}
      onPressEnd={() => { pressed.current = false; }}
    >
      {child}
    </AriaPressable>
  );
}
