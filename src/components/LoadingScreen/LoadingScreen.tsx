'use client';

/* LoadingScreen. A whole view still arriving.
 *
 * "`aria-busy` on the region; the wait is announced **once, not repeatedly**."
 * "Skeletons match the shape of what is coming."
 *
 * The second sentence is why this composes `Skeleton` and not `Loader`. A
 * spinner says that something is happening. A skeleton says what is about to be
 * there, so the layout does not jump when it arrives and the reader is not
 * left looking at a blank rectangle. A spinner is the fallback for when the
 * shape is not known yet, which is what an omitted `placeholder` means here.
 *
 * "Announced once" depends on structure. `Skeleton` already owns it: the shapes
 * are `aria-hidden` and one live region speaks for the whole placeholder. So
 * this screen renders one `Skeleton` holding every shape. Twelve skeletons would
 * be twelve regions, and a screen reader would say the same sentence twelve
 * times. The nesting is the accessibility behaviour here, although it looks
 * like a layout choice.
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
  /** What is loading. Required. A mark with no words says nothing to anyone
   *  who cannot see it, and little to anyone who can. */
  label: string;
  /**
   * The shapes of what is coming. Omitted where the shape is not known yet, in
   * which case the screen falls back to a centred `Loader`. A spinner claims
   * nothing about the shape, and a skeleton of the wrong shape claims the wrong
   * one.
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
