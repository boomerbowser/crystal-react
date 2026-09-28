'use client';

/* BottomNavigation — destinations pinned to the bottom of a narrow view.
 *
 * **One Resin plane holding Haze label fills.** The catalogue's material line,
 * and the Haze is doing real work rather than decorating: Resin diffuses
 * whatever scrolls underneath it, so a label sitting directly on the plane is
 * read against a moving, unpredictable backdrop. The 80% content fill gives the
 * text something stable to sit on — and this is the surface where that matters
 * most, because content passes beneath it continuously as the page scrolls.
 *
 * **It is pinned, so it owes the page its height.** A bar fixed to the bottom
 * of the viewport covers whatever is under it, and the last item of a list
 * becomes unreachable. The component publishes its own height as
 * `--cr-bottom-navigation-block-size` on the element, so a layout can reserve
 * the space rather than guessing a number that goes stale the moment the bar
 * gains a row.
 *
 * **Safe-area inset, not a magic number.** On a phone with a home indicator the
 * bottom of the viewport is not the bottom of the usable screen. The padding
 * uses `env(safe-area-inset-bottom)`, which is zero everywhere it does not
 * apply, so there is no branch and nothing to detect.
 *
 * **`aria-current="page"`, never `aria-selected`.** It navigates.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './BottomNavigation.module.scss';

export interface BottomNavigationItem {
  id: string;
  label: string;
  href: string;
  /** Decorative: the label is the name, and it is always shown. */
  icon?: ReactNode;
}

export interface BottomNavigationProps {
  items: BottomNavigationItem[];
  /** The `id` of the destination this page is. */
  currentId?: string;
  /** Names the landmark, so two navigation regions are distinguishable. */
  'aria-label'?: string;
  className?: string;
}

export function BottomNavigation({
  items, currentId, className, ...props
}: BottomNavigationProps): React.JSX.Element {
  const [height, setHeight] = useState<number | null>(null);
  /* Measured rather than declared. A height written into a token is right until
     somebody adds a second line to a label, and wrong silently after. */
  const measure = useCallback((node: HTMLElement | null) => {
    if (node) setHeight(node.getBoundingClientRect().height);
  }, []);

  return (
    <nav
      ref={measure}
      aria-label={props['aria-label'] ?? 'Destinations'}
      className={cx(styles['bar'], 'cr-dock', className)}
      style={height === null ? undefined : { ['--cr-bottom-navigation-block-size' as string]: `${height}px` }}
    >
      <ul className={cx(styles['list'])}>
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id} className={cx(styles['slot'])}>
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
