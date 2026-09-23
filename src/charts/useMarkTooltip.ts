'use client';

/* Hover and focus, joined, so a chart's tooltip has one index to follow.
 *
 * A chart tooltip answers two different gestures with one panel. The pointer
 * names a mark directly; the keyboard names it through the roving cursor, which
 * is `useMarkNavigation`'s `active`. Keeping one index for both is what stops
 * the panel describing the hovered bar while the ring sits on another.
 *
 * The pointer wins while it is over a mark, because it is the more recent
 * intention: a reader who tabs in and then reaches for the mouse means the
 * mouse. When it leaves, the panel goes back to the focused mark if the plot
 * still has focus, and away if it does not.
 *
 * Escape dismisses, which is the tooltip contract, and "dismissed" lasts until
 * the reader does something else — moves onto another mark, or moves the
 * cursor. A dismissal that outlived the thing dismissed would be a chart whose
 * tooltip never came back.
 */
import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import type { MarkProps } from './useMarkNavigation.js';

export interface MarkNavigationLike {
  active: number;
  containerProps: { onKeyDown: (event: KeyboardEvent) => void };
  markProps: (index: number) => MarkProps;
}

export interface MarkTooltip {
  /** Whether the panel is drawn at all. */
  shown: boolean;
  /** Which mark it describes. Null when nothing is under either cursor. */
  index: number | null;
  containerProps: {
    onKeyDown: (event: KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent) => void;
    onPointerLeave: () => void;
  };
  markProps: (index: number) => MarkProps & { onPointerEnter: () => void };
}

export function useMarkTooltip(marks: MarkNavigationLike): MarkTooltip {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const index = hovered ?? (focused ? marks.active : null);

  return {
    shown: !dismissed && index !== null,
    index,
    containerProps: {
      onKeyDown: (event) => {
        if (event.key === 'Escape') {
          /* Not `preventDefault`: a chart inside a dialog owes the dialog its
             Escape once the tooltip is gone, and the second press is the one
             that closes it. Stopping the first from propagating is enough. */
          if (!dismissed && index !== null) event.stopPropagation();
          setDismissed(true);
          return;
        }
        setDismissed(false);
        marks.containerProps.onKeyDown(event);
      },
      onFocus: () => setFocused(true),
      onBlur: (event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setFocused(false);
      },
      onPointerLeave: () => setHovered(null),
    },
    markProps: (at) => ({
      ...marks.markProps(at),
      onPointerEnter: () => { setHovered(at); setDismissed(false); },
    }),
  };
}

/** Where a mark is and what the panel says about it, in plot pixels. Charts
 *  build one of these per mark, indexed exactly as the marks are. */
export interface MarkTip {
  x: number;
  y: number;
  title: string;
  rows: readonly { name: string; value: string; index?: number }[];
}
