import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { Workspace } from './Workspace.js';

const panes = [
  { id: 'files', label: 'Files', children: <p>Files</p> },
  { id: 'editor', label: 'Editor', children: <p>Editor</p> },
  { id: 'preview', label: 'Preview', children: <p>Preview</p> },
];

describe('Workspace', () => {
  /* A landmark list reading "region, region, region" gives the reader three
     entries and no way to choose between them, so `label` is required on every
     pane and each becomes a named region. */
  it('makes every pane a named region', () => {
    renderWithCrystal(<Workspace panes={panes} />);
    expect(screen.getByRole('region', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Preview' })).toBeInTheDocument();
  });

  /* Focus mode removes the other panes rather than shrinking them. A pane
     squeezed to a sliver is still a tab stop, still read by a screen reader,
     and still catches a click — chrome that is only small is chrome the reader
     can still fall into. */
  it('removes the other panes in focus mode rather than shrinking them', () => {
    renderWithCrystal(<Workspace panes={panes} focused="editor" />);
    expect(screen.getByRole('region', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Files' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Preview' })).toBeNull();
  });

  it('declares which state it is in', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <Workspace panes={panes} data-testid="workspace" />,
    );
    expect(screen.getByTestId('workspace')).toHaveAttribute('data-cr-state', 'at-rest');

    rerenderWithCrystal(<Workspace panes={panes} focused="editor" data-testid="workspace" />);
    expect(screen.getByTestId('workspace')).toHaveAttribute('data-cr-state', 'focus-mode');
  });

  /* Document order is half of "focus order follows visual order". The other
     half is geometry and is asked in `verify:behaviour`, where the panes have
     positions to disagree about. */
  it('renders the panes in the order it was given them', () => {
    const { container } = renderWithCrystal(<Workspace panes={panes} />);
    const labels = [...container.querySelectorAll('section')].map((one) => one.getAttribute('aria-label'));
    expect(labels).toEqual(['Files', 'Editor', 'Preview']);
  });

  /* The defect `FocusMode` exists to prevent, in a second place. A reader with
     focus in the Files pane, and a product that turns focus mode on: the pane
     unmounts under them, focus falls to the document body, and a keyboard
     reader starts again from the top of the page with nothing said about it. */
  it('moves focus to the surviving pane when the focused one goes', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <Workspace
        panes={[
          { id: 'files', label: 'Files', children: <button type="button">A file</button> },
          { id: 'editor', label: 'Editor', children: <p>Editor</p> },
        ]}
      />,
    );
    screen.getByRole('button', { name: 'A file' }).focus();

    rerenderWithCrystal(
      <Workspace
        panes={[
          { id: 'files', label: 'Files', children: <button type="button">A file</button> },
          { id: 'editor', label: 'Editor', children: <p>Editor</p> },
        ]}
        focused="editor"
      />,
    );
    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
      expect(screen.getByRole('region', { name: 'Editor' })).toHaveFocus();
    });
  });

  /* And the other half: a reader already working in the pane being focused
     keeps their place. */
  it('leaves focus alone when it was already in the surviving pane', async () => {
    const panesWithControl = [
      { id: 'files', label: 'Files', children: <p>Files</p> },
      { id: 'editor', label: 'Editor', children: <button type="button">In the editor</button> },
    ];
    const { rerenderWithCrystal } = renderWithCrystal(<Workspace panes={panesWithControl} />);
    const working = screen.getByRole('button', { name: 'In the editor' });
    working.focus();

    rerenderWithCrystal(<Workspace panes={panesWithControl} focused="editor" />);
    await waitFor(() => { expect(working).toHaveFocus(); });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Workspace panes={panes} />);
    await expectNoAxeViolations(container);
  });
});
