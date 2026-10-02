import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NetworkGraph, adjacency } from './NetworkGraph.js';

const nodes = [
  { id: 'a', name: 'Ash', x: 0, y: 0 },
  { id: 'b', name: 'Brook', x: 1, y: 1 },
  { id: 'c', name: 'Cedar', x: 2, y: 0 },
];
const edges = [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }];

describe('NetworkGraph', () => {
  /* A network graph's content is who is connected to whom, so a node that
     announced only its name would leave a reader with a list of names. */
  it('states a node degree and its neighbours', () => {
    renderWithCrystal(<NetworkGraph label="Team" nodes={nodes} edges={edges} />);
    expect(screen.getByLabelText('Brook, 2 connections, to Ash, Cedar')).toBeInTheDocument();
    expect(screen.getByLabelText('Ash, 1 connection, to Brook')).toBeInTheDocument();
  });

  /* An edge has no direction unless the caller gives it one, and a node that
     listed only its outgoing edges would under-report itself. */
  it('counts an edge from both ends', () => {
    const joined = adjacency(nodes, edges);
    expect(joined.get('c')).toEqual(['b']);
    expect(joined.get('b')).toEqual(['a', 'c']);
  });

  /* Positions are the caller's: a force simulation is motion, and nothing moves
     at rest. */
  it('takes positions rather than computing them', () => {
    const { container } = renderWithCrystal(
      <NetworkGraph label="Team" nodes={nodes} edges={edges} />,
    );
    const transforms = Array.from(container.querySelectorAll('[role="graphics-symbol"]'))
      .map((node) => node.getAttribute('transform'));
    expect(new Set(transforms).size).toBe(nodes.length);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<NetworkGraph label="Team" nodes={nodes} edges={edges} />);
    await expectNoAxeViolations(container);
  });
});
