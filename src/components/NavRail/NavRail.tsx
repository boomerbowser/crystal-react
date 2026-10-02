'use client';

/* NavRail: the persistent vertical destination list.
 *
 * The rail is Frost. A rail is part of the page's structure, between the
 * Plastic foundation and the content, and does not float above anything. Its
 * destinations are Crystal's navigation entries, and the current one is drawn
 * at weight 800 on the surface-alt fill with the location dot.
 *
 * Collapsing must not remove the name. Collapsed, the rail shows icons only,
 * and an icon with no accessible name is an unlabelled link. The label text
 * stays in the DOM and is hidden visually, so the accessible name is the same
 * string in both states and no `aria-label` has to duplicate the label.
 *
 * The rail uses `aria-current="page"` and never `aria-selected`, the same rule
 * `NavLink` states: `aria-selected` belongs to a widget with a selection model,
 * and arriving somewhere is not picking an option. The rail marks location.
 *
 * Nothing is drawn beside the label to mark selection. Crystal withdrew the
 * leading mark because a column that appears only for the active entry shifts
 * every label the moment you navigate. The destination's own material and its
 * label weight change instead, across the whole row.
 */
import type { ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { CurrentLink } from '../NavLink/CurrentLink.js';
import styles from './NavRail.module.scss';

export interface NavRailItem {
  /** Stable identity, and the key. */
  id: string;
  /** The name. Shown expanded, and the accessible name in both states. */
  label: string;
  /** Where it goes. */
  href: string;
  /** Decorative: the label is the name, and the icon never replaces it. */
  icon?: ReactNode;
  /** A count or status, trailing. Hidden when collapsed, for lack of room. */
  badge?: ReactNode;
}

export interface NavRailProps {
  items: NavRailItem[];
  /** The `id` of the destination this page is. */
  currentId?: string;
  /** Icons only. The labels stay in the accessibility tree. */
  isCollapsed?: boolean;
  /**
   * Names the landmark. A page with more than one navigation region needs
   * these to be distinguishable, and "Navigation" twice is not.
   */
  'aria-label'?: string;
  /** Rendered under the destinations: a collapse toggle, an account button. */
  footer?: ReactNode;
  className?: string;
}

export function NavRail({
  items, currentId, isCollapsed = false, footer, className, ...props
}: NavRailProps): React.JSX.Element {
  return (
    <nav
      aria-label={props['aria-label'] ?? 'Main'}
      data-collapsed={isCollapsed || undefined}
      className={cx(styles['rail'], className)}
    >
      <ul className={cx(styles['list'])}>
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id}>
              <CurrentLink
                isCurrent={isCurrent}
                href={item.href}
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
                className={cx(styles['item'], 'cr-nav-item')}
              >
                {item.icon ? (
                  <span className={cx(styles['icon'])} aria-hidden="true">{item.icon}</span>
                ) : null}
                {/* Never unmounted. Hidden visually when collapsed, so the
                    accessible name is one string in both states. */}
                <span className={cx(styles['label'])}>{item.label}</span>
                {item.badge !== undefined && !isCollapsed
                  ? <>{' '}<span className={cx(styles['badge'])}>{item.badge}</span></>
                  : null}
              </CurrentLink>
            </li>
          );
        })}
      </ul>
      {footer ? <div className={cx(styles['footer'])}>{footer}</div> : null}
    </nav>
  );
}
