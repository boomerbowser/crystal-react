import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { OrganizationChart } from './OrganizationChart.js';

const items = [
  {
    id: 'ada',
    name: 'Ada Lovelace',
    role: 'Director',
    children: [
      { id: 'grace', name: 'Grace Hopper', role: 'Engineering' },
      {
        id: 'katherine',
        name: 'Katherine Johnson',
        role: 'Research',
        children: [{ id: 'annie', name: 'Annie Easley', role: 'Computation' }],
      },
    ],
  },
];

describe('OrganizationChart', () => {
  /* M-3: a node carries a disclosure and is also selectable, and the ARIA tree
     pattern has no key left to reach the disclosure. */
  it('is a treegrid, as M-3 decided a tree with controls in it must be', () => {
    renderWithCrystal(<OrganizationChart items={items} label="Team" />);
    expect(screen.getByRole('treegrid', { name: 'Team' })).toBeInTheDocument();
  });

  it('announces depth and position, which the connectors only draw', () => {
    const { container } = renderWithCrystal(
      <OrganizationChart items={items} label="Team" defaultExpandedKeys={['ada']} />,
    );
    const rows = [...container.querySelectorAll('[role="row"]')];
    expect(rows.length).toBe(3);
    expect(rows[1]).toHaveAttribute('aria-level', '2');
    expect(rows[1]).toHaveAttribute('aria-posinset', '1');
    expect(rows[1]).toHaveAttribute('aria-setsize', '2');
  });

  /* "Collapse state is announced", by `aria-expanded` on the row. Which way the
     chevron points announces nothing. */
  it('announces the collapse state', async () => {
    const { container } = renderWithCrystal(<OrganizationChart items={items} label="Team" />);
    const root = container.querySelector('[role="row"]');
    expect(root).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(screen.getByRole('button', { name: /Expand|Collapse/ }));
    expect(container.querySelector('[role="row"]')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the role beside the name rather than only in a tooltip', () => {
    renderWithCrystal(<OrganizationChart items={items} label="Team" />);
    expect(screen.getByText('Director')).toBeInTheDocument();
  });

  /* Nothing moves at rest: the nodes on the page when it loads were always
     there. */
  it('plays nothing on the nodes that were there when the page loaded', () => {
    const { container } = renderWithCrystal(
      <OrganizationChart items={items} label="Team" defaultExpandedKeys={['ada', 'katherine']} />,
    );
    expect(container.querySelectorAll('[data-cr-motion-name], [data-cr-motion-state]')).toHaveLength(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <OrganizationChart items={items} label="Team" defaultExpandedKeys={['ada']} />,
    );
    await expectNoAxeViolations(container);
  });
});
