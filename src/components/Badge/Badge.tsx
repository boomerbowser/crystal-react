'use client';

/* Badge — a small count or label attached to a host element.
 *
 * The catalogue's hard part is not the shape, it is the sentence under
 * `semantics`: "the count reaches assistive technology through the host's
 * accessible name or a live region". A number painted in the corner of a button
 * is a fact about the button, not a separate thing to read — announcing it as
 * loose text ("Inbox 3") leaves a listener to guess what the 3 belongs to, and a
 * dot has no text at all.
 *
 * So the visual is always `aria-hidden`, and the meaning travels one of two
 * ways, both of which the caller chooses deliberately:
 *
 *   - `description` renders a polite live region carrying a whole sentence —
 *     "3 unread messages". A change to it is announced; the badge appearing is
 *     not, which is the difference between a notification and a distraction.
 *   - Without one, nothing is announced and the host must already say it. That
 *     is the correct answer when the badge duplicates a label the host already
 *     carries, and it is why `description` is not defaulted to the count: a
 *     bare "3" in a live region is the failure this rule exists to prevent.
 *
 * `zero` and `overflow` are formatting, not state: a count of 0 is hidden unless
 * `showZero`, and anything past `max` reads "99+".
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import { ChangeHighlight } from '../../feedback/ChangeHighlight.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './Badge.module.scss';

/** Where the badge sits on its host. Ignored when the badge stands alone. */
export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The number to show. Formatted by `max`, and hidden at 0 unless `showZero`. */
  count?: number;
  /** A word or short label instead of a count. */
  label?: ReactNode;
  /** The largest number shown literally; past it the badge reads "N+". */
  max?: number;
  /** Show a count of 0 rather than hiding the badge. */
  showZero?: boolean;
  /** A marker with no content — presence is the whole message. */
  dot?: boolean;
  /** The host the badge is attached to. Without one the badge stands alone. */
  children?: ReactNode;
  /** Where on the host it sits. */
  placement?: BadgePlacement;
  /** A whole sentence for assistive technology, announced politely on change. */
  description?: string;
}

const PLACEMENT_CLASS: Record<BadgePlacement, string> = {
  'top-end': 'topEnd',
  'top-start': 'topStart',
  'bottom-end': 'bottomEnd',
  'bottom-start': 'bottomStart',
};

/** "99+" past the ceiling, the number itself below it. */
export function formatCount(count: number, max: number): string {
  return count > max ? `${max}+` : String(count);
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { count, label, max = 99, showZero = false, dot = false, children,
    placement = 'top-end', description, className, ...props },
  ref,
) {
  const hasCount = typeof count === 'number';
  /* A zero count is not "no badge" — it is a badge the caller may or may not want
     shown, and the two are different answers to different questions. */
  const hidden = hasCount && count === 0 && !showZero;

  const content = dot ? null
    : label ?? (hasCount ? formatCount(count, max) : null);

  /* \`attention\` when the count goes up — something new arrived, which is what a
     count badge is for — and never on the render that shows the first count, nor
     when it goes down, which is something being dealt with. The \`highlight\`
     layer inside marks any change to what the badge says. */
  const scope = useChangeMotion(hasCount ? count : undefined, (was, is) =>
    (typeof was === 'number' && typeof is === 'number' && is > was ? 'attention' : null));

  const badge = hidden ? null : (
    <span
      {...props}
      ref={mergeRefs(ref, scope as never)}
      /* The visual never speaks. Everything a listener gets comes from
         `description` or from the host's own name. */
      aria-hidden="true"
      className={cx(
        styles['badge'],
        'cr-resin-haze',
        'count',
        dot && styles['dot'],
        children ? styles['attached'] : undefined,
        children ? styles[PLACEMENT_CLASS[placement]] : undefined,
        className,
      )}
    >
      {content}
      {dot ? null : <ChangeHighlight />}
    </span>
  );

  /* `role="status"` rather than a bare `aria-live`, so the region exists from the
     first render and a later change is a change rather than an insertion — an
     inserted live region is announced inconsistently across screen readers. */
  const announcement = description === undefined ? null : (
    <VisuallyHidden role="status">{description}</VisuallyHidden>
  );

  if (!children) {
    return <>{badge}{announcement}</>;
  }

  return (
    <span className={styles['host']}>
      {children}
      {badge}
      {announcement}
    </span>
  );
});
