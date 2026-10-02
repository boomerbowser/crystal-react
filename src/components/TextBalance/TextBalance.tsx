'use client';

/* TextBalance.
 *
 * Wraps text so the lines come out even, instead of a long first line and one
 * word on the second. `Title` does this by default for headings. This component
 * applies the same treatment to other short, prominent text, such as a card's
 * lead-in, a stat's caption or a button's two-word label.
 *
 * Purely visual: the text content is unchanged (the catalogue's wording).
 * `text-wrap: balance` only chooses break points and never edits the string.
 *
 * A browser without `text-wrap` wraps as it always did, so there is nothing to
 * detect and nothing to polyfill. `pretty` is offered for longer runs, where the
 * goal is to avoid a single-word last line instead of balancing every line.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';

export interface TextBalanceProps extends HTMLAttributes<HTMLElement> {
  /**
   * `balance` evens every line and suits a few words. `pretty` only prevents a
   * lonely last line and suits a paragraph. Browsers limit `balance` to a few
   * lines, so on a paragraph it has no effect.
   */
  mode?: 'balance' | 'pretty';
  as?: ElementType;
  children?: ReactNode;
}

export const TextBalance = forwardRef<HTMLElement, TextBalanceProps>(function TextBalance(
  { mode = 'balance', as: Element = 'span', style, children, ...props },
  ref,
) {
  return (
    <Element {...props} ref={ref} style={{ textWrap: mode, ...style } as CSSProperties}>
      {children}
    </Element>
  );
});
