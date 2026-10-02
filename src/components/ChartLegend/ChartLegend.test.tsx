import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ChartLegend } from './ChartLegend.js';

const entries = [
  { name: 'Revenue', index: 0, shown: true },
  { name: 'Costs', index: 1, shown: false },
];

describe('ChartLegend', () => {
  /* "Toggles are buttons with a pressed state." */
  it('is buttons with a pressed state when it toggles', () => {
    renderWithCrystal(<ChartLegend entries={entries} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Revenue', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Costs', pressed: false })).toBeInTheDocument();
  });

  /* A legend that cannot toggle is a key and renders as text. Pressing it would
     do nothing, and a button that does nothing is worse than a label. */
  it('is text, not buttons, when it does not toggle', () => {
    renderWithCrystal(<ChartLegend entries={entries} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  /* "Hidden series are announced." Turning a series off changes the picture, and
     a reader who cannot see the picture is told nothing unless it is announced. */
  it('announces what the reader just changed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithCrystal(<ChartLegend entries={entries} onToggle={onToggle} />);
    expect(screen.getByRole('status').textContent).toBe('');
    await user.click(screen.getByRole('button', { name: 'Revenue' }));
    expect(onToggle).toHaveBeenCalledWith('Revenue', false);
    expect(screen.getByRole('status').textContent).toBe('Revenue hidden');
  });

  /* Selection is weight. Nothing is drawn beside the label to mark it, and the
     swatch says which series this is, not whether it is showing. */
  it('carries the shown state as weight, not as a mark or a colour', () => {
    renderWithCrystal(<ChartLegend entries={entries} onToggle={() => {}} />);
    const shown = screen.getByRole('button', { name: 'Revenue' });
    const hidden = screen.getByRole('button', { name: 'Costs' });
    expect(shown.hasAttribute('data-shown')).toBe(true);
    expect(hidden.hasAttribute('data-shown')).toBe(false);
    /* Both entries keep the same swatch, which identifies the series only. */
    expect(shown.querySelector('svg')).not.toBeNull();
    expect(hidden.querySelector('svg')).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<ChartLegend entries={entries} onToggle={() => {}} />);
    await expectNoAxeViolations(container);
  });
});
