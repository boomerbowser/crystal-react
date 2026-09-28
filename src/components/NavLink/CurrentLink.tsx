'use client';

/* A destination link that marks becoming the current one.
 *
 * The catalogue gives every navigation surface `selection` — the rail, the dock,
 * the bottom bar, a table of contents. It plays when a destination *becomes*
 * current without the navigation remounting: a client-side route change, a
 * scroll spy moving on. It does not play on the page load that renders a
 * destination current, because nobody moved there; on a full page navigation
 * the whole bar remounts and so nothing plays, which is the same rule.
 *
 * Shared by the four so the rule is written once. `aria-current` is still each
 * caller's — `page` for a destination, `location` for a place in a document.
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
