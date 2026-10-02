import type { Meta, StoryObj } from '@storybook/react-vite';
import { NetworkGraph } from './NetworkGraph.js';

/* Positions are computed once, here, and passed in. A force simulation running
   in the component would be motion at rest, and a reader who tabbed into the
   graph while it settled would be chasing a moving target. */
const ring = (count: number, radius: number, offset = 0) => Array.from(
  { length: count },
  (_, i) => {
    const angle = (i / count) * Math.PI * 2 + offset;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  },
);

const outer = ring(8, 100);
const inner = ring(3, 38, 0.4);

const nodes = [
  ...inner.map((at, i) => ({
    id: `core-${i}`, name: ['Platform', 'Billing', 'Identity'][i] ?? '', ...at,
    weight: 14 - i * 3, group: 0,
  })),
  ...outer.map((at, i) => ({
    id: `svc-${i}`, name: `Service ${i + 1}`, ...at, weight: 3 + (i % 4), group: 1,
  })),
];

const edges = [
  { source: 'core-0', target: 'core-1' }, { source: 'core-1', target: 'core-2' },
  { source: 'core-2', target: 'core-0' },
  ...outer.map((_, i) => ({ source: `svc-${i}`, target: `core-${i % 3}` })),
  { source: 'svc-0', target: 'svc-1' }, { source: 'svc-4', target: 'svc-5' },
];

const meta = {
  title: 'Charts/Network graph',
  component: NetworkGraph,
  parameters: {
    docs: {
      description: {
        component:
          '"Nodes are reachable by keyboard; each states its degree and neighbours." This '
          + 'component computes the neighbours itself. A network graph\'s content is who is '
          + 'connected to whom, and a node that announced only its name would leave a reader '
          + 'with a list of names and no graph.\n\n'
          + '**Positions are the caller\'s.** The catalogue puts "layout algorithm" on the '
          + "product's side. A force simulation is also motion, and Crystal's rule is that "
          + 'nothing moves at rest: a graph that settles for four seconds after it appears '
          + 'gives a reader who tabs into it a moving target.\n\n'
          + '"Node size is a scale": Crystal\'s point scale, by area, as the scatter\'s is.',
      },
    },
  },
  args: {
    label: 'Service dependencies',
    nodes,
    edges,
    format: (value: number) => `${value} calls per second`,
  },
} satisfies Meta<typeof NetworkGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A small graph, where every node and every connection can be read at once. */
export const Small: Story = {
  args: {
    label: 'Team',
    nodes: [
      { id: 'a', name: 'Ash', x: 0, y: 0 },
      { id: 'b', name: 'Brook', x: 1, y: 1 },
      { id: 'c', name: 'Cedar', x: 2, y: 0 },
      { id: 'd', name: 'Dale', x: 1, y: -1 },
    ],
    edges: [
      { source: 'a', target: 'b' }, { source: 'b', target: 'c' },
      { source: 'c', target: 'd' }, { source: 'd', target: 'a' },
    ],
  },
};
