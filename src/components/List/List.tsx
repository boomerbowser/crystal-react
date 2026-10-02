'use client';

/* List. Ordered or unordered rows.
 *
 * "Interactive rows are buttons or links, not clickable divs." A div with an
 * `onClick` is not reachable by keyboard, is not announced as anything, and
 * cannot be opened in a new tab when it was really a link. So `ListItem` takes
 * `href` or `onPress` and renders the element each of those means. There is no
 * third option that makes a row pressable without saying what it is.
 *
 * Motion: an item that mounts after the list has settled has arrived, and
 * plays `list-in`. An item present on the first render was always there and
 * does not move, because nothing moves at rest. React's own mount semantics
 * answer that question exactly, so the list carries a "settled" flag and does
 * not diff keys.
 *
 * A removed item plays `list-out`. The list wraps its rows in
 * `AnimatePresence`, which keeps a removed row mounted until its recipe has
 * finished, and the row is inert while it plays.
 */
import {
  Children, createContext, useContext, useEffect, useRef, useState,
  type HTMLAttributes, type LiHTMLAttributes, type ReactNode,
} from 'react';
import { AnimatePresence, usePresence } from 'motion/react';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './List.module.scss';

/** False during the first commit, true afterwards. An item mounting while it is
 *  true is an arrival. */
const Settled = createContext(false);

export interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children?: ReactNode;
  /** Ordered, when the numbers mean something. */
  ordered?: boolean;
  /** Hairline separators between rows. */
  separated?: boolean;
  /** Shown instead of the list when there is nothing in it. */
  empty?: ReactNode;
}

export function List({ children, ordered = false, separated = false, empty, className, ...props }: ListProps): ReactNode {
  const [settled, setSettled] = useState(false);
  useEffect(() => { setSettled(true); }, []);

  const isEmpty = children === undefined || children === null
    || (Array.isArray(children) && children.length === 0);
  if (isEmpty && empty !== undefined) {
    return <div className={cx(styles['empty'], className)}>{empty}</div>;
  }

  const Element = ordered ? 'ol' : 'ul';
  return (
    <Settled.Provider value={settled}>
      <Element
        {...props}
        className={cx(styles['list'], separated ? styles['separated'] : undefined, className)}
      >
        {/* Held in presence so a removed row can be seen leaving. Keyed through
            `Children.toArray`, which keeps a product's own keys and gives static
            children stable ones, so two unkeyed rows are never taken for one. */}
        <AnimatePresence initial={false}>{Children.toArray(children)}</AnimatePresence>
      </Element>
    </Settled.Provider>
  );
}

export interface ListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
  children: ReactNode;
  /** An icon, an avatar, a thumbnail. */
  leading?: ReactNode;
  /** Controls that belong to the row, outside the row's own press target. */
  trailing?: ReactNode;
  /** Makes the row a link. */
  href?: string;
  /** Makes the row a button. */
  onPress?: () => void;
  /** Shown as chosen. Selection is label weight, here as everywhere. */
  isSelected?: boolean;
}

export function ListItem({
  children, leading, trailing, href, onPress, isSelected = false, className, ...props
}: ListItemProps): ReactNode {
  const settled = useContext(Settled);
  const [scope, play] = useMotion({ once: true });
  const arrived = useRef(settled);

  useEffect(() => {
    /* `arrived` is read from the context as it was at mount, so a row that was
       in the first render never plays, however many times the list re-renders. */
    if (arrived.current) void play('list-in');
  }, [play]);

  /* `list-out` before a removed row goes (the list holds it in presence), and
     the row is inert while it plays. */
  const [isPresent, safeToRemove] = usePresence();
  useEffect(() => {
    if (isPresent || !safeToRemove) return;
    (scope.current as HTMLElement | null)?.setAttribute('inert', '');
    void play('list-out').finally(safeToRemove);
  }, [isPresent, safeToRemove, play, scope]);

  /* `reorder` when this row has moved among the others: its position changed
     while the number of rows did not. An insertion shifts every row after it,
     and none of those rows was reordered. */
  const place = useRef<{ index: number; of: number } | null>(null);
  useEffect(() => {
    const row = scope.current as HTMLElement | null;
    const parent = row?.parentElement;
    if (!row || !parent) return;
    const now = { index: Array.prototype.indexOf.call(parent.children, row), of: parent.children.length };
    const before = place.current;
    place.current = now;
    if (settled && before !== null && before.of === now.of && before.index !== now.index) void play('reorder');
  });

  const body = (
    <>
      {leading === undefined ? null : <span className={styles['leading']}>{leading}</span>}
      <span className={styles['body']}>{children}</span>
    </>
  );

  return (
    <li {...props} ref={scope as never} className={cx(styles['item'], className)}>
      {href !== undefined ? (
        <a href={href} className={styles['row']} aria-current={isSelected ? 'true' : undefined}>{body}</a>
      ) : onPress !== undefined ? (
        <button type="button" onClick={onPress} className={styles['row']} aria-pressed={isSelected}>{body}</button>
      ) : (
        <span className={styles['row']} data-selected={isSelected ? '' : undefined}>{body}</span>
      )}
      {trailing === undefined ? null : <span className={styles['trailing']}>{trailing}</span>}
    </li>
  );
}
