import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { SplitView } from './SplitView.js';

describe('SplitView', () => {
  /* Crystal's separator, from `Resizable`: a value a keyboard can change, not a
     grab handle a pointer can drag. */
  it('gives the divider a value a keyboard can move', () => {
    renderWithCrystal(
      <SplitView aria-label="Resize the list" secondary={<div>Detail</div>} defaultSize={200}>
        <div>List</div>
      </SplitView>,
    );
    const divider = screen.getByRole('separator', { name: 'Resize the list' });
    expect(divider).toHaveAttribute('aria-valuenow');
  });

  /* A separator between one region and nothing announces a value it cannot
     change, and a keyboard user who lands on it can press arrow keys at it
     forever. So collapsing removes the divider rather than disabling it. */
  it('removes the divider when a pane is folded away', () => {
    renderWithCrystal(
      <SplitView aria-label="Resize the list" secondary={<div>Detail</div>} collapse="secondary">
        <div>List</div>
      </SplitView>,
    );
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.queryByText('Detail')).toBeNull();
  });

  it('folds the other way round too', () => {
    renderWithCrystal(
      <SplitView aria-label="Resize the list" secondary={<div>Detail</div>} collapse="primary">
        <div>List</div>
      </SplitView>,
    );
    expect(screen.getByText('Detail')).toBeInTheDocument();
    expect(screen.queryByText('List')).toBeNull();
  });

  /* `minSize` and the rest are `Resizable`'s vocabulary, and React puts an
     unrecognised prop straight onto the DOM node. A collapsed split view that
     spread them rendered `<div minsize="200" orientation="horizontal">`: invalid
     markup, a warning in development, silence in production. Nothing caught it
     because nothing passed one alongside `collapse`. */
  it('does not leak the resizing vocabulary onto the collapsed element', () => {
    const { container } = renderWithCrystal(
      <SplitView
        aria-label="Resize the list"
        secondary={<div>Detail</div>}
        collapse="secondary"
        minSize={200}
        maxSize={600}
        orientation="horizontal"
      >
        <div>List</div>
      </SplitView>,
    );
    const collapsed = container.querySelector('[data-cr-state="collapsed"]');
    expect(collapsed).not.toBeNull();
    for (const leaked of ['minsize', 'maxsize', 'orientation', 'issize', 'onsizechange']) {
      expect(collapsed?.hasAttribute(leaked)).toBe(false);
    }
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <SplitView aria-label="Resize the list" secondary={<div>Detail</div>} defaultSize={200}>
        <div>List</div>
      </SplitView>,
    );
    await expectNoAxeViolations(container);
  });
});
