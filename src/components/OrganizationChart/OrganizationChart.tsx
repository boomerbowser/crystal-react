'use client';

/* OrganizationChart — a hierarchy drawn as connected nodes.
 *
 * Drawn as a *vertical* hierarchy with connectors rather than the top-down boxes
 * a diagram tool would produce, and that is a decision about who this is for.
 * The catalogue's semantics are "a tree; collapse state is announced, and the
 * chart is navigable by keyboard", and the top-down layout is the one that makes
 * both hard: the DOM order that reads correctly is depth-first, the visual order
 * is breadth-first, and every implementation that reconciles them does it by
 * positioning absolutely and leaving the keyboard behind. A vertical hierarchy
 * has the same connectors, the same collapse, the same reading order, and React
 * Aria's tree keyboard behaviour for nothing.
 *
 * It is `treegrid` rather than `tree`, which is M-3's decision and applies here
 * for the same reason: a node carries a disclosure control *and* is selectable,
 * and the ARIA tree pattern has no key left to reach a control inside an item.
 *
 * What makes it a chart rather than `TreeView` is the material. `TreeView` is a
 * list of rows with indentation guides; this is a set of **Haze node boxes** on
 * whatever surrounds them, joined by connectors in the rim colour — the
 * catalogue's own words for both.
 */
import {
  createContext, useContext, useEffect, useRef,
  type CSSProperties, type ReactNode,
} from 'react';
import {
  Tree, TreeItem, TreeItemContent, Button,
  type TreeProps as AriaTreeProps, type Key,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './OrganizationChart.module.scss';

export interface OrganizationNode {
  /** Stable across renders, and what `expandedKeys` names. */
  id: string;
  /** Who or what this node is. */
  name: ReactNode;
  /** Their role, shown under the name. */
  role?: ReactNode;
  /** An avatar, a badge — whatever belongs beside the name. */
  leading?: ReactNode;
  /** Typeahead string when `name` is not a plain string. */
  textValue?: string;
  children?: readonly OrganizationNode[];
}

export interface OrganizationChartProps
  extends Omit<AriaTreeProps<OrganizationNode>, 'className' | 'style' | 'children' | 'items'> {
  /** The roots, in order. */
  items: readonly OrganizationNode[];
  /** Names the chart. Two on a page are otherwise the same tree. */
  label: string;
  className?: string;
}

/* False until somebody expands something, so a node that was on the page when it
   loaded does not play an arrival. The flag flips on the expansion event rather
   than after the first commit, because a collection renders its rows in a later
   pass and a mount-effect flag is already true by the time they arrive. */
const Settled = createContext({ current: false });

const ChevronIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m10 8 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function OrganizationChart(
  { items, label, className, onExpandedChange, ...props }: OrganizationChartProps,
): ReactNode {
  const settled = useRef({ current: false });
  const handleExpandedChange = (keys: Set<Key>): void => {
    settled.current.current = true;
    onExpandedChange?.(keys);
  };

  return (
    <Settled.Provider value={settled.current}>
      <Tree
        {...props}
        aria-label={label}
        items={items}
        onExpandedChange={handleExpandedChange}
        className={cx(styles['chart'], className)}
      >
        {(node: OrganizationNode) => <Node node={node} />}
      </Tree>
    </Settled.Provider>
  );
}

function Node({ node }: { node: OrganizationNode }): ReactNode {
  return (
    <TreeItem
      id={node.id}
      textValue={typeof node.name === 'string' ? node.name : (node.textValue ?? node.id)}
      className={cx(styles['item'])}
    >
      <TreeItemContent>
        {({ level, hasChildItems }) => (
          <NodeBox node={node} level={level} hasChildItems={hasChildItems} />
        )}
      </TreeItemContent>
      {/* A nested collection, which is what lets React Aria compute the level,
          the set size and the position within it — and what makes the collapse
          state something it can announce rather than something drawn. */}
      {node.children?.map((child) => <Node key={child.id} node={child} />)}
    </TreeItem>
  );
}

function NodeBox(
  { node, level, hasChildItems }: { node: OrganizationNode; level: number; hasChildItems: boolean },
): ReactNode {
  const settled = useContext(Settled);
  const [scope, play] = useMotion();

  useEffect(() => {
    if (settled.current) void play('accordion-in');
  }, [settled, play]);

  return (
    <div
      ref={scope as never}
      className={cx(styles['row'])}
      /* The depth as a number, so one rule indents every level and one gradient
         draws every connector. CSS cannot read `aria-level`. */
      style={{ '--cr-tree-level': level - 1 } as CSSProperties}
    >
      {hasChildItems ? (
        <Button slot="chevron" className={cx(styles['chevron'], 'cr-bare')}>{ChevronIcon}</Button>
      ) : (
        <span aria-hidden="true" className={cx(styles['chevron'], styles['chevronEmpty'])} />
      )}
      <div className={cx(styles['node'])}>
        {node.leading ? <span className={styles['leading']}>{node.leading}</span> : null}
        <span className={styles['names']}>
          <span className={styles['name']}>{node.name}</span>
          {node.role === undefined ? null : <span className={styles['role']}>{node.role}</span>}
        </span>
      </div>
    </div>
  );
}
