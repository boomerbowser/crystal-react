import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DashboardShell } from './DashboardShell.js';
import { StatusBar } from '../StatusBar/StatusBar.js';

describe('DashboardShell', () => {
  /* The catalogue asks for banner, navigation, main and contentinfo, with one
     main. All four are `AppShell`'s, and a block that drew its own would put a
     second set on the page. This asserts that composing does not lose them, and
     that there is still exactly one main. */
  it('keeps the shell landmarks, and exactly one main', () => {
    renderWithCrystal(
      <DashboardShell
        header={<header>The product</header>}
        sidebar={<a href="/reports">Reports</a>}
        footer={<StatusBar status="All changes saved" />}
      >
        <p>A tile</p>
      </DashboardShell>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('names the content grid', () => {
    renderWithCrystal(<DashboardShell gridLabel="Sales"><p>A tile</p></DashboardShell>);
    expect(screen.getByRole('group', { name: 'Sales' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <DashboardShell header={<header>The product</header>} footer={<StatusBar status="Saved" />}>
        <p>A tile</p>
      </DashboardShell>,
    );
    await expectNoAxeViolations(container);
  });
});
