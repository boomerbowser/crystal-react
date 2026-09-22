'use client';

/* AvatarGroup — overlapping avatars with an overflow count.
 *
 * "The group has one accessible name; the overflow count is announced, not
 * implied."
 *
 * The first half is the `ul`: a known number of peers in an order, named once.
 * A screen reader reaches it as "Project members, list, 4 items" and can then
 * walk the people inside it. The members keep their own names — the catalogue
 * asks the group to *have* a name, not for the people in it to lose theirs, and
 * a row of nameless images is a worse answer to "who is on this?" than a row of
 * names nobody is forced to hear.
 *
 * The second half is the chip. "+3" read literally is a plus sign and a number;
 * what it means is "three more people". So it shows the short form and announces
 * the sentence — the same split `Badge` makes, for the same reason.
 *
 * One row, one size: the group's `size` is applied to every avatar in it, because
 * an overlap only reads as a row when the circles are the same circle.
 */
import { Children, cloneElement, forwardRef, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import type { AvatarProps, AvatarSize } from '../Avatar/Avatar.js';
import styles from './AvatarGroup.module.scss';

export interface AvatarGroupProps extends HTMLAttributes<HTMLElement> {
  /** The avatars. */
  children: ReactNode;
  /** What the group is — "Project members". The group's one accessible name. */
  label: string;
  /** How many to show before the overflow chip. */
  max?: number;
  /** The size every avatar in the row takes, overflow chip included. */
  size?: AvatarSize;
  /** The sentence the overflow chip announces. Defaults to "N more". */
  overflowDescription?: (count: number) => string;
}

export const AvatarGroup = forwardRef<HTMLElement, AvatarGroupProps>(function AvatarGroup(
  { children, label, max, size = 'md', overflowDescription, className, ...props },
  ref,
) {
  const all = Children.toArray(children).filter(isValidElement);
  const shown = max === undefined ? all : all.slice(0, max);
  const overflow = all.length - shown.length;
  const describe = overflowDescription ?? ((count: number) => `${count} more`);

  return (
    <ul {...props} ref={ref as never} aria-label={label} className={cx(styles['group'], className)}>
      {shown.map((child, index) => (
        <li key={child.key ?? index} className={styles['item']}>
          {cloneElement(child as ReactElement<AvatarProps>, { size })}
        </li>
      ))}
      {overflow > 0 ? (
        <li className={styles['item']}>
          <span className={cx(styles['overflow'], styles[size])}>
            <span aria-hidden="true">{`+${overflow}`}</span>
            <VisuallyHidden>{describe(overflow)}</VisuallyHidden>
          </span>
        </li>
      ) : null}
    </ul>
  );
});
