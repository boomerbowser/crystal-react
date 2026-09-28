'use client';

/* Calendar — a month grid, usable on its own.
 *
 * "Usable on its own rather than only inside a picker" is the catalogue's first
 * clause and it is the reason this file exists: the month grid was already
 * built, inside `DatePicker`, where nothing else could reach it. A booking view
 * that wants a calendar and no field had to copy it. So the grid moved here and
 * `DatePicker` consumes it — one month grid in the library rather than two that
 * drift.
 *
 * React Aria owns everything that makes a date grid hard: the `grid` role with
 * row and column headers, the roving focus across weeks and months, the locale's
 * own first day and week numbering, and — the part nobody writes twice — moving
 * from the 31st to the next month with an arrow key.
 *
 * Crystal owns the surface and three markings:
 *
 *   - **The panel is Frost**, because a calendar is a panel rather than a
 *     control plane. Inside a picker it is already on one, so the standalone
 *     component carries the material and the body does not.
 *   - **Today is a rule beneath the number, not a fill.** A filled "today" and
 *     a filled "selected" are two fills a reader has to tell apart by shade;
 *     the rule is a different mark for a different thing.
 *   - **Selection is label weight**, with the soft fill as the second signal,
 *     exactly as it is everywhere else in Crystal.
 */
import type { ReactNode } from 'react';
import {
  Calendar as AriaCalendar,
  RangeCalendar as AriaRangeCalendar,
  type CalendarProps as AriaCalendarProps,
  type RangeCalendarProps as AriaRangeCalendarProps,
  type DateValue,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { CalendarBody } from './CalendarBody.js';
import styles from './Calendar.module.scss';

export { CalendarBody };

export interface CalendarProps<T extends DateValue>
  extends Omit<AriaCalendarProps<T>, 'className' | 'style' | 'children'> {
  /** Names the calendar. Two on a page are otherwise the same grid. */
  label?: string;
  className?: string;
}

export function Calendar<T extends DateValue>(
  { label, className, ...props }: CalendarProps<T>,
): ReactNode {
  return (
    <AriaCalendar
      {...props}
      {...(label === undefined ? {} : { 'aria-label': label })}
      className={cx(styles['panel'], className)}
    >
      <CalendarBody />
    </AriaCalendar>
  );
}

export interface RangeCalendarProps<T extends DateValue>
  extends Omit<AriaRangeCalendarProps<T>, 'className' | 'style' | 'children'> {
  label?: string;
  className?: string;
}

/** The same grid picking two dates. Not a catalogue entry of its own — a range
 *  is a state of a calendar rather than a different component. */
export function RangeCalendar<T extends DateValue>(
  { label, className, ...props }: RangeCalendarProps<T>,
): ReactNode {
  return (
    <AriaRangeCalendar
      {...props}
      {...(label === undefined ? {} : { 'aria-label': label })}
      className={cx(styles['panel'], className)}
    >
      <CalendarBody />
    </AriaRangeCalendar>
  );
}
