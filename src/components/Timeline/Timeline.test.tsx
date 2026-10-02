import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Timeline } from './Timeline.js';

const items = [
  { id: 'a', title: 'Submitted', status: 'complete' as const, statusLabel: 'Complete', marker: '1' },
  { id: 'b', title: 'In review', status: 'current' as const, statusLabel: 'In progress', marker: '2' },
  { id: 'c', title: 'Decision', status: 'upcoming' as const, statusLabel: 'Not started', marker: '3' },
];

describe('Timeline', () => {
  /* The order is the meaning, and a reader told only "list, 3 items" loses it. */
  it('is an ordered, named list', () => {
    const { container } = renderWithCrystal(<Timeline items={items} label="Application progress" />);
    expect(container.querySelector('ol')).not.toBeNull();
    expect(screen.getByRole('list', { name: 'Application progress' })).toBeInTheDocument();
  });

  it('marks the current event and only the current event', () => {
    const { container } = renderWithCrystal(<Timeline items={items} label="Application progress" />);
    const current = container.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('In review');
  });

  /* Three of the four states differ only by the colour of a small circle. */
  it('says each status in words', () => {
    renderWithCrystal(<Timeline items={items} label="Application progress" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('hides the marker, which is a picture of the status rather than the status', () => {
    renderWithCrystal(<Timeline items={items} label="Application progress" />);
    expect(screen.getByText('1')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Timeline items={items} label="Application progress" />);
    await expectNoAxeViolations(container);
  });
});
