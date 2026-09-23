'use client';

/* NetworkGraph — nodes and the edges between them.
 *
 * "Nodes are reachable by keyboard; each states its degree and neighbours." The
 * neighbours are the demanding half and the reason this component computes them
 * rather than taking them: the whole content of a network graph is who is
 * connected to whom, and a node that announced only its name would leave a
 * reader with a list of names and no graph at all.
 *
 * **Positions are the caller's.** The catalogue puts "layout algorithm" on the
 * product's side, and there is a second reason to keep it there: a force
 * simulation is motion, and Crystal's rule is that nothing moves at rest. A graph
 * that settles for four seconds after it appears is a page animating itself, and
 * a reader who tabbed into it during those seconds is chasing a moving target.
 * So the layout is computed by the product, once, and handed here as coordinates.
 *
 * "Node size is a scale; edges are hairlines." The size is Crystal's point scale
 * by area, as the scatter's is and for the same reason.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { scaleLinear } from '../../charts/scales.js';
import { chartGeometry } from '../../theme/chartTokens.js';
import { MARK_TARGET } from '../../charts/target.js';
import { cx } from '../../styles/cx.js';
import styles from './NetworkGraph.module.scss';

export interface GraphNode {
  id: string;
  name?: string;
  /** In the caller's own coordinates; the chart fits them to the plot. */
  x: number;
  y: number;
  /** A value drawn as the node's area. */
  weight?: number;
  /** Which series colour, for a graph whose nodes are of kinds. */
  group?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  /** What the connection is, for the node's own description. */
  label?: string;
}

export interface NetworkGraphProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function NetworkGraph({
  nodes, edges, format = (value) => String(value), table, className, height = 320, ...surface
}: NetworkGraphProps): ReactNode {
  const marks = useMarkNavigation(nodes.length);
  const neighbours = adjacency(nodes, edges);
  const named = (id: string) => nodes.find((node) => node.id === id)?.name ?? id;

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? {
        columns: ['Node', 'Connections', 'Connected to'],
        rows: nodes.map((node) => [
          node.name ?? node.id,
          String(neighbours.get(node.id)?.length ?? 0),
          (neighbours.get(node.id) ?? []).map(named).join(', ') || '—',
        ]),
      }}
      empty={surface.empty ?? nodes.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const pad = chartGeometry.pointMax;
        const xs = nodes.map((node) => node.x);
        const ys = nodes.map((node) => node.y);
        const across = scaleLinear().domain(span(xs)).range([pad, Math.max(pad, inner.width - pad)]);
        const down = scaleLinear().domain(span(ys)).range([pad, Math.max(pad, inner.height - pad)]);
        const weights = nodes.map((node) => node.weight).filter((w): w is number => w !== undefined);
        const area = scaleLinear()
          .domain(weights.length ? span(weights) : [0, 1])
          .range([chartGeometry.pointMin ** 2, chartGeometry.pointMax ** 2]);
        const at = (id: string) => {
          const node = nodes.find((one) => one.id === id);
          return node ? [inner.x + across(node.x), inner.y + down(node.y)] : null;
        };

        return (
          <>
            {/* The edges are `aria-hidden`: every edge is already named twice
                over, once in each of the nodes it joins, and announcing them
                separately would read the graph twice. */}
            <g aria-hidden="true">
              {edges.map((edge) => {
                const from = at(edge.source);
                const to = at(edge.target);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${edge.source}-${edge.target}`}
                    className={styles['edge']}
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={to[1]}
                  />
                );
              })}
            </g>
            <g {...marks.containerProps}>
              {nodes.map((node, index) => {
                const joined = neighbours.get(node.id) ?? [];
                const size = node.weight === undefined
                  ? chartGeometry.pointMin * 1.5
                  : Math.sqrt(area(node.weight));
                return (
                  <g
                    key={node.id}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${node.name ?? node.id}, `
                      + `${joined.length} ${joined.length === 1 ? 'connection' : 'connections'}`
                      + (joined.length ? `, to ${joined.map(named).join(', ')}` : '')
                      + (node.weight === undefined ? '' : `, ${format(node.weight)}`)}
                    className={styles['node']}
                    data-active={marks.active === index ? '' : undefined}
                    style={{ '--series-colour': seriesColour(node.group ?? 0) } as CSSProperties}
                    transform={`translate(${inner.x + across(node.x)},${inner.y + down(node.y)})`}
                  >
                    <rect
                      className={styles['target']}
                      x={-MARK_TARGET / 2}
                      y={-MARK_TARGET / 2}
                      width={MARK_TARGET}
                      height={MARK_TARGET}
                    />
                    <circle className={styles['dot']} r={size / 2} />
                  </g>
                );
              })}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}

function span(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const low = Math.min(...values);
  const high = Math.max(...values);
  return low === high ? [low - 1, high + 1] : [low, high];
}

/** Who each node is joined to. Both directions, because an edge is a connection
 *  rather than a direction unless the caller says otherwise, and a node that
 *  listed only its outgoing edges would under-report its own degree. */
export function adjacency(
  nodes: readonly GraphNode[], edges: readonly GraphEdge[],
): Map<string, string[]> {
  const out = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    out.get(edge.source)?.push(edge.target);
    out.get(edge.target)?.push(edge.source);
  }
  return out;
}
