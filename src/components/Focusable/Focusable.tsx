'use client';

/* Focusable.
 *
 * Adds a tab stop to whatever it wraps, with Crystal's focus ring and without
 * inventing a role. React Aria's `Focusable` supplies the behaviour — the
 * focus-visible bookkeeping that distinguishes a keyboard focus from a pointer
 * one, and the `excludeFromTabOrder` escape hatch — and Crystal supplies the
 * appearance, which since this release its own stylesheet gives to any
 * `[tabindex]` rather than only to the native controls.
 *
 * "Without inventing a role" is the part to be careful about. A focusable div is
 * announced as whatever it already was, which is usually nothing — so if the
 * element *does* something when activated it wants `Pressable` and a button role,
 * not this. Use this for something that must be reachable but is not a control:
 * a region a keyboard user needs to scroll, an element that receives programmatic
 * focus after an action.
 */
import type { DOMAttributes, ReactElement } from 'react';
import { Focusable as AriaFocusable } from 'react-aria-components';

/* React Aria clones the child to attach DOM handlers, so it must be a host
   element — a `div`, a `span`, an `a` — rather than a component. The type says
   so, and saying it here turns a runtime surprise into a compile error. */
type HostElement = ReactElement<DOMAttributes<Element>, string>;

export interface FocusableProps {
  /** Focusable but skipped by Tab — for something reached programmatically. */
  excludeFromTabOrder?: boolean;
  isDisabled?: boolean;
  /** Exactly one host element, which receives the focus behaviour and the ring. */
  children: HostElement;
}

export function Focusable({ children, ...props }: FocusableProps): React.JSX.Element {
  return <AriaFocusable {...props}>{children}</AriaFocusable>;
}
