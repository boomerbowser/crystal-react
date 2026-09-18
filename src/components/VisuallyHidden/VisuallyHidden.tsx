'use client';

/* VisuallyHidden.
 *
 * React Aria owns the clipping recipe, and that is the right place for it: the
 * technique is a pile of accumulated browser knowledge — a 1px clipped box rather
 * than `display: none`, which removes the content from the accessibility tree
 * entirely, and rather than `visibility: hidden`, `width: 0` or an off-screen
 * `position`, each of which is dropped by at least one screen reader or breaks
 * right-to-left. Crystal states the rule; React Aria carries the recipe; this
 * file is the binding.
 *
 * The focusable variant is why this is a component and not a class. Content that
 * appears when focused has to be reachable, announced and then hidden again, and
 * `useVisuallyHidden` handles the focus-within bookkeeping. `SkipLink` is built
 * on exactly this.
 */
import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { useVisuallyHidden } from 'react-aria';
import { mergeProps } from 'react-aria';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  /**
   * Become visible when something inside takes focus. A skip link is the
   * canonical case; so is a "press Enter to edit" hint.
   */
  isFocusable?: boolean;
  as?: ElementType;
  children?: ReactNode;
}

export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(function VisuallyHidden(
  { isFocusable = false, as: Element = 'span', children, ...props },
  ref,
) {
  const { visuallyHiddenProps } = useVisuallyHidden({ isFocusable });
  return (
    <Element {...mergeProps(visuallyHiddenProps, props)} ref={ref}>
      {children}
    </Element>
  );
});
