import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NavigationTree } from './NavigationTree.js';

const items = [
  {
    id: 'docs',
    label: 'Documentation',
    href: '/docs',
    children: [
      { id: 'materials', label: 'Materials', href: '/docs/materials' },
      { id: 'motion', label: 'Motion', href: '/docs/motion' },
    ],
  },
  { id: 'playground', label: 'Playground', href: '/playground' },
];

describe('NavigationTree', () => {
  it('is a named landmark, so the whole tree can be skipped', () => {
    renderWithCrystal(<NavigationTree items={items} label="Site" />);
    expect(screen.getByRole('navigation', { name: 'Site' })).toBeInTheDocument();
  });

  /* What React Aria renders: a treegrid of pressable rows carrying `data-href`,
     routed through `RouterProvider`, not a nested set of `a` elements as the
     component's name suggests. */
  it('renders destinations as pressable rows carrying their href', () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" defaultExpandedKeys={['docs']} />,
    );
    const row = [...container.querySelectorAll('[role="row"]')]
      .find((node) => node.getAttribute('aria-label') === 'Playground');
    expect(row).toHaveAttribute('data-href', '/playground');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  /* React Aria computes `data-current` for styling and does not set
     `aria-current`, so the catalogue's "aria-current on the active destination"
     is this library's to supply. It comes from the same comparison, so the
     announced state and the painted one cannot drift. */
  it('sets aria-current on the destination it is on, which React Aria does not', () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" selectedRoute="/docs/materials" defaultExpandedKeys={['docs']} />,
    );
    const current = [...container.querySelectorAll('[aria-current]')];
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-current', 'page');
    expect(current[0]).toHaveAttribute('data-current', 'true');
  });

  it('marks the current destination and the branch it is inside', () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" selectedRoute="/docs/materials" defaultExpandedKeys={['docs']} />,
    );
    const current = container.querySelectorAll('[data-current]');
    expect(current.length).toBeGreaterThan(0);
    /* The ancestor too, so a collapsed branch still shows where you are. */
    expect(container.querySelectorAll('[data-current-ancestor]').length).toBeGreaterThan(0);
  });

  it('announces depth and position, which is what indentation only shows', () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" defaultExpandedKeys={['docs']} />,
    );
    const rows = [...container.querySelectorAll('[aria-level]')];
    expect(rows.length).toBeGreaterThan(2);
    expect(rows.some((row) => row.getAttribute('aria-level') === '2')).toBe(true);
  });

  /* Nothing moves at rest, so the rows present when the page loads do not
     animate. Only a row that arrives because somebody expanded its parent
     does. */
  it('plays nothing on the rows that were there when the page loaded', () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" defaultExpandedKeys={['docs']} />,
    );
    const moved = [...container.querySelectorAll('[data-cr-motion-name], [data-cr-motion-state]')];
    expect(moved).toHaveLength(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <NavigationTree items={items} label="Site" selectedRoute="/docs/motion" defaultExpandedKeys={['docs']} />,
    );
    await expectNoAxeViolations(container);
  });
});
