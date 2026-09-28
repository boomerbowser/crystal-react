'use client';

/* OverlayBadge — a mark over the corner of something else.
 *
 * Where `Badge` is a count attached to a host, this is a *glyph* over one: a
 * verification tick on an avatar, a lock on a document tile, an error mark on a
 * thumbnail. The distinction the catalogue draws is what it is for — "labels its
 * host rather than standing alone" — and that is why the accessible name lands
 * next to the host instead of on the badge's own shape.
 *
 * "Never clipped by its host" is the one geometric rule and it is easy to break
 * by accident: the badge overhangs the corner, so the wrapper must not clip, and
 * the host must not be the positioned ancestor. Both are this component's job,
 * because a caller who wraps a rounded image in `overflow: hidden` has no idea
 * they have just cut the badge in half.
 *
 * Without a `label` the badge is `aria-hidden`, because a decorative mark over a
 * named thing is read as a second unnamed thing otherwise.
 */
import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import styles from './OverlayBadge.module.scss';

/** Which corner it sits over. */
export type OverlayBadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

export interface OverlayBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** What the badge is over. */
  children: ReactNode;
  /** The mark. An icon, a glyph, a very short string. */
  badge: ReactNode;
  /** What the mark says about its host. Without one the badge is hidden. */
  label?: string;
  placement?: OverlayBadgePlacement;
}

const PLACEMENT_CLASS: Record<OverlayBadgePlacement, string> = {
  'top-end': 'topEnd',
  'top-start': 'topStart',
  'bottom-end': 'bottomEnd',
  'bottom-start': 'bottomStart',
};

export const OverlayBadge = forwardRef<HTMLSpanElement, OverlayBadgeProps>(function OverlayBadge(
  { children, badge, label, placement = 'top-end', className, ...props },
  ref,
) {
  const semantics = label === undefined
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label };

  /* `attention` when what the badge says changes — compared as text, since
     `badge` is usually an element and a new element is not a new value — and
     never on the render that first shows it. */
  const [cue, play] = useMotion();
  const said = useRef<string | null>(null);
  useEffect(() => {
    const text = (cue.current as HTMLElement | null)?.textContent ?? '';
    if (said.current !== null && said.current !== text) void play('attention');
    said.current = text;
  });

  return (
    <span {...props} ref={ref} className={cx(styles['host'], className)}>
      {children}
      <span
        {...semantics}
        ref={cue as never}
        className={cx(styles['badge'], 'cr-haze', styles[PLACEMENT_CLASS[placement]])}
      >
        {badge}
      </span>
    </span>
  );
});
