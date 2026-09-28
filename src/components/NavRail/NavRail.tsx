'use client';

/* NavRail — the persistent vertical destination list.
 *
 * **Frost, not Resin.** The catalogue's material line is "Frost panel, Resin
 * active destination", and the hierarchy is the reason: a rail is part of the
 * page's structure, sitting between the Plastic foundation and the content. It
 * is not floating above anything. The active destination *is* Resin, which is
 * what makes it read as lifted off the rail rather than painted onto it.
 *
 * **Collapsing must not remove the name.** Collapsed, the rail shows icons
 * only — and an icon with no accessible name is an unlabelled link, which is the
 * most common way a rail like this becomes unusable without sight. The label
 * text is kept in the DOM and hidden visually rather than removed, so the
 * accessible name is the same string in both states and nothing has to be
 * duplicated into an `aria-label` that can drift from the label beside it.
 *
 * **`aria-current="page"`, never `aria-selected`.** The same rule `NavLink`
 * states: `aria-selected` belongs to a widget with a selection model, and
 * arriving somewhere is not picking an option. The rail marks location.
 *
 * **Selection is not drawn beside the label.** Crystal withdrew the leading
 * mark because a column that appears only for the active entry shifts every
 * label the moment you navigate. What changes here is the destination's own
 * material and its label weight — the whole row, not a mark next to it.
 */
import type { ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
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
  /** A count or status, trailing. Hidden when collapsed — there is no room. */
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
  /** Rendered under the destinations — a collapse toggle, an account button. */
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
              <a
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
              </a>
            </li>
          );
        })}
      </ul>
      {footer ? <div className={cx(styles['footer'])}>{footer}</div> : null}
    </nav>
  );
}
