'use client';

/* StatusBadge — a semantic symbol in a circular well, followed by a visible word.
 *
 * The catalogue is unusually firm about this one, and each rule is here for a
 * reason a reader can feel:
 *
 *   - **The word carries the meaning.** Symbol and colour are reinforcement,
 *     never the only signal. So the label is required, not optional, and the
 *     symbol is `aria-hidden` — a screen reader that read both would say
 *     "exclamation mark, Action blocked".
 *   - **Never a coloured perimeter stroke.** A status ring around a pill is the
 *     shape Crystal uses for focus, and a danger-coloured one reads as a control
 *     in an error state rather than a fact being reported.
 *   - **Success uses a check mark**, which is the one legitimate use of that
 *     glyph in Crystal: it is information display. A check mark never means
 *     "selected" — selection is label weight alone.
 *
 * `neutral` is the fifth state and has no tested ink pair, because it is the
 * absence of a status rather than one more of them. It takes the surface pair
 * every unremarkable thing takes, and shows no symbol: a glyph would imply a
 * meaning the state does not have.
 *
 * Motion plays on a *change* of status, never on mount. Crystal's rule is that
 * nothing moves at rest and motion is only ever something a person started — a
 * badge that animated as the page loaded would be ambient movement, which was
 * withdrawn from 2.0 deliberately.
 */
import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './StatusBadge.module.scss';

/** The five states the catalogue lists. */
export type StatusBadgeStatus = 'success' | 'attention' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Which status applies. */
  status: StatusBadgeStatus;
  /** The word. Required, because the word is what carries the meaning. */
  children: ReactNode;
}

/* The symbol vocabulary is Crystal's, not this library's. The light and dark rows
   carry the same glyphs — a symbol is not a colour — so one row is read rather
   than the mode being threaded through a component that has no other use for it.
   If they ever diverge, `verify-theme` compares the exported pairs and this line
   is where the divergence would surface. */
const SYMBOL: Record<StatusBadgeStatus, string | null> = {
  success: crystalTokens['feedback.light.success.symbol'],
  attention: crystalTokens['feedback.light.attention.symbol'],
  danger: crystalTokens['feedback.light.danger.symbol'],
  info: crystalTokens['feedback.light.info.symbol'],
  neutral: null,
};

/** The recipes the catalogue assigns. The other three states have none. */
const RECIPE = { success: 'success', attention: 'attention' } as const;

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status, children, className, ...props },
  ref,
) {
  const [scope, play] = useMotion();
  const previous = useRef<StatusBadgeStatus>(status);

  useEffect(() => {
    const changed = previous.current !== status;
    previous.current = status;
    if (!changed) return;
    const recipe = status === 'success' || status === 'attention' ? RECIPE[status] : null;
    if (recipe) play(recipe);
  }, [status, play]);

  const symbol = SYMBOL[status];

  return (
    <span
      {...props}
      ref={mergeRefs(ref, scope)}
      data-status={status}
      className={cx(styles['statusBadge'], className)}
    >
      {symbol === null ? null : (
        <span aria-hidden="true" className={styles['well']}>{symbol}</span>
      )}
      <span className={styles['word']}>{children}</span>
    </span>
  );
});
