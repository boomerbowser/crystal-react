'use client';

/* TreeView.
 *
 * React Aria owns the roles, `aria-expanded`, `aria-level`, `aria-posinset` and
 * `aria-setsize`, the roving tab stop, type-ahead, and the arrow-key contract
 * that makes a tree a tree: right expands or descends, left collapses or
 * ascends, and Home and End reach the ends of the *visible* rows rather than the
 * data. Crystal owns the row, the indentation and its guides, and the marking of
 * the selected row.
 *
 * **It is a `treegrid`, and the catalogue says `tree`.** That is a deliberate
 * divergence, not a miss. A `treeitem` in the plain tree pattern is a single
 * navigable unit and must not contain independently focusable widgets — and
 * Crystal's row contains a disclosure button, which the catalogue also specifies.
 * The two cannot both be honoured. `treegrid` is the pattern ARIA provides for
 * exactly this: rows carry `aria-level` and `aria-expanded` as before, and the
 * keyboard can reach into a row. Everything the catalogue asks for by behaviour
 * — level, expansion, full arrow-key navigation — is present. Recorded as M-3 in
 * the design system's tracker, because changing the catalogue line is Meridian's
 * call rather than this library's.
 *
 * **Selection is label weight.** Not a check mark — in Crystal that means
 * validated — and not a mark set beside the label, which would offset the very
 * label it points at. In a tree that would be doubly wrong, because the label's
 * inline position is already carrying meaning: it is the depth.
 *
 * **The disclosure is a button inside the row, not the row.** A row that both
 * expands and selects on the same press makes one of the two unreachable, and a
 * reader cannot be told which they are about to get. React Aria's `slot="chevron"`
 * button is the separate control, and the row keeps the action.
 *
 * ## Motion, and why it does not play on load
 *
 * Rows revealed by expanding play `accordion-in`. Rows present when the tree
 * first renders play nothing, because **nothing in Crystal moves at rest** and a
 * tree animating itself into existence on page load is exactly that.
 *
 * The first attempt at telling the two apart used React's effect ordering —
 * children before parents, so a row mounting with the tree would run its effect
 * before the tree's own. It does not work here, and the reason is worth keeping:
 * React Aria builds its collection in one commit and renders the rows in the
 * next, so **every** row mounts after the tree's mount effect, including the
 * first ones. Measured, not assumed: the initial render asked for two animations.
 *
 * What is used instead is the plainer thing. The tree becomes "live" the first
 * time somebody expands or collapses something, and stays live. A row only ever
 * mounts because it was revealed, so there is nothing else for the flag to get
 * wrong.
 */
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import {
  Tree,
  TreeItem,
  TreeItemContent,
  Button,
  type TreeProps as AriaTreeProps,
  type Key,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import styles from './TreeView.module.scss';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/* A ref rather than state: nothing re-renders when it flips, and a row reads it
   during its own mount effect. State would be a render behind. */
const TreeLive = createContext<{ current: boolean }>({ current: false });

export interface TreeNode {
  id: string;
  label: ReactNode;
  /** What type-ahead matches and what the row is called when the label is rich. */
  textValue?: string;
  icon?: ReactNode;
  children?: readonly TreeNode[];
  isDisabled?: boolean;
}

export interface TreeViewProps
  extends Omit<AriaTreeProps<TreeNode>, 'className' | 'style' | 'children' | 'items'> {
  /** The roots, in order. */
  items: readonly TreeNode[];
  /** Names the tree, so two on a page can be told apart. */
  label: string;
  className?: string;
}

export function TreeView({
  items, label, className, onExpandedChange, ...props
}: TreeViewProps): React.JSX.Element {
  const live = useRef(false);
  const handleExpandedChange = (keys: Set<Key>): void => {
    live.current = true;
    onExpandedChange?.(keys);
  };

  return (
    <TreeLive.Provider value={live}>
      <Tree
        {...props}
        aria-label={label}
        items={items}
        onExpandedChange={handleExpandedChange}
        className={cx(styles['tree'], className)}
      >
        {(node: TreeNode) => <Row node={node} />}
      </Tree>
    </TreeLive.Provider>
  );
}

function Row({ node }: { node: TreeNode }): React.JSX.Element {
  return (
    <TreeItem
      id={node.id}
      textValue={typeof node.label === 'string' ? node.label : (node.textValue ?? node.id)}
      className={cx(styles['item'])}
      {...(node.isDisabled === undefined ? {} : { isDisabled: node.isDisabled })}
    >
      <TreeItemContent>
        {({ level, hasChildItems }) => (
          <RowContent node={node} level={level} hasChildItems={hasChildItems} />
        )}
      </TreeItemContent>
      {/* Children are a nested collection, which is what lets React Aria compute
          the level, the set size and the position within it. */}
      {node.children?.map((child) => <Row key={child.id} node={child} />)}
    </TreeItem>
  );
}

function RowContent({
  node, level, hasChildItems,
}: { node: TreeNode; level: number; hasChildItems: boolean }): React.JSX.Element {
  const live = useContext(TreeLive);
  const [scope, play] = useMotion();
  useEffect(() => {
    if (live.current) play('accordion-in');
  }, [live, play]);

  return (
    <div
      ref={scope as never}
      className={cx(styles['row'])}
      /* The depth as a number, so one rule indents every level and one gradient
         draws every guide. CSS cannot read `aria-level` as a number. */
      style={{ '--cr-tree-level': level - 1 } as React.CSSProperties}
    >
      {hasChildItems ? (
        <Button slot="chevron" className={cx(styles['chevron'])}>
          {ChevronIcon}
        </Button>
      ) : (
        /* The chevron's room, held open on a leaf. Without it every leaf label
           sits one chevron to the left of its siblings' labels, and the depth —
           the one thing the indentation is there to show — stops reading. */
        <span className={cx(styles['chevron'], styles['chevronEmpty'])} aria-hidden="true" />
      )}
      {node.icon ? <span className={cx(styles['icon'])} aria-hidden="true">{node.icon}</span> : null}
      <span className={cx(styles['label'])}>{node.label}</span>
    </div>
  );
}

export type { Key as TreeKey };
