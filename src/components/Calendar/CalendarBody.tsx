'use client';

/* The header and the grid of a calendar, shared by \`Calendar\`, \`RangeCalendar\`,
 * \`DatePicker\` and \`DateRangePicker\`, and the motion the catalogue gives them:
 *
 *   - \`selection\` on the day that becomes selected (by a press, an arrow and
 *     Enter, or a value set from outside), and never on the render that opens
 *     the grid with a day already chosen. A range selects two days, and each
 *     plays as it becomes one of them.
 *   - \`page-in\` on the grid when the month shown changes (the previous and
 *     next buttons, or an arrow key walking off the edge of a month), and never
 *     on the month it opens on.
 *
 * Both read React Aria's own calendar state, so they move on the value React
 * Aria resolved and not on a click.
 */
import { useContext, type ReactNode } from 'react';
import {
  CalendarGrid, CalendarGridHeader, CalendarHeaderCell, CalendarGridBody, CalendarCell,
  CalendarStateContext, RangeCalendarStateContext, Button, Heading,
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './Calendar.module.scss';

const Chevron = ({ back }: { back: boolean }): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={back ? 'm14 8-4 4 4 4' : 'm10 8 4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The header and the grid, without a surface of its own.
 *
 * Exported for `DatePicker`, which opens it inside a popover that already
 * carries the material. A Frost panel inside a Frost popover would be two panes
 * of the same glass, and neither would read as the panel.
 */
export function CalendarBody(): ReactNode {
  return (
    <>
      {/* A `div`, not a `header`. A bare `header` is a `banner` landmark, and a
          banner inside the calendar's own `application` role is an axe
          violation when the grid stands on its own. Inside a picker's dialog
          the element is scoped away. The month heading is a heading, and the
          row around it is layout. */}
      <div className={cx(styles['header'])}>
        {/* Named by React Aria from the calendar itself, so a range calendar
            showing two months does not have two buttons called "Previous". */}
        <Button slot="previous" className={cx(styles['navButton'], 'cr-bare')}><Chevron back /></Button>
        <Heading className={cx(styles['heading'])} />
        <Button slot="next" className={cx(styles['navButton'], 'cr-bare')}><Chevron back={false} /></Button>
      </div>
      <MonthGrid>
        <CalendarGridHeader>
          {(day) => <CalendarHeaderCell className={cx(styles['weekday'])}>{day}</CalendarHeaderCell>}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => <Day date={date} />}
        </CalendarGridBody>
      </MonthGrid>
    </>
  );
}

/* One of the two, whichever calendar this body is inside. Both are read on every
   render, so the hooks run in the same order either way. */
function useCalendarState() {
  const single = useContext(CalendarStateContext);
  const range = useContext(RangeCalendarStateContext);
  return single ?? range;
}

function MonthGrid({ children }: { children: React.ReactElement[] }): React.JSX.Element {
  const state = useCalendarState();
  const month = state ? state.visibleRange.start.toString() : '';
  const scope = useChangeMotion(month, () => 'page-in');
  return <CalendarGrid ref={scope as never} className={cx(styles['grid'])}>{children}</CalendarGrid>;
}

function Day({ date }: { date: CalendarDate }): React.JSX.Element {
  const state = useCalendarState();
  const scope = useChangeMotion(state?.isSelected(date) ?? false, entered('selection'));
  return <CalendarCell ref={scope as never} date={date} className={cx(styles['cell'])} />;
}

