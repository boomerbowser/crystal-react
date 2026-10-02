'use client';

/* The date and time family: DateInput, TimeInput, DatePicker, DateRangePicker,
 * DateTimePicker, MonthPicker, YearPicker and DigitalClock.
 *
 * A date field is a row of segments, each its own spin button, and not a text
 * field with a pattern. Segments let a person enter a date by keyboard in any
 * locale without knowing the order, and make the field announce "day, 14"
 * instead of reading a formatted string back. A masked-text date field assumes
 * an order, fights the caret, and is unreadable to a screen reader.
 *
 * All of the arithmetic is `@internationalized/date`, which is why these
 * components are thin. Dates are the single largest source of wrong answers in
 * application code (time zones, calendar systems, the 25-hour day), so the
 * design system does no date maths of its own.
 *
 * A placeholder segment shows "dd", not a plausible number. `01` is an answer
 * nobody gave, and a form that submits it has invented data.
 *
 * Month and year pickers are the same field with fewer segments. They exist
 * separately because the catalogue lists them separately: "when is this bill
 * due" and "which year were you born" are different questions and need
 * different affordances.
 */
import type { ReactNode } from 'react';
import {
  DateField, DateInput as AriaDateInput, DateSegment,
  TimeField,
  DatePicker as AriaDatePicker, DateRangePicker as AriaDateRangePicker,
  Calendar, RangeCalendar,
  Label, Button,  Dialog, Text, FieldError,
  type DateValue,
} from 'react-aria-components';
import { CalendarBody } from '../Calendar/CalendarBody.js';
import { cx } from '../../styles/cx.js';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import styles from './DatePicker.module.scss';

const CalendarIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);


interface FieldExtras {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /* Without this a date cannot be part of a form: it is not submitted, and a
     `Form` distributing a server's errors has no name to match it against. */
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

/** A date typed in segments, with no calendar. For a date somebody already knows. */
export function DateInput({
  label, description, errorMessage, className, ...props
}: DateInputProps): React.JSX.Element {
  return (
    <DateField {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        {segments}
      </FieldGroupShell>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </DateField>
  );
}

export interface TimeInputProps extends FieldExtras {
  granularity?: 'hour' | 'minute' | 'second';
  hourCycle?: 12 | 24;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

/** A time in segments. The hour cycle follows the locale unless a product says. */
export function TimeInput({
  label, description, errorMessage, className, ...props
}: TimeInputProps): React.JSX.Element {
  return (
    <TimeField
      {...props}
      {...declaredInvalid(props.isInvalid, errorMessage)}
      className={cx(styles['field'], className)}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, so the field marks itself and moves
          whatever the source of the error. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>{segments}</FieldGroupShell>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </TimeField>
  );
}


export interface DatePickerProps extends DateInputProps {
  /** Reject dates the product cannot accept, such as a booked day or a weekend. */
  isDateUnavailable?: (date: DateValue) => boolean;
}

/** A segmented field with a calendar beside it. Both routes reach the same value. */
export function DatePicker({
  label, description, errorMessage, className, isDateUnavailable, ...props
}: DatePickerProps): React.JSX.Element {
  return (
    <AriaDatePicker {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        {segments}
        <Button className={cx(styles['trigger'], 'cr-bare')}>{CalendarIcon}</Button>
      </FieldGroupShell>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <ArrivingPopover recipe="menu-in" exit="menu-out" className={cx(styles['popover'], 'cr-frost')}>
        <Dialog>
          <Calendar {...(isDateUnavailable ? { isDateUnavailable } : {})}>
            <CalendarBody />
          </Calendar>
        </Dialog>
      </ArrivingPopover>
      </>
      )}
    </AriaDatePicker>
  );
}

export interface DateRangePickerProps extends Omit<FieldExtras, 'name'> {
  /**
   * A range is two values, so it takes two names. React Aria submits and
   * matches each end separately, and a single `name` reaches neither.
   * `FieldExtras`' `name` is omitted here so that it cannot be passed and
   * ignored.
   */
  startName?: string;
  endName?: string;
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
  return (
    <AriaDateRangePicker {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['field'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared, so a
          server's rejection moves the field exactly as a local rule would. */}
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        <AriaDateInput slot="start" className={cx(styles['segments'])}>
          {(segment) => <DateSegment segment={segment} className={cx(styles['segment'])} />}
        </AriaDateInput>
        <span aria-hidden="true">–</span>
        <AriaDateInput slot="end" className={cx(styles['segments'])}>
          {(segment) => <DateSegment segment={segment} className={cx(styles['segment'])} />}
        </AriaDateInput>
        <Button className={cx(styles['trigger'], 'cr-bare')}>{CalendarIcon}</Button>
      </FieldGroupShell>
      {description ? <Text slot="description" className={cx(styles['description'])}>{description}</Text> : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      <ArrivingPopover recipe="menu-in" exit="menu-out" className={cx(styles['popover'], 'cr-frost')}>
        <Dialog>
          <RangeCalendar {...(isDateUnavailable ? { isDateUnavailable } : {})}>
            <CalendarBody />
          </RangeCalendar>
        </Dialog>
      </ArrivingPopover>
      </>
      )}
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
 * A month and a year: the same field without the day segment. "Which month
 * does this bill cover" is a different question from "which day", and offering
 * a day to answer it invites a wrong answer.
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
