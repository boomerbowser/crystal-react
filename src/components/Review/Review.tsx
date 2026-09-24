'use client';

/* Review — one person's review.
 *
 * "**The rating is text as well as stars.**"
 *
 * Which `Rating` already does in read-only mode — it renders the value as words
 * beside the symbols rather than only drawing them — so the rating here is a
 * `Rating`, not a second row of glyphs. The sentence is in the catalogue at all
 * because a row of five stars is, to anything that does not see it, either
 * nothing or "star star star star star", and neither of those is four out of
 * five.
 *
 * **The body expands rather than truncating, and the control says so.** A review
 * clipped with an ellipsis and no way to open it is a review the reader is told
 * exists and cannot read. `Spoiler` is the component for that and it already
 * gets the part that matters right: the hidden text is still in the document, so
 * a screen reader and a page search both find it.
 *
 * **The author and the date are not decoration.** A review with no attribution
 * is an assertion from nobody, and a review with no date is one from any time —
 * both change how much weight it should carry, which is the reader's judgement
 * to make rather than ours to remove. So they are a `<footer>` with the date in
 * a `<time>`, which is the markup that says what they are.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Spoiler } from '../Spoiler/Spoiler.js';
import { cx } from '../../styles/cx.js';
import styles from './Review.module.scss';

export interface ReviewProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** The rating, as a read-only `Rating`. Text as well as stars. */
  rating?: ReactNode;
  /** The review's own headline. */
  title?: ReactNode;
  /** What they wrote. */
  children: ReactNode;
  /** Who wrote it. A review with no attribution is an assertion from nobody. */
  author: ReactNode;
  /** When, already formatted. */
  date?: ReactNode;
  /** The machine-readable date, as `YYYY-MM-DD`. */
  dateTime?: string;
  /** Marks this as a verified purchase, or anything else about the author. */
  badge?: ReactNode;
  /** Collapse a long body behind a control. */
  collapsible?: boolean;
  showLabel?: string;
  hideLabel?: string;
}

export const Review = forwardRef<HTMLElement, ReviewProps>(function Review({
  rating, title, children, author, date, dateTime, badge,
  collapsible = false, showLabel = 'Read the whole review', hideLabel = 'Show less',
  className, ...props
}, ref): ReactNode {
  const body = <div className={styles['body']}>{children}</div>;

  return (
    <article {...props} ref={ref} className={cx(styles['review'], className)}>
      {rating ? <div className={styles['rating']}>{rating}</div> : null}
      {title ? <h3 className={styles['title']}>{title}</h3> : null}

      {collapsible
        ? <Spoiler showLabel={showLabel} hideLabel={hideLabel}>{body}</Spoiler>
        : body}

      <footer className={styles['who']}>
        <span className={styles['author']}>{author}</span>
        {badge ? <span className={styles['badge']}>{badge}</span> : null}
        {date ? (
          <time className={styles['date']} {...(dateTime === undefined ? {} : { dateTime })}>
            {date}
          </time>
        ) : null}
      </footer>
    </article>
  );
});
