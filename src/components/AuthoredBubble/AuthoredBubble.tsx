'use client';

/* AuthoredBubble — a reading surface with one intentionally tightened corner.
 *
 * The silhouette is Crystal's identity and carries through from the approved
 * baseline: three content-radius corners and one cut to 6px, on the side the
 * message came from. It is not decoration, it is the only thing that tells you
 * *without reading* which way a message went — and that is exactly why the
 * catalogue also says "author and time are text, not implied by side alone".
 * A silhouette is a shortcut for people who can see it; the words are for
 * everybody, so `author` is required rather than optional.
 *
 * The cut is written with logical radius properties rather than mirrored in a
 * `[dir=rtl]` rule. `border-start-start-radius` is the top-left corner in a
 * left-to-right locale and the top-right in a right-to-left one, which is the
 * mirroring the catalogue asks for, expressed once instead of twice.
 *
 * `grouped` drops the cut. In a run of messages from the same author the cut
 * marks where the run *starts*; repeating it on every bubble turns a signal into
 * a texture.
 */
import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './AuthoredBubble.module.scss';

/** Delivery state. `pending` and `failed` are said in words, never in opacity. */
export type BubbleDelivery = 'sent' | 'pending' | 'failed';

export interface AuthoredBubbleProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Who wrote it. Required: the side of the thread is not an accessible name. */
  author: ReactNode;
  /** When. Pass a `time` element if the machine-readable form matters. */
  time?: ReactNode;
  /** The reader's own message. Takes the content-own pair and the other corner. */
  own?: boolean;
  /** Not the first in a run from the same author, so it carries no cut. */
  grouped?: boolean;
  delivery?: BubbleDelivery;
  /** What `pending` and `failed` say. Shown, not just announced. */
  deliveryLabel?: ReactNode;
  /** Play `message-in` on arrival. Off for virtualised history. */
  arriving?: boolean;
}

export const AuthoredBubble = forwardRef<HTMLElement, AuthoredBubbleProps>(function AuthoredBubble(
  { children, author, time, own = false, grouped = false, delivery = 'sent',
    deliveryLabel, arriving = false, className, ...props },
  ref,
) {
  const [scope, play] = useMotion({ once: true });
  const settled = useRef(false);

  useEffect(() => {
    /* "Only on a new message; do not replay on virtualised history or steal
       scroll" — Crystal's own note on the recipe. The caller says which this is,
       because only the caller knows. */
    if (settled.current) return;
    settled.current = true;
    if (arriving) void play('message-in');
  }, [arriving, play]);

  return (
    <article
      {...props}
      ref={mergeRefs(ref, scope)}
      data-own={own ? '' : undefined}
      data-delivery={delivery}
      className={cx(
        styles['bubble'],
        'cr-bubble',
        own ? cx(styles['own'], 'own') : undefined,
        grouped ? styles['grouped'] : undefined,
        className,
      )}
    >
      <p className={styles['meta']}>
        <span className={styles['author']}>{author}</span>
        {time === undefined ? null : <span className={styles['time']}>{time}</span>}
      </p>
      <div className={styles['body']}>{children}</div>
      {delivery === 'sent' || deliveryLabel === undefined ? null : (
        /* A failure is a thing that happened, so it is announced when it arrives
           rather than sitting silently under the message. */
        <p role={delivery === 'failed' ? 'status' : undefined} className={styles['delivery']}>
          {deliveryLabel}
        </p>
      )}
    </article>
  );
});
