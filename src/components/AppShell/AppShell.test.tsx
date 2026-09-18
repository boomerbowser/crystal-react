import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AppShell } from './AppShell.js';
import { AppBar } from '../AppBar/AppBar.js';

describe('AppShell', () => {
  /* The landmarks are half of what this component is for, and "one main per view"
     is why the regions are props rather than children a caller arranges. */
  it('lays out the landmarks, with exactly one main', async () => {
    const { container } = renderWithCrystal(
      <AppShell
        header={<AppBar title="Workspace" titleAs="h1" />}
        sidebar={<a href="#x">Overview</a>}
        destinations={<a href="#y">Home</a>}
      >
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Destinations' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* Collapsed means gone from the accessibility tree too. A sidebar that is
     visually collapsed but still focusable sends a keyboard user into links they
     cannot see. */
  it('takes the sidebar out of reach when it is collapsed', () => {
    renderWithCrystal(
      <AppShell sidebar={<a href="#x">Overview</a>} isCollapsed><p>Content</p></AppShell>,
    );
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull();
  });
});
