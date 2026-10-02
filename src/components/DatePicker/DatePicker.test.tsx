import { describe, expect, it } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { DateInput, DatePicker, DateRangePicker, TimeInput } from './DatePicker.js';

describe('DateInput', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<DateInput label="Due date" />);
    await expectNoAxeViolations(container);
  });

  /* A date field is a row of spin buttons, not a text field with a pattern. That
     is what makes it enterable in any locale without knowing the order, and what
     makes it announce "day, 14" rather than reading a formatted string back. */
  it('is a row of segments, each its own spin button', () => {
    renderWithCrystal(<DateInput label="Due date" />);
    const spinners = screen.getAllByRole('spinbutton');
    expect(spinners.length).toBeGreaterThanOrEqual(3);
    /* React Aria names both the field and the segment container, so there are
       two. The test checks that the row is a named group and not an input. */
    expect(screen.getAllByRole('group', { name: 'Due date' }).length).toBeGreaterThanOrEqual(1);
  });

  it('steps a segment with the arrow keys', async () => {
    renderWithCrystal(<DateInput label="Due date" defaultValue={new CalendarDate(2026, 9, 18)} />);
    const day = screen.getByRole('spinbutton', { name: /day/i });
    day.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(day.textContent).toBe('19');
  });

  /* "01" is an answer nobody gave, and a form that submits it has invented data. */
  it('shows an unset segment as a question, not a plausible value', () => {
    renderWithCrystal(<DateInput label="Due date" />);
    const day = screen.getByRole('spinbutton', { name: /day/i });
    expect(day.getAttribute('data-placeholder')).not.toBeNull();
  });
});

describe('TimeInput', () => {
  it('is segments too', () => {
    renderWithCrystal(<TimeInput label="Start" />);
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
  });
});

describe('DatePicker', () => {
  it('has no accessibility violations and offers both routes to the value', async () => {
    const { container } = renderWithCrystal(<DatePicker label="Due date" />);
    /* Typing reaches it, and so does the calendar. Neither is the only way. */
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('button')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('opens a calendar whose days are chooseable', async () => {
    renderWithCrystal(<DatePicker label="Due date" defaultValue={new CalendarDate(2026, 9, 18)} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /18/ })).toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  /* Each end is its own set of segments with its own name: a reader editing the
     start must not be told they are editing the end. */
  it('names each end separately', () => {
    renderWithCrystal(<DateRangePicker label="Stay" />);
    /* Six segments: day, month and year at each end, each its own spin button. */
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(6);
    const names = screen.getAllByRole('spinbutton').map((s) => s.getAttribute('aria-label') ?? '');
    /* Start and end are distinguishable, so a reader editing the start is not
       told they are editing the end. */
    expect(new Set(names).size).toBeGreaterThanOrEqual(6);
  });
});
