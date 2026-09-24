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
  /* The header listed four landmarks and the file drew two of them: there was no
     footer slot at all, so `contentinfo` was a sentence rather than a region. A
     reader jumping by landmark to find what is true of the view — saved, syncing,
     offline — had nowhere to land. */
  it('renders the contentinfo landmark it promises', () => {
    renderWithCrystal(
      <AppShell footer={<p>All changes saved</p>}>
        <p>The view</p>
      </AppShell>,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('All changes saved');
  });

  /* And stays absent when nothing was given it: an empty landmark is one more
     entry in the list with nothing behind it. */
  it('renders no footer when there is nothing to put in it', () => {
    renderWithCrystal(<AppShell><p>The view</p></AppShell>);
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

});
