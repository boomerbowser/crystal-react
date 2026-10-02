'use client';

/* Focusable.
 *
 * Adds a tab stop to whatever it wraps, with Crystal's focus ring and without
 * inventing a role. React Aria's `Focusable` supplies the behaviour, which is
 * the focus-visible bookkeeping that tells keyboard focus from pointer focus
 * and the `excludeFromTabOrder` option. Crystal supplies the appearance, which its
 * stylesheet gives to any `[tabindex]` as well as to the native controls.
 *
 * "Without inventing a role" needs care. A focusable div is announced as
 * whatever it already was, which is usually nothing. If the element does
 * something when activated, use `Pressable` and a button role instead. Use this
 * for something that must be reachable but is not a control, such as a region
 * a keyboard user needs to scroll or an element that receives programmatic
 * focus after an action.
 */
import type { DOMAttributes, ReactElement } from 'react';
import { Focusable as AriaFocusable } from 'react-aria-components';

/* React Aria clones the child to attach DOM handlers, so it must be a host
   element (a `div`, a `span`, an `a`) and not a component. The type enforces
   this at compile time instead of failing at runtime. */
type HostElement = ReactElement<DOMAttributes<Element>, string>;

export interface FocusableProps {
  /** Focusable but skipped by Tab, for something reached programmatically. */
  excludeFromTabOrder?: boolean;
  isDisabled?: boolean;
  /** Exactly one host element, which receives the focus behaviour and the ring. */
  children: HostElement;
}

export function Focusable({ children, ...props }: FocusableProps): React.JSX.Element {
  return <AriaFocusable {...props}>{children}</AriaFocusable>;
}
