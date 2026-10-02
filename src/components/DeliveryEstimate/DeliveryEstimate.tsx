/* DeliveryEstimate: when something will arrive.
 *
 * "An absolute date, not only a relative phrase."
 *
 * "Arrives in 3 days" stops being true once it is cached, screenshotted,
 * emailed, read the next morning, or left open in a tab over a weekend. A reader
 * who wants to know whether the parcel arrives before Friday would also have to
 * work it out from a date they were not given. So the date is always shown, and
 * the relative phrase is an addition beside it, never the only thing said.
 *
 * The date is in a `<time dateTime>`, so anything that offers a calendar entry
 * can read it. The attribute is built from the local calendar fields, because
 * `toISOString` returns the UTC day, which is the previous day for anybody east
 * of Greenwich in the evening.
 *
 * There are three states, and two of them are not a date. `loading` announces
 * that the estimate is being worked out, because an empty space where a delivery
 * date goes cannot be told apart from no delivery at all. `unavailable` says so
 * in words, for the same reason.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useDateFormatter, type DateFormatterOptions } from 'react-aria';
import { cx } from '../../styles/cx.js';
import styles from './DeliveryEstimate.module.scss';

export interface DeliveryEstimateProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** When it arrives. Absent means there is no estimate. */
  on?: Date;
  /** The estimate is still being worked out. */
  loading?: boolean;
  /**
   * How `Intl` renders the day. Defaults to a weekday and a date, because the
   * weekday is the part a shopper is deciding against.
   */
  format?: DateFormatterOptions;
  /**
   * An extra phrase beside the date, such as "in 3 days" or "tomorrow". It is
   * shown in addition to the date, never instead of it.
   */
  relative?: ReactNode;
  /** The sentence around the date. Default English. */
  sentence?: (date: ReactNode) => ReactNode;
  loadingLabel?: ReactNode;
  unavailableLabel?: ReactNode;
}

/* The local calendar day, not the UTC one. */
function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const DEFAULT_FORMAT: DateFormatterOptions = {
  weekday: 'long', day: 'numeric', month: 'long',
};

export const DeliveryEstimate = forwardRef<HTMLSpanElement, DeliveryEstimateProps>(
  function DeliveryEstimate({
    on, loading = false, format, relative, sentence,
    loadingLabel = 'Working out when this arrives', unavailableLabel = 'No delivery estimate',
    className, ...props
  }, ref) {
    const day = useDateFormatter(format ?? DEFAULT_FORMAT);

    /* A live region, so the reader hears the answer when it replaces the wait.
       It is polite because an estimate settling does not need to interrupt. */
    if (loading) {
      return (
        <span {...props} ref={ref} role="status" className={cx(styles['estimate'], className)}>
          {loadingLabel}
        </span>
      );
    }

    if (on === undefined) {
      return (
        <span {...props} ref={ref} data-unavailable="" className={cx(styles['estimate'], className)}>
          {unavailableLabel}
        </span>
      );
    }

    const date = <time dateTime={isoDay(on)}>{day.format(on)}</time>;

    return (
      <span {...props} ref={ref} className={cx(styles['estimate'], className)}>
        {(sentence ?? ((one) => <>Arrives {one}</>))(date)}
        {relative === undefined ? null : <span className={styles['relative']}> ({relative})</span>}
      </span>
    );
  },
);
