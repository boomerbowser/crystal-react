'use client';

/* TextBalance.
 *
 * Wraps text so the lines come out even rather than ragged, with a long first
 * line and one word on the second. `Title` does this by default because a heading
 * is where it matters most; this is the same treatment for anything else short
 * and prominent — a card's lead-in, a stat's caption, a button's two-word label.
 *
 * Purely visual: the text content is unchanged, which is the catalogue's wording
 * and worth stating because `text-wrap: balance` is sometimes mistaken for
 * something that edits the string. It does not; it chooses break points.
 *
 * The fallback is the absence of the feature. A browser without `text-wrap`
 * wraps as it always did, which is the behaviour being improved on rather than
 * replaced — so there is nothing to detect and nothing to polyfill. `pretty` is
 * offered for longer runs, where balancing every line is the wrong goal and
 * avoiding a single-word last line is the right one.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';

export interface TextBalanceProps extends HTMLAttributes<HTMLElement> {
  /**
   * `balance` evens every line and suits a few words. `pretty` only prevents a
   * lonely last line and suits a paragraph — browsers limit `balance` to a few
   * lines anyway, so using it on a paragraph quietly does nothing.
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
