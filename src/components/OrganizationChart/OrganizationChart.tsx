'use client';

/* OrganizationChart: a hierarchy drawn as connected nodes.
 *
 * It is drawn as a vertical hierarchy with connectors, in place of the top-down
 * boxes a diagram tool would produce, as a decision about who the chart is
 * for. The catalogue's semantics are "a tree; collapse state is
 * announced, and the chart is navigable by keyboard", and a top-down layout
 * makes both hard: the DOM order that reads correctly is depth-first, the
 * visual order is breadth-first, and implementations that reconcile them
 * position absolutely and leave the keyboard behind. A vertical hierarchy has
 * the same connectors, the same collapse and the same reading order, and gets
 * React Aria's tree keyboard behaviour for free.
 *
 * It is `treegrid` and not `tree`, by M-3's decision, which applies here for
 * the same reason: a node carries a disclosure control and is also selectable,
 * and the ARIA tree pattern has no key left to reach a control inside an item.
 *
 * The material is what separates it from `TreeView`. `TreeView` is a list of
 * rows with indentation guides. This is a set of Haze node boxes on whatever
 * surrounds them, joined by connectors in the rim colour, which are the
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
  /** Whatever belongs beside the name, such as an avatar or a badge. */
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
   loaded does not play an arrival. The flag flips on the expansion event. A
   collection renders its rows in a later pass, so a flag set in a mount effect
   would already be true by the time they arrive. */
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
      {/* A nested collection, so React Aria can compute the level, the set
          size and the position within it, and can announce the collapse
          state. */}
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
