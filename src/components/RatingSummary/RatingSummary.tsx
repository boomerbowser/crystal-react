'use client';

/* RatingSummary — an average, a count, and how the votes fell.
 *
 * "**The average and the count are both stated**; bars are labelled."
 *
 * Both, because either alone is a different claim. "4.8 out of 5" from three
 * people and from three thousand are not the same fact, and a distribution
 * without a count cannot be read at all — a bar at 60% could be six votes or six
 * hundred. So the count is not a footnote here; it is half of what is being
 * said, and it is in the summary's accessible name where a reader hears it
 * before the bars rather than after them.
 *
 * **The bars are a `MeterGroup`**, which already solves the part that is easy to
 * get wrong: each segment is its own `meter` with its own name and value, rather
 * than a row of coloured `div`s whose proportions exist only as pixels. A
 * distribution drawn as widths is invisible to anything that does not measure
 * pixels, which is everything except an eye.
 *
 * **The empty state is not zero.** No reviews is not an average of nought — it
 * is the absence of an average, and rendering "0 out of 5" tells a reader the
 * product was rated badly.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { MeterGroup } from '../MeterGroup/MeterGroup.js';
import { cx } from '../../styles/cx.js';
import styles from './RatingSummary.module.scss';

export interface RatingSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The mean. Absent means nobody has rated it. */
  average?: number;
  /** How many ratings. */
  count: number;
  /** Highest rating on the scale. */
  max?: number;
  /**
   * How many votes each rating got, highest first: `[5★, 4★, 3★, 2★, 1★]`.
   * Left out when the breakdown is not known.
   */
  distribution?: readonly number[];
  /** The stars, as a read-only `Rating`. Decorative beside the stated average. */
  stars?: ReactNode;
  /** Said when nothing has been rated. */
  empty?: ReactNode;
  /** How the whole thing reads. Default English. */
  summarise?: (average: number, max: number, count: number) => string;
  /** How one bar reads. Default English. */
  describeBar?: (rating: number, votes: number) => string;
  label?: string;
}

export const RatingSummary = forwardRef<HTMLElement, RatingSummaryProps>(
  function RatingSummary({
    average, count, max = 5, distribution, stars,
    empty = 'No ratings yet', summarise, describeBar,
    label = 'Ratings', className, ...props
  }, ref) {
    /* No reviews is the absence of an average, not an average of nought. */
    if (average === undefined || count === 0) {
      return (
        <section {...props} ref={ref} aria-label={label} className={cx(styles['summary'], className)}>
          <p className={styles['empty']}>{empty}</p>
        </section>
      );
    }

    const said = (summarise
      ?? ((mean, of, votes) => `${mean} out of ${of}, from ${votes} ${votes === 1 ? 'rating' : 'ratings'}`))(
      average, max, count,
    );

    const bar = describeBar ?? ((rating, votes) => `${rating} star${rating === 1 ? '' : 's'}, ${votes}`);

    return (
      <section {...props} ref={ref} aria-label={label} className={cx(styles['summary'], className)}>
        {/* The average and the count, in one sentence, as text. Not a number
            beside a smaller number in a lighter colour. */}
        <p className={styles['headline']}>{said}</p>
        {stars ? <div aria-hidden="true" className={styles['stars']}>{stars}</div> : null}

        {distribution ? (
          <MeterGroup
            label="How the ratings fell"
            segments={distribution.map((votes, index) => ({
              /* Highest first, so index 0 is the top of the scale. */
              name: bar(max - index, votes),
              value: votes,
            }))}
            total={count}
            className={cx(styles['bars'])}
          />
        ) : null}
      </section>
    );
  },
);
