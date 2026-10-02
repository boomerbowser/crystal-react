'use client';

/* Dock: a floating group of destinations.
 *
 * There is one Resin plane for the whole dock. The catalogue says "one
 * floating Resin plane holding labelled destinations". A row of separate Resin
 * pills is a row of separate floating objects, with Resin diffusing Resin at
 * their edges, which the material contract forbids. The plane floats and the
 * destinations are painted on it.
 *
 * The labels share one Stone backing. Stone is Crystal's label backing (55% in
 * light, 60% in dark), and here it runs behind the whole label row instead of
 * behind each label. A per-label backing would draw a box around every
 * destination and turn the dock into a segmented control, which is a different
 * component: a segmented control picks a view, and a dock goes somewhere.
 *
 * The selected destination takes a primary fill. The destination itself changes
 * material, and no mark is placed beside its label, because Crystal withdrew
 * leading marks for shifting the label they point at. The label also goes
 * heavier, which is the signal that survives a monochrome rendering and forced
 * colours.
 *
 * The current destination has `aria-current="page"`, never `aria-selected`,
 * because a dock navigates.
 */
import type { ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { CurrentLink } from '../NavLink/CurrentLink.js';
import styles from './Dock.module.scss';

export interface DockItem {
  id: string;
  label: string;
  href: string;
  /** Decorative: the label is the name. */
  icon?: ReactNode;
}

export interface DockProps {
  items: DockItem[];
  /** The `id` of the destination this page is. */
  currentId?: string;
  /** Names the landmark, so two navigation regions are distinguishable. */
  'aria-label'?: string;
  className?: string;
}

export function Dock({ items, currentId, className, ...props }: DockProps): React.JSX.Element {
  return (
    <nav aria-label={props['aria-label'] ?? 'Destinations'} className={cx(styles['dock'], 'cr-dock', className)}>
      <ul className={cx(styles['group'], 'cr-dock-inner')}>
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id}>
              <CurrentLink
                isCurrent={isCurrent}
                href={item.href}
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
                className={cx(styles['item'])}
              >
                {item.icon ? (
                  <span className={cx(styles['icon'])} aria-hidden="true">{item.icon}</span>
                ) : null}
                <span className={cx(styles['label'])}>{item.label}</span>
              </CurrentLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
