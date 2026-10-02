import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Treemap } from './Treemap.js';

const root = {
  name: 'Spend',
  children: [
    { name: 'Engineering', children: [{ name: 'Salaries', value: 60 }, { name: 'Hosting', value: 20 }] },
    { name: 'Sales', children: [{ name: 'Commission', value: 15 }, { name: 'Travel', value: 5 }] },
  ],
};

describe('Treemap', () => {
  /* Two different numbers: a node deep in a branch can be most of its parent and
     almost none of the total. */
  it('states a share of its parent and a share of the whole', () => {
    renderWithCrystal(<Treemap label="Spend" root={root} />);
    expect(screen.getByLabelText('Engineering, 80, 80% of Spend, 80% of the whole, has children'))
      .toBeInTheDocument();
  });

  /* "Navigable as a tree": one level at a time, with a way in and a way back. */
  it('descends into a branch and comes back out', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Treemap label="Spend" root={root} />);
    await user.click(screen.getByLabelText(/^Engineering/));
    expect(screen.getByLabelText(/^Salaries/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Sales,/)).toBeNull();
    /* The breadcrumb is the way back, and it says where the reader is. */
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByLabelText(/^Sales,/)).toBeInTheDocument();
  });

  /* The drill-down avoids a flat list of leaves with no path, so the table
     carries the branch each leaf is on. */
  it('says which branch every leaf is on in the table', () => {
    renderWithCrystal(<Treemap label="Spend" root={root} />);
    expect(screen.getByRole('columnheader', { name: 'Within' })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: 'Spend › Engineering' })).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Treemap label="Spend by team" root={root} />);
    await expectNoAxeViolations(container);
  });
});
