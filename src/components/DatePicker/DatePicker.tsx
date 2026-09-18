'use client';

/* The date and time family: DateInput, TimeInput, DatePicker, DateRangePicker,
 * DateTimePicker, MonthPicker, YearPicker and DigitalClock.
 *
 * A date field is **not** a text field with a pattern. It is a row of segments,
 * each its own spin button, which is what makes a date enterable by keyboard in
 * any locale without the person knowing the order — and what makes it announce
 * "day, 14" rather than reading a formatted string back. Every masked-text date
 * field is worse than this in three ways at once: it assumes an order, it fights
 * the caret, and it is unreadable to a screen reader.
 *
 * All of the arithmetic is `@internationalized/date`, which is the reason these
 * components are thin. Dates are the single largest source of wrong answers in
 * application code — time zones, calendar systems, the 25-hour day — and a design
 * system that does its own date maths is a design system with a bug in it.
 *
 * A placeholder segment shows "dd" rather than a plausible number: `01` is an
 * answer nobody gave, and a form that submits it has invented data.
 *
 * Month and year pickers are the same field with fewer segments. They exist
 * separately because the catalogue does: "when is this bill due" and "which year
 * were you born" are different questions and deserve different affordances.
 */
import type { ReactNode } from 'react';
import {
  DateField, DateInput as AriaDateInput, DateSegment,
  TimeField,
  DatePicker as AriaDatePicker, DateRangePicker as AriaDateRangePicker,
  Calendar, RangeCalendar, CalendarGrid, CalendarGridHeader, CalendarHeaderCell,
  CalendarGridBody, CalendarCell, Heading,
  Label, Button, Group, Popover, Dialog, Text, FieldError,
  type DateValue,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { declaredInvalid, useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './DatePicker.module.scss';

const CalendarIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const Chevron = ({ back }: { back: boolean }) => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d={back ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
  </svg>
);

interface FieldExtras {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /* Without this a date cannot be part of a form: it is not submitted, and a
     `Form` distributing a server's errors has no name to match it against. Every
     other field in the library took one; these did not, which made the whole
     temporal family unusable in the one place dates are most often collected. */
  name?: string;
  isRequired?: boolean;
  className?: string;
}

const segments = (
  <AriaDateInput className={cx(styles['segments'])}>
    {(segment) => <DateSegment segment={segment} className={cx(styles['segment'])} />}
  </AriaDateInput>
);

export interface DateInputProps extends FieldExtras {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  onChange?: (value: DateValue | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  isDisabled?: boolean;
  isInvalid?: boolean;
}

/** A date typed in segments. No calendar — for a date somebody already knows. */
export function DateInput({
  label, description, errorMessage, className, ...props
}: DateInputProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  return (
    <DateField {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group ref={shellScope as never} className={cx(styles['shell'])} {...(invalid ? { 'data-invalid': true } : {})}>
        {segments}
      </Group>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </DateField>
  );
}

export interface TimeInputProps extends FieldExtras {
  granularity?: 'hour' | 'minute' | 'second';
  hourCycle?: 12 | 24;
  isDisabled?: boolean;
}

/** A time in segments. The hour cycle follows the locale unless a product says. */
export function TimeInput({
  label, description, errorMessage, className, ...props
}: TimeInputProps): React.JSX.Element {
  return (
    <TimeField {...props} className={cx(styles['field'], className)}>
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group className={cx(styles['shell'])}>{segments}</Group>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </TimeField>
  );
}

/** The calendar body, shared by every picker that opens one. */
function CalendarBody(): React.JSX.Element {
  return (
    <>
      <header className={cx(styles['calendarHeader'])}>
        {/* Named by React Aria from the calendar itself, so they are not two
            buttons called "Previous" on a range picker with two months. */}
        <Button slot="previous" className={cx(styles['navButton'])}><Chevron back /></Button>
        <Heading className={cx(styles['heading'])} />
        <Button slot="next" className={cx(styles['navButton'])}><Chevron back={false} /></Button>
      </header>
      <CalendarGrid className={cx(styles['grid'])}>
        <CalendarGridHeader>
          {(day) => <CalendarHeaderCell className={cx(styles['weekday'])}>{day}</CalendarHeaderCell>}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => <CalendarCell date={date} className={cx(styles['cell'])} />}
        </CalendarGridBody>
      </CalendarGrid>
    </>
  );
}

export interface DatePickerProps extends DateInputProps {
  /** Reject dates the product cannot accept — a booked day, a weekend. */
  isDateUnavailable?: (date: DateValue) => boolean;
}

/** A segmented field with a calendar beside it. Both routes reach the same value. */
export function DatePicker({
  label, description, errorMessage, className, isDateUnavailable, ...props
}: DatePickerProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  return (
    <AriaDatePicker {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group ref={shellScope as never} className={cx(styles['shell'])} {...(invalid ? { 'data-invalid': true } : {})}>
        {segments}
        <Button className={cx(styles['trigger'])}>{CalendarIcon}</Button>
      </Group>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <Popover className={cx(styles['popover'])}>
        <Dialog>
          <Calendar {...(isDateUnavailable ? { isDateUnavailable } : {})}>
            <CalendarBody />
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

export interface DateRangePickerProps extends FieldExtras {
  value?: { start: DateValue; end: DateValue } | null;
  defaultValue?: { start: DateValue; end: DateValue } | null;
  onChange?: (value: { start: DateValue; end: DateValue } | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isDateUnavailable?: (date: DateValue) => boolean;
}

/** Two dates bounding a span. Each end is its own set of segments and its own name. */
export function DateRangePicker({
  label, description, errorMessage, className, isDateUnavailable, ...props
}: DateRangePickerProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);

  return (
    <AriaDateRangePicker {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group ref={shellScope as never} className={cx(styles['shell'])} {...(invalid ? { 'data-invalid': true } : {})}>
        <AriaDateInput slot="start" className={cx(styles['segments'])}>
          {(segment) => <DateSegment segment={segment} className={cx(styles['segment'])} />}
        </AriaDateInput>
        <span aria-hidden="true">–</span>
        <AriaDateInput slot="end" className={cx(styles['segments'])}>
          {(segment) => <DateSegment segment={segment} className={cx(styles['segment'])} />}
        </AriaDateInput>
        <Button className={cx(styles['trigger'])}>{CalendarIcon}</Button>
      </Group>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <Popover className={cx(styles['popover'])}>
        <Dialog>
          <RangeCalendar {...(isDateUnavailable ? { isDateUnavailable } : {})}>
            <CalendarBody />
          </RangeCalendar>
        </Dialog>
      </Popover>
    </AriaDateRangePicker>
  );
}

export type DateTimePickerProps = DatePickerProps;

/** A date and a time in one field. Granularity is what makes it one component. */
export function DateTimePicker({ granularity = 'minute', ...props }: DateTimePickerProps): React.JSX.Element {
  return <DatePicker {...props} granularity={granularity} />;
}

export type MonthPickerProps = Omit<DateInputProps, 'granularity'>;

/**
 * A month and a year. The same field with the day segment gone — "which month
 * does this bill cover" is a different question from "which day", and offering a
 * day to answer it invites a wrong answer.
 */
export function MonthPicker(props: MonthPickerProps): React.JSX.Element {
  return <DateInput {...props} />;
}

export type YearPickerProps = MonthPickerProps;

/** A year alone. For a birth year, an expiry, an archive. */
export function YearPicker(props: YearPickerProps): React.JSX.Element {
  return <DateInput {...props} />;
}

export type DigitalClockProps = TimeInputProps;

/** A time, to the minute. The same field named for what it is usually for. */
export function DigitalClock(props: DigitalClockProps): React.JSX.Element {
  return <TimeInput {...props} granularity="minute" />;
}
