'use client';

/* Treemap — nested proportions as nested rectangles.
 *
 * "Navigable as a tree, with each node stating its share." Navigable as a tree
 * is the demanding half and it is what this component is built around: the map
 * shows one level at a time, `Enter` descends into a node that has children,
 * `Escape` comes back up, and a breadcrumb says where you are. Drawing every
 * depth at once is the usual implementation and it is not navigation — it is a
 * picture of a tree, and a reader who cannot see it is given a flat list of
 * leaves with no idea which branch they are on.
 *
 * "Each node states its share" — of its parent *and* of the whole, because in a
 * nested structure those are different numbers and a node deep in a branch can
 * be most of its parent and almost none of the total.
 *
 * "Hairline separation; labels drop out rather than overflow." A label that does
 * not fit is not drawn; it is never truncated to an ellipsis and never allowed
 * to spill over the rectangle beside it. The name is on the mark and in the
 * table either way.
 */
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { hierarchy, treemap as d3treemap } from 'd3-hierarchy';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { cx } from '../../styles/cx.js';
import styles from './Treemap.module.scss';

export interface TreemapNode {
  name: string;
  /** A leaf's size. Ignored where there are children: a branch is its children. */
  value?: number;
  children?: readonly TreemapNode[];
}

export interface TreemapProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  root: TreemapNode;
  format?: (value: number) => string;
  formatShare?: (share: number) => string;
  /** What the root is called in the breadcrumb. */
  rootLabel?: string;
  table?: ChartSurfaceProps['table'];
}

export function Treemap({
  root, format = (value) => String(value),
  formatShare = (share) => `${Math.round(share * 100)}%`,
  rootLabel = 'All', table, className, height = 320, ...surface
}: TreemapProps): ReactNode {
  /* Where in the tree the reader is. Names rather than indices, so the path
     survives the data being replaced with a longer version of itself. */
  const [path, setPath] = useState<string[]>([]);
  const current = path.reduce<TreemapNode>(
    (node, name) => node.children?.find((child) => child.name === name) ?? node, root,
  );
  const children = current.children ?? [];
  const marks = useMarkNavigation(children.length);
  const whole = total(root);

  /* Descending and ascending both move focus to the first mark of the level
     arrived at. Without it the focused element is removed by the very key that
     changed the level, focus falls to the document, and the next `Escape` never
     reaches this component — which is a reader one keystroke from being stranded
     at the bottom of a tree. */
  const descend = (name: string) => {
    const child = children.find((one) => one.name === name);
    if (!child?.children?.length) return;
    setPath([...path, name]);
    marks.setActive(0);
  };

  const ascend = (to: number) => {
    setPath(path.slice(0, to));
    marks.setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && path.length) {
      event.preventDefault();
      ascend(path.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const child = children[marks.active];
      if (child?.children?.length) {
        event.preventDefault();
        descend(child.name);
        return;
      }
    }
    marks.containerProps.onKeyDown(event);
  };

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? treemapTable(root, format, formatShare, whole)}
      empty={surface.empty ?? children.length === 0}
      legend={(
        <nav aria-label="Treemap level" className={styles['breadcrumb']}>
          <ol className={styles['crumbs']}>
            {[rootLabel, ...path].map((name, index) => (
              <li key={name} className={styles['crumb']}>
                {index === path.length ? (
                  <span aria-current="true">{name}</span>
                ) : (
                  <button type="button" onClick={() => ascend(index)}>
                    {name}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const laid = d3treemap<TreemapNode>()
          .size([inner.width, inner.height])
          .paddingInner(chartGeometry.hairline * 2)
          .round(true)(
            hierarchy<TreemapNode>({ name: current.name, children: children as TreemapNode[] })
              .sum((node) => (node.children?.length ? 0 : node.value ?? 0))
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
          );
        const within = laid.value ?? 0;

        return (
          <g {...marks.containerProps} onKeyDown={onKeyDown}>
            {(laid.children ?? []).map((cell, index) => {
              const width = cell.x1 - cell.x0;
              const box = cell.y1 - cell.y0;
              const value = cell.value ?? 0;
              const branch = Boolean(cell.data.children?.length);
              return (
                <g
                  key={cell.data.name}
                  {...marks.markProps(index)}
                  role="graphics-symbol"
                  aria-label={`${cell.data.name}, ${format(value)}, `
                    + `${formatShare(within === 0 ? 0 : value / within)} of ${current.name}, `
                    + `${formatShare(whole === 0 ? 0 : value / whole)} of the whole`
                    + (branch ? ', has children' : '')}
                  className={styles['cell']}
                  data-active={marks.active === index ? '' : undefined}
                  data-branch={branch ? '' : undefined}
                  style={{ '--series-colour': seriesColour(index) } as CSSProperties}
                  onClick={() => { marks.setActive(index); descend(cell.data.name); }}
                >
                  <rect
                    className={styles['fill']}
                    x={inner.x + cell.x0}
                    y={inner.y + cell.y0}
                    width={width}
                    height={box}
                  />
                  {/* Dropped rather than truncated. A label is either readable
                      where it is or it is not drawn; the name is on the mark and
                      in the table regardless. */}
                  {width > cell.data.name.length * 8 && box > 24 ? (
                    <text
                      className={styles['label']}
                      x={inner.x + cell.x0 + 8}
                      y={inner.y + cell.y0 + 18}
                    >
                      {cell.data.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      }}
    </ChartSurface>
  );
}

function total(node: TreemapNode): number {
  if (!node.children?.length) return node.value ?? 0;
  return node.children.reduce((sum, child) => sum + total(child), 0);
}

/** Every leaf, with the branch it is on: a flat list of leaves with no path is
 *  the thing the drill-down exists to avoid. */
export function treemapTable(
  root: TreemapNode,
  format: (value: number) => string,
  formatShare: (share: number) => string,
  whole: number,
): ChartSurfaceProps['table'] {
  const rows: (string | null)[][] = [];
  const walk = (node: TreemapNode, trail: string[]) => {
    if (!node.children?.length) {
      rows.push([
        node.name,
        trail.join(' › ') || '—',
        format(node.value ?? 0),
        formatShare(whole === 0 ? 0 : (node.value ?? 0) / whole),
      ]);
      return;
    }
    for (const child of node.children) walk(child, [...trail, node.name]);
  };
  for (const child of root.children ?? []) walk(child, [root.name]);
  return { columns: ['Node', 'Within', 'Value', 'Share of the whole'], rows };
}
