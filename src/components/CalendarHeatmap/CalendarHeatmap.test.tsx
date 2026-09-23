import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CalendarHeatmap, place } from './CalendarHeatmap.js';

const days = Array.from({ length: 21 }, (_, i) => ({
  date: `2026-03-${String(i + 2).padStart(2, '0')}`,
  value: i === 4 ? null : i % 7,
}));

describe('CalendarHeatmap', () => {
  /* A grid of squares with no axis cannot be read by position: nobody counts
     "third column, fifth row" back to a Tuesday in March. So the date is in the
     label rather than inferred from where the cell sits. */
  it('states the date of every cell', () => {
    renderWithCrystal(<CalendarHeatmap label="Commits" days={days} />);
    expect(screen.getByLabelText('2026-03-03, 1')).toBeInTheDocument();
  });

  it('says a day with no measurement rather than drawing it pale', () => {
    renderWithCrystal(<CalendarHeatmap label="Commits" days={days} />);
    expect(screen.getByLabelText('2026-03-06, no measurement')).toBeInTheDocument();
  });

  /* The first column is a whole week: days before the range are absent rather
     than shifting every later day up by their count. */
  it('starts the first column on the week, not on the first day given', () => {
    /* 2026-03-02 is a Monday, so with weeks starting Monday it is row 0. */
    const placed = place([{ date: '2026-03-02', value: 1 }], 1);
    expect(placed[0]).toMatchObject({ week: 0, row: 0 });
    /* And a range beginning on a Wednesday starts three rows down. */
    const later = place([{ date: '2026-03-04', value: 1 }], 1);
    expect(later[0]).toMatchObject({ week: 0, row: 2 });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<CalendarHeatmap label="Commits" days={days} />);
    await expectNoAxeViolations(container);
  });
});
