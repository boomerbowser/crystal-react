'use client';

/* VisuallyHidden.
 *
 * React Aria owns the clipping recipe, which encodes accumulated browser
 * knowledge. It uses a 1px clipped box. `display: none` removes the content from
 * the accessibility tree entirely, and `visibility: hidden`, `width: 0` or an
 * off-screen `position` are each dropped by at least one screen reader or break
 * right-to-left. Crystal states the rule, React Aria carries the recipe, and this
 * file is the binding.
 *
 * The focusable variant is why this is a component and not a class. Content that
 * appears when focused has to be reachable, announced and then hidden again, and
 * `useVisuallyHidden` handles the focus-within bookkeeping. `SkipLink` is built
 * on it.
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
