import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { EmptyState } from './EmptyState.js';

describe('EmptyState', () => {
  /* "No-results and truly-empty are different states and read differently." The
     component has no default state, so neither can be chosen by accident. The
     two render as different states, not as one state with different words. */
  it('keeps the two kinds of empty apart', () => {
    const { container, rerender } = renderWithCrystal(
      <EmptyState state="empty" title="No projects yet" />,
    );
    expect(container.querySelector('[data-state="empty"]')).toBeInTheDocument();
    rerender(<EmptyState state="no-results" title="No projects match “wxyz”" />);
    expect(container.querySelector('[data-state="no-results"]')).toBeInTheDocument();
    expect(container.querySelector('[data-state="empty"]')).toBeNull();
  });

  it('names its region with the title', () => {
    renderWithCrystal(<EmptyState state="empty" title="No projects yet" />);
    expect(screen.getByRole('region', { name: 'No projects yet' })).toBeInTheDocument();
  });

  /* "Real text; never an illustration alone." */
  it('hides the illustration from assistive technology', () => {
    renderWithCrystal(
      <EmptyState state="empty" title="No projects yet" illustration={<svg />} />,
    );
    const region = screen.getByRole('region');
    expect(region.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
    expect(region.textContent).toContain('No projects yet');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <EmptyState state="no-results" title="No matches">Try a shorter search.</EmptyState>,
    );
    await expectNoAxeViolations(container);
  });
});
