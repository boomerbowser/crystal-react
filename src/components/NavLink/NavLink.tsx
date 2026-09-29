'use client';

/* NavLink — a destination in a navigation surface.
 *
 * **`aria-current="page"`, never `aria-selected`.** The catalogue names the rule
 * and the reason is what a reader is told: `aria-selected` belongs to a widget
 * with a selection model — a tablist, a listbox, a grid — and announcing a
 * destination that way tells somebody they have picked an option inside a
 * control, when what they have actually done is arrive somewhere. React Aria's
 * `Link` does not offer `aria-selected`; this makes sure nothing adds it.
 *
 * **The current location is a dot, and selection is weight — they are different
 * things.** Crystal's indicator ranking puts current location above selection
 * precisely because the two coexist: an entry can be the page you are on *and*
 * the one you have picked in a list. The dot says location. The weight says the
 * same thing here for the reader who cannot resolve a 6px dot, which is the
 * non-colour, non-shape signal underneath it.
 *
 * **Both are Crystal's.** The link wears `.cr-nav-item`, which since 2.3.0 draws
 * the dot itself (D-22): flat, primary, on `aria-current` only, inside the
 * entry's own inline-start padding, so the label is at the same pixel whether or
 * not the entry is current. Until then this component drew its own dot in a slot
 * it reserved for the same reason; under 2.3.0 that would be two dots, so it is
 * gone (R-26).
 */
import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import styles from './NavLink.module.scss';

export interface NavLinkProps extends Omit<LinkProps, 'className' | 'style' | 'children' | 'href'> {
  /** Where it goes. A navigation entry that acts rather than navigates is a `Button`. */
  href: string;
  children: ReactNode;
  /** An icon before the label. Decorative: the label is the name. */
  icon?: ReactNode;
  /** Trailing content — a count, a chevron, a badge. */
  trailing?: ReactNode;
  /** This is the page you are on. */
  isCurrent?: boolean;
  className?: string;
}

export function NavLink({
  href, children, icon, trailing, isCurrent = false, className, ...props
}: NavLinkProps): React.JSX.Element {
  return (
    <Link
      {...props}
      href={href}
      {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
      className={cx(styles['navLink'], 'cr-nav-item', className)}
    >
      {icon ? <span className={cx(styles['icon'])} aria-hidden="true">{icon}</span> : null}
      <span className={cx(styles['label'])}>{children}</span>
      {/* The space is content, not formatting. Without it the accessible name
          accumulates as "Inbox12" — one token, announced as one word — because
          the name computation joins adjacent inline content with nothing between
          it. A whitespace-only text node in a flex container is never rendered
          as a flex item, so it costs no pixel. */}
      {trailing ? <>{' '}<span className={cx(styles['trailing'])}>{trailing}</span></> : null}
    </Link>
  );
}
