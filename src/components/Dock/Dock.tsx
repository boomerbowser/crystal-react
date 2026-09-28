'use client';

/* Dock — a floating group of destinations.
 *
 * **One Resin plane, not one per destination.** The catalogue says "one
 * floating Resin plane holding labelled destinations", and the singular is the
 * whole design: a row of separate Resin pills is a row of separate floating
 * objects, and Resin diffusing Resin at their edges is the arrangement the
 * material contract forbids. The plane floats; the destinations are painted on
 * it.
 *
 * **The labels share one Stone backing.** Stone is Crystal's label backing —
 * 55% in light, 60% in dark — and here it runs behind the whole label row
 * rather than behind each label. A per-label backing would draw a box around
 * every destination and turn a dock into a segmented control, which is a
 * different component with a different meaning: a segmented control picks a
 * view, a dock goes somewhere.
 *
 * **The selected destination takes a primary fill.** That is a material change
 * to the destination itself, not a mark placed beside its label — Crystal
 * withdrew leading marks because they shift the label they point at. The label
 * also goes heavier, which is the signal that survives a monochrome rendering
 * and forced colours.
 *
 * **`aria-current="page"`, never `aria-selected`.** A dock navigates.
 */
import type { ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
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
              <a
                href={item.href}
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
                className={cx(styles['item'])}
              >
                {item.icon ? (
                  <span className={cx(styles['icon'])} aria-hidden="true">{item.icon}</span>
                ) : null}
                <span className={cx(styles['label'])}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
