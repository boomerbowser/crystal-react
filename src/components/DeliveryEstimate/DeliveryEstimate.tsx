/* DeliveryEstimate — when something will arrive.
 *
 * "**An absolute date, not only a relative phrase.**"
 *
 * "Arrives in 3 days" is a sentence that stops being true the moment it is
 * cached, screenshotted, emailed, read the next morning, or reached by somebody
 * who left the tab open over a weekend. It is also unanswerable: a reader who
 * wants to know whether the parcel beats a Friday has to do arithmetic with a
 * date they were not given. So the date is always there, and the relative phrase
 * is *additional* — it makes the date easier to feel, and it is never the only
 * thing said.
 *
 * The date is in a `<time dateTime>`, which is what makes it machine-readable to
 * anything that wants to offer a calendar entry, and the attribute is built from
 * the local calendar fields rather than from `toISOString` — that returns the
 * UTC day, which is the previous one for anybody east of Greenwich in the
 * evening.
 *
 * **Three states, and two of them are not a date.** `loading` announces that the
 * estimate is being worked out, because a blank space where a delivery date goes
 * is indistinguishable from a delivery date of never. `unavailable` says so in
 * words rather than rendering nothing, for the same reason.
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
   * weekday is the part a shopper is actually deciding against.
   */
  format?: DateFormatterOptions;
  /**
   * An extra phrase beside the date — "in 3 days", "tomorrow". Additional,
   * never instead: see above.
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

    /* Polite, because an estimate settling is not an interruption — and a live
       region at all, because the thing a reader is waiting for is the answer
       replacing the wait. */
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
