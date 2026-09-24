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

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <SplitView aria-label="Resize the list" secondary={<div>Detail</div>} defaultSize={200}>
        <div>List</div>
      </SplitView>,
    );
    await expectNoAxeViolations(container);
  });
});
