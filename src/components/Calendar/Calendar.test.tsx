import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CalendarDate } from '@internationalized/date';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { Calendar, RangeCalendar } from './Calendar.js';

describe('Calendar', () => {
  /* "Usable on its own rather than only inside a picker" is why the month grid
     lives outside `DatePicker`. */
  it('stands on its own, as a named grid', () => {
    renderWithCrystal(<Calendar label="Departure" defaultValue={new CalendarDate(2026, 9, 23)} />);
    expect(screen.getByRole('application', { name: /Departure/ })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  /* The weekday row is present and `aria-hidden`, which is React Aria's choice.
     Each cell's accessible name is the whole date ("Wednesday 23 September
     2026"), so a reader hears the day of the week without cross-referencing a
     column header whose position they cannot see. This is asserted, because
     "a grid with row and column headers" reads like a requirement for
     `columnheader` roles and is not one. */
  it('shows the weekday row and keeps it out of the accessibility tree', () => {
    const { container } = renderWithCrystal(
      <Calendar label="Departure" defaultValue={new CalendarDate(2026, 9, 23)} />,
    );
    const head = container.querySelector('thead');
    expect(head?.querySelectorAll('th')).toHaveLength(7);
    expect(head).toHaveAttribute('aria-hidden', 'true');
    /* The name is on the button inside the cell, which is where React Aria puts
       it: the `td` is the grid position and the control inside it is the day. */
    const day = within(screen.getByRole('gridcell', { selected: true })).getByRole('button');
    expect(day).toHaveAccessibleName(/Wednesday, September 23, 2026/);
  });

  it('marks the selected day as selected', () => {
    renderWithCrystal(<Calendar label="Departure" defaultValue={new CalendarDate(2026, 9, 23)} />);
    const selected = screen.getByRole('gridcell', { selected: true });
    expect(selected).toHaveTextContent('23');
  });

  it('moves with the keyboard, across a month boundary', async () => {
    const onChange = vi.fn();
    renderWithCrystal(
      <Calendar label="Departure" defaultValue={new CalendarDate(2026, 9, 30)} onChange={onChange} />,
    );
    /* The roving tab stop is the selected cell, behind the two month controls. */
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('refuses the days the product cannot accept', () => {
    renderWithCrystal(
      <Calendar
        label="Departure"
        defaultValue={new CalendarDate(2026, 9, 23)}
        isDateUnavailable={(date) => date.day === 24}
      />,
    );
    const unavailable = screen.getByRole('gridcell', { name: /24/ });
    expect(unavailable.getAttribute('aria-disabled')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Calendar label="Departure" defaultValue={new CalendarDate(2026, 9, 23)} />,
    );
    await expectNoAxeViolations(container);
  });
});

describe('RangeCalendar', () => {
  it('picks two dates in the same grid', () => {
    renderWithCrystal(
      <RangeCalendar
        label="Stay"
        defaultValue={{ start: new CalendarDate(2026, 9, 21), end: new CalendarDate(2026, 9, 25) }}
      />,
    );
    expect(screen.getAllByRole('gridcell', { selected: true }).length).toBeGreaterThan(1);
  });
});
