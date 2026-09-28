'use client';

/* NavigationTree — a tree whose items are destinations rather than data.
 *
 * `TreeView` and this are the two halves M-3 separated. A `tree-view` row is
 * selectable; a navigation tree's rows are destinations, and "which one am I
 * on" is `aria-current` rather than selection. React Aria ships both and names
 * this one as the catalogue's parity target outright.
 *
 * What it actually renders is worth stating, because the name suggests
 * otherwise: `NavigationTree` is a `treegrid` of pressable rows carrying
 * `data-href`, routed through `RouterProvider` — **not** a nested set of `a`
 * elements. Checked, not assumed.
 *
 * And it does not set `aria-current`. It computes `data-current` and
 * `data-current-ancestor` for styling and stops there, so the catalogue's
 * "aria-current on the active destination" is this library's to supply.
 *
 * Supplying it takes one unusual line, and the two obvious routes were tried
 * first: passing `aria-current` to `NavigationTreeItem` typechecks and is then
 * filtered out of the DOM, and putting it on the row's content leaves it on a
 * descendant of the element a reader actually lands on — in a treegrid the row
 * is the focus stop. So the row element is given the attribute directly, from
 * React Aria's own `isCurrent`, which is the same value its `data-current`
 * comes from.
 *
 * Crystal owns three things here and each is one rule:
 *
 *   - **The row material.** Haze rows, and a 44px row, which is the floor the
 *     catalogue states for a destination.
 *   - **Current marking by label weight.** Not a badge, not a leading mark, not
 *     colour alone — the same rule selection follows everywhere in Crystal. The
 *     soft fill under the current row is the second signal.
 *   - **Expansion motion.** `accordion-in` on a row that arrives because
 *     somebody expanded its parent, and never on the rows that were there when
 *     the page loaded.
 *
 * React Aria matches `selectedRoute` against each item's `href` and hands back
 * `data-current` on the row and `data-current-ancestor` on every ancestor of it,
 * which is what lets a collapsed branch show that the current page is inside it.
 */
import {
  createContext, useContext, useEffect, useRef,
  type CSSProperties, type ReactNode,
} from 'react';
import type { Key } from 'react-aria-components';
import {
  NavigationTree as AriaNavigationTree,
  NavigationTreeItem,
  NavigationTreeItemContent,
  Button,
  type NavigationTreeProps as AriaNavigationTreeProps,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './NavigationTree.module.scss';

export interface NavigationTreeNode {
  /** Stable across renders, and what `expandedKeys` names. */
  id: string;
  label: ReactNode;
  /** Where it goes. A branch may have one; a branch without one only expands. */
  href?: string;
  /** Used as the typeahead string when the label is not a plain string. */
  textValue?: string;
  icon?: ReactNode;
  children?: readonly NavigationTreeNode[];
}

export interface NavigationTreeProps
  extends Omit<AriaNavigationTreeProps<NavigationTreeNode>, 'children' | 'items' | 'className' | 'style'> {
  items: readonly NavigationTreeNode[];
  /** Names the navigation. Two trees on a page are otherwise the same tree. */
  label: string;
  className?: string;
}

/* False until somebody expands something. A row mounting while it is true
   arrived *because* of that expansion; one that was there on the first render
   was always there, and nothing moves at rest.
 *
 * Flipped on the expansion event rather than after the first commit, which is
 * what `TreeView` does and for a reason this component proved the hard way: a
 * collection renders its rows in a later pass, so their effects run *after* the
 * parent's mount effect and every row on the page played on load. */
const Settled = createContext({ current: false });



const ChevronIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m10 8 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function NavigationTree(
  { items, label, className, onExpandedChange, selectedRoute, ...props }: NavigationTreeProps,
): ReactNode {
  const settled = useRef({ current: false });
  const handleExpandedChange = (keys: Set<Key>): void => {
    settled.current.current = true;
    onExpandedChange?.(keys);
  };

  return (
    <Settled.Provider value={settled.current}>
      {/* A `nav`, because this is navigation. React Aria gives the tree its
          roles; the landmark is what lets a reader skip the whole thing. */}
      <nav aria-label={label} className={cx(styles['nav'], className)}>
        <AriaNavigationTree
          {...props}
          aria-label={label}
          items={items}
          onExpandedChange={handleExpandedChange}
          {...(selectedRoute === undefined ? {} : { selectedRoute })}
          className={cx(styles['tree'])}
        >
          {(node: NavigationTreeNode) => <Row node={node} />}
        </AriaNavigationTree>
      </nav>
    </Settled.Provider>
  );
}

function Row({ node }: { node: NavigationTreeNode }): ReactNode {
  return (
    <NavigationTreeItem
      id={node.id}
      textValue={typeof node.label === 'string' ? node.label : (node.textValue ?? node.id)}
      className={cx(styles['item'])}
      {...(node.href === undefined ? {} : { href: node.href })}
    >
      <NavigationTreeItemContent>
        {({ level, hasChildItems, isCurrent }) => (
          <RowContent node={node} level={level} hasChildItems={hasChildItems} isCurrent={isCurrent} />
        )}
      </NavigationTreeItemContent>
      {/* A nested collection, which is what lets React Aria compute the level,
          the set size and the position within it. */}
      {node.children?.map((child) => <Row key={child.id} node={child} />)}
    </NavigationTreeItem>
  );
}

function RowContent(
  { node, level, hasChildItems, isCurrent }:
  { node: NavigationTreeNode; level: number; hasChildItems: boolean; isCurrent: boolean },
): ReactNode {
  const settled = useContext(Settled);
  const [scope, play] = useMotion();

  useEffect(() => {
    if (settled.current) void play('accordion-in');
  }, [settled, play]);

  /* The row, not this element. `aria-current` belongs on the thing a reader
     lands on, and in a treegrid that is the row — which React Aria owns and
     will not take the attribute as a prop. */
  useEffect(() => {
    const row = (scope.current as HTMLElement | null)?.closest('[role="row"]');
    if (!row) return;
    if (isCurrent) row.setAttribute('aria-current', 'page');
    else row.removeAttribute('aria-current');
  }, [isCurrent, scope]);

  return (
    <div
      ref={scope as never}
      className={cx(styles['row'])}
      /* The depth as a number, so one rule indents every level. CSS cannot read
         `aria-level`. */
      style={{ '--cr-tree-level': level - 1 } as CSSProperties}
    >
      {hasChildItems ? (
        <Button slot="chevron" className={cx(styles['chevron'], 'cr-bare')}>{ChevronIcon}</Button>
      ) : (
        /* The chevron's room, held open on a leaf. Without it every leaf label
           sits one chevron to the left of its siblings', and the depth — the one
           thing the indentation shows — stops reading. */
        <span aria-hidden="true" className={cx(styles['chevron'], styles['chevronEmpty'])} />
      )}
      {node.icon ? <span aria-hidden="true" className={cx(styles['icon'])}>{node.icon}</span> : null}
      <span className={cx(styles['label'])}>{node.label}</span>
    </div>
  );
}

export type { Key as NavigationTreeKey };
