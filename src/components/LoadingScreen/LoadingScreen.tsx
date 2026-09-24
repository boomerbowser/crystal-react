'use client';

/* LoadingScreen — a whole view still arriving.
 *
 * "`aria-busy` on the region; the wait is announced **once, not repeatedly**."
 * "Skeletons match the shape of what is coming."
 *
 * The second sentence is why this composes `Skeleton` and not `Loader`. A
 * spinner says that something is happening; a skeleton says what is about to be
 * there, so the layout does not jump when it arrives and the reader is not
 * looking at a blank rectangle guessing. A spinner is the fallback for the case
 * where the shape genuinely is not known yet, which is what `placeholder`
 * omitted means here.
 *
 * **Announced once is a structural claim, not a wording one.** `Skeleton` already
 * owns it: the shapes are `aria-hidden` and one live region speaks for the whole
 * placeholder. So this screen renders *one* `Skeleton` holding every shape,
 * rather than one per shape — twelve skeletons would be twelve regions, and a
 * screen reader would say the same sentence twelve times. The nesting is the
 * accessibility behaviour here, which is exactly the kind of thing that looks
 * like a layout preference until somebody listens to it.
 *
 * `aria-busy` goes on the region so that the whole view is reported as busy
 * rather than each shape in it.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Skeleton } from '../Skeleton/Skeleton.js';
import { Loader } from '../Loader/Loader.js';
import { cx } from '../../styles/cx.js';
import styles from './LoadingScreen.module.scss';

export interface LoadingScreenProps extends HTMLAttributes<HTMLDivElement> {
  /** What is loading. Required — a mark with no words says nothing to anyone
   *  who cannot see it, and little to anyone who can. */
  label: string;
  /**
   * The shapes of what is coming. Omitted where the shape is genuinely not known
   * yet, in which case the screen falls back to a centred `Loader` — a spinner
   * is honest about knowing nothing, and a skeleton of the wrong shape is not.
   */
  placeholder?: ReactNode;
}

export function LoadingScreen({
  label, placeholder, className, ...props
}: LoadingScreenProps): React.JSX.Element {
  if (placeholder === undefined) {
    return (
      <div {...props} aria-busy className={cx(styles['centred'], className)}>
        <Loader label={label} size="large" />
      </div>
    );
  }

  return (
    <div {...props} aria-busy className={cx(styles['screen'], className)}>
      {/* One skeleton for the whole view. See the note above: the count of
          live regions is the count of times the wait is announced. */}
      <Skeleton loading label={label} placeholder={placeholder} />
    </div>
  );
}
