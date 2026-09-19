'use client';

/* Breadcrumbs.
 *
 * React Aria owns the ordered list, the link semantics and `aria-current="page"`
 * on the last crumb. Crystal owns the landmark, the separator, the collapse and
 * the treatment of the current entry.
 *
 * The landmark is written here because React Aria does not supply one: its
 * `Breadcrumbs` renders a bare `<ol>`, and the catalogue asks for a `nav`
 * landmark holding an ordered list. Without the `<nav>` a screen-reader user has
 * no way to jump to the trail, and with several trails on a page no way to tell
 * them apart.
 *
 * **The current crumb is label weight, not colour.** It is also the one crumb
 * that is not a link, because a link to the page you are on is a promise that
 * nothing happens. React Aria drops the `href` on the last child for exactly
 * that reason, so the trail ends in text.
 *
 * **A collapsed crumb is hidden, never removed.** The catalogue asks for the
 * middle to collapse, and the reason to collapse the middle rather than the end
 * is that the two crumbs carrying the most meaning are the root and the page you
 * are on. What is collapsed goes into a menu that says how many it holds; a trail
 * that simply truncates deletes navigation silently.
 *
 * The collapse is declarative — `maxItems` — rather than measured from the
 * available width. The catalogue's wording is "when space is short", and a
 * width-measured version is possible: `OverflowList` already does the measuring
 * pass in this library. It is not used here because it drops from the end, which
 * for a trail means dropping the current page, and because a trail that
 * rearranges itself while somebody is reading it is worse than one that does not.
 * Mantine, MUI and Ant Design all take the declarative route for the same reason.
 */
import { type ReactNode } from 'react';
import {
  Breadcrumbs as AriaBreadcrumbs,
  Breadcrumb,
  Link,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { Menu, MenuItem, MenuTrigger } from '../Menu/index.js';
import { IconButton } from '../IconButton/index.js';
import styles from './Breadcrumbs.module.scss';

const SeparatorIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const EllipsisIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);

export interface Crumb {
  /** Identifies the crumb. Stable across renders. */
  id: string;
  label: ReactNode;
  /** Omitted on the current page, which is text rather than a link. */
  href?: string;
  onAction?: () => void;
}

export interface BreadcrumbsProps
  extends Omit<AriaBreadcrumbsProps<Crumb>, 'className' | 'style' | 'children' | 'items'> {
  /** The trail, root first. The last entry is the current page. */
  items: readonly Crumb[];
  /**
   * Collapse the middle once the trail is longer than this. The first and last
   * crumbs always survive; everything between them moves into a menu. Omitted,
   * nothing collapses.
   */
  maxItems?: number;
  /** Names the landmark, so several trails on a page can be told apart. */
  label?: string;
  className?: string;
}

/* Text for the disclosure, so the count is announced rather than implied.
 *
 * Always plural, and that is not an oversight. A collapse hides everything
 * between the first and the last crumb, so hiding exactly one would mean a trail
 * of three — and putting one crumb behind a disclosure saves no room and costs a
 * click. `collapses` below refuses that case, so `count` is never 1. */
function collapsedLabel(count: number): string {
  return `Show ${count} hidden breadcrumbs`;
}

export function Breadcrumbs({
  items, maxItems, label = 'Breadcrumb', className, ...props
}: BreadcrumbsProps): React.JSX.Element {
  /* Two conditions, and the second is the one worth stating. A collapse always
     leaves the first crumb, the disclosure and the last crumb, so it hides
     `length - 2`. Hiding one of those is not a saving: the disclosure occupies
     roughly the room the crumb did and the crumb now costs a click to reach. So
     a trail shorter than four never collapses, whatever `maxItems` says. */
  const collapses = maxItems !== undefined && items.length > maxItems && items.length >= 4;
  const hidden = collapses ? items.slice(1, items.length - 1) : [];
  const visible = collapses ? [items[0]!, items[items.length - 1]!] : items;

  return (
    <nav aria-label={label} className={className}>
    <AriaBreadcrumbs {...props} className={cx(styles['trail'])}>
      {visible.map((item, index) => (
        <Breadcrumb key={item.id} className={cx(styles['crumb'])}>
          <Link
            className={cx(styles['link'])}
            {...(item.href === undefined ? {} : { href: item.href })}
            {...(item.onAction === undefined ? {} : { onPress: item.onAction })}
          >
            {item.label}
          </Link>
          {/* The separator belongs to the crumb before the gap, so the last crumb
              does not trail one. It is decorative: the list structure is what
              carries the relationship to a screen reader, and a chevron read out
              between every pair is noise. */}
          {index < visible.length - 1 ? (
            <span className={cx(styles['separator'])} aria-hidden="true">{SeparatorIcon}</span>
          ) : null}
          {collapses && index === 0 ? (
            <>
              <MenuTrigger>
                {/* A React Aria `Button`, not a bare one. `MenuTrigger` hands
                    its press behaviour down through context, and a plain
                    `<button>` never receives it — the menu simply does not
                    open, silently, which is how this was found. */}
                <IconButton
                  label={collapsedLabel(hidden.length)}
                  icon={EllipsisIcon}
                  className={cx(styles['disclosure'])}
                />
                <Menu label={collapsedLabel(hidden.length)}>
                  {hidden.map((crumb) => (
                    <MenuItem
                      key={crumb.id}
                      id={crumb.id}
                      {...(crumb.href === undefined ? {} : { href: crumb.href })}
                      {...(crumb.onAction === undefined ? {} : { onAction: crumb.onAction })}
                    >
                      {crumb.label}
                    </MenuItem>
                  ))}
                </Menu>
              </MenuTrigger>
              <span className={cx(styles['separator'])} aria-hidden="true">{SeparatorIcon}</span>
            </>
          ) : null}
        </Breadcrumb>
      ))}
    </AriaBreadcrumbs>
    </nav>
  );
}
