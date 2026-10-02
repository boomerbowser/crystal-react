'use client';

/* Sankey: flow between stages, with width as volume.
 *
 * "Each link states its endpoints and volume as text." A reader who cannot see a
 * sankey cannot be told "the shape of the flow", so every link is a mark that
 * names both ends and its size, and the table lists every one of them. The nodes
 * are the labels and the links are the data, so naming only the nodes would
 * describe nothing.
 *
 * "Link opacity keeps crossings readable." Crystal's `--cr-chart-link-opacity`
 * is higher than a fill's because a link is the mark rather than its backing,
 * and low enough that a crossing reads as two links rather than as a third
 * shape.
 *
 * The layout is `d3-sankey`'s. Node order and the iteration that untangles the
 * crossings have a published algorithm, and a second implementation would draw
 * a different picture of the same numbers.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { sankey as d3sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { cx } from '../../styles/cx.js';
import styles from './Sankey.module.scss';

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  nodes: readonly SankeyNode[];
  links: readonly SankeyLink[];
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

interface LaidNode extends SankeyNode {
  index?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
}

interface LaidLink {
  source: LaidNode;
  target: LaidNode;
  value: number;
  width?: number;
}

const NODE_WIDTH = 12;

export function Sankey({
  nodes, links, format = (value) => String(value), table, className, height = 320, ...surface
}: SankeyProps): ReactNode {
  const marks = useMarkNavigation(links.length);

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? {
        columns: ['From', 'To', 'Volume'],
        rows: links.map((link) => [link.source, link.target, format(link.value)]),
      }}
      empty={surface.empty ?? links.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const index = new Map(nodes.map((node, i) => [node.name, i]));
        const layout = d3sankey<LaidNode, LaidLink>()
          .nodeWidth(NODE_WIDTH)
          .nodePadding(12)
          .extent([[0, 0], [Math.max(1, inner.width), Math.max(1, inner.height)]]);
        /* Cloned, because `d3-sankey` writes the layout onto the objects it is
           given and would otherwise mutate the caller's data. On a re-render the
           second pass would then start from the first's output. */
        const graph = layout({
          nodes: nodes.map((node) => ({ ...node })),
          links: links.map((link) => ({
            source: index.get(link.source) ?? 0,
            target: index.get(link.target) ?? 0,
            value: link.value,
          })) as unknown as LaidLink[],
        });
        const path = sankeyLinkHorizontal<LaidNode, LaidLink>();

        return (
          <g transform={`translate(${inner.x},${inner.y})`}>
            <g {...marks.containerProps}>
              {graph.links.map((link, at) => (
                <g
                  key={`${link.source.name}-${link.target.name}`}
                  {...marks.markProps(at)}
                  role="graphics-symbol"
                  aria-label={`${link.source.name} to ${link.target.name}, ${format(link.value)}`}
                  className={styles['link']}
                  data-active={marks.active === at ? '' : undefined}
                  style={{
                    '--series-colour': seriesColour(link.source.index ?? 0),
                  } as CSSProperties}
                >
                  <path
                    className={styles['flow']}
                    d={path(link) ?? ''}
                    strokeWidth={Math.max(1, link.width ?? 1)}
                  />
                </g>
              ))}
            </g>
            <g aria-hidden="true">
              {graph.nodes.map((node) => (
                <g key={node.name}>
                  <rect
                    className={styles['node']}
                    x={node.x0 ?? 0}
                    y={node.y0 ?? 0}
                    width={(node.x1 ?? 0) - (node.x0 ?? 0)}
                    height={Math.max(1, (node.y1 ?? 0) - (node.y0 ?? 0))}
                  />
                  <text
                    className={styles['nodeLabel']}
                    x={(node.x0 ?? 0) < inner.width / 2 ? (node.x1 ?? 0) + 6 : (node.x0 ?? 0) - 6}
                    y={((node.y0 ?? 0) + (node.y1 ?? 0)) / 2}
                    textAnchor={(node.x0 ?? 0) < inner.width / 2 ? 'start' : 'end'}
                    dominantBaseline="middle"
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </g>
          </g>
        );
      }}
    </ChartSurface>
  );
}
