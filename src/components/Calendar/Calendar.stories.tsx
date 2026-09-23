import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { Calendar, RangeCalendar } from './Calendar.js';

const meta = {
  title: 'Data display/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component:
          '"Usable on its own rather than only inside a picker" — which is why this exists: the '
          + 'month grid was already built, inside `DatePicker`, where nothing else could reach '
          + 'it. A booking view that wants a calendar and no field had to copy it. The grid moved '
          + 'here and `DatePicker` consumes it, so there is one month grid in the library rather '
          + 'than two that drift.\n\n'
          + 'React Aria owns what makes a date grid hard: the roving focus across weeks and '
          + 'months, the locale\'s own first day, and moving from the 31st to the next month with '
          + 'an arrow key. It also hides the weekday row from assistive technology on purpose — '
          + 'each day announces its whole date, "Wednesday, September 23, 2026", so a reader '
          + 'hears the weekday without cross-referencing a column header whose position they '
          + 'cannot see.\n\n'
          + 'Crystal owns the Frost panel, and two markings: **today is a rule beneath the '
          + 'number rather than a fill**, because two fills are two things a reader has to tell '
          + 'apart by shade, and **selection is label weight** with the soft fill as the second '
          + 'signal.',
      },
    },
  },
  args: { label: 'Departure', defaultValue: new CalendarDate(2026, 9, 23) },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Today, unselected, so the rule beneath it is visible beside a selected day. */
export const TodayAndSelected: Story = {
  args: { defaultValue: today(getLocalTimeZone()).add({ days: 2 }) },
};

/** Days the product cannot accept — a booked room, a closed day. Struck through
 *  rather than removed, because a missing day makes the grid read wrong. */
export const WithUnavailableDays: Story = {
  args: { isDateUnavailable: (date) => date.day % 7 === 0 },
};

/** The same grid picking two dates. A range is a state of a calendar rather than
 *  a different component. */
export const ARange: Story = {
  /* No args spread: a range calendar's value is a *pair*, so this story's meta
     args — which are a single date — do not describe it. The Controls panel
     drives the other stories; this one is a specimen of the other shape. */
  render: () => (
    <RangeCalendar
      label="Stay"
      defaultValue={{ start: new CalendarDate(2026, 9, 21), end: new CalendarDate(2026, 9, 25) }}
    />
  ),
};
