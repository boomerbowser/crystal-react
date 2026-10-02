'use client';

/* A destination link that marks becoming the current one.
 *
 * The catalogue gives every navigation surface `selection`: the rail, the dock,
 * the bottom bar, a table of contents. It plays when a destination becomes
 * current without the navigation remounting, such as a client-side route change
 * or a scroll spy moving on. It does not play on the page load that renders a
 * destination current, because nobody moved there. On a full page navigation
 * the whole bar remounts, so nothing plays, by the same rule.
 *
 * The four share this component so the rule is written once. Each caller still
 * sets `aria-current`: `page` for a destination, `location` for a place in a
 * document.
 */
import type { AnchorHTMLAttributes } from 'react';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';

export interface CurrentLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isCurrent: boolean;
}

export function CurrentLink({ isCurrent, ...props }: CurrentLinkProps): React.JSX.Element {
  const scope = useChangeMotion(isCurrent, entered('selection'));
  return <a ref={scope as never} {...props} />;
}
