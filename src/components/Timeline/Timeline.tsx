'use client';

/* Timeline — ordered events on a connector.
 *
 * An ordered list, because the order is the meaning: these events happened in
 * this sequence, and a reader who is told "list, 5 items" without the numbers has
 * lost the only thing a timeline adds to a list.
 *
 * `aria-current="step"` on the current event, and nothing on the others. The
 * status of the rest is said in words beside the marker rather than drawn into
 * it: the catalogue's four states are complete, current, upcoming and error, and
 * three of those are indistinguishable to anyone who cannot compare two small
 * circles by colour.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import styles from './Timeline.module.scss';

/** The four states the catalogue lists. */
export type TimelineStatus = 'complete' | 'current' | 'upcoming' | 'error';

export interface TimelineEvent {
  /** Stable across renders. */
  id: string;
  title: ReactNode;
  /** When it happened, or whatever else belongs under the title. */
  meta?: ReactNode;
  /** What else there is to say about it. */
  children?: ReactNode;
  status?: TimelineStatus;
  /** What goes in the marker. A number, an initial, an icon. */
  marker?: ReactNode;
  /**
   * The status, said. Shown to everyone: three of the four states differ only by
   * the colour of a small circle otherwise.
   */
  statusLabel?: ReactNode;
}

export interface TimelineProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: readonly TimelineEvent[];
  /** Names the sequence. Two timelines on a page are otherwise the same list. */
  label: string;
}

export const Timeline = forwardRef<HTMLElement, TimelineProps>(function Timeline(
  { items, label, className, ...props },
  ref,
) {
  return (
    <ol {...props} ref={ref as never} aria-label={label} className={cx(styles['timeline'], className)}>
      {/* An event added after the timeline first rendered arrives with
          `list-in`. The catalogue gives it no exit: events are recorded, not
          withdrawn. */}
      <ListPresence>
        {items.map((item) => {
          const status = item.status ?? 'upcoming';
          return (
            <PresenceItem
              key={item.id}
              leaves={false}
              className={styles['event']}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <span aria-hidden="true" className={styles['marker']}>{item.marker}</span>
              <span className={styles['body']}>
                <span className={styles['title']}>{item.title}</span>
                {item.statusLabel === undefined ? null : (
                  <span className={styles['status']}>{item.statusLabel}</span>
                )}
                {item.meta === undefined ? null : <span className={styles['meta']}>{item.meta}</span>}
                {item.children}
              </span>
            </PresenceItem>
          );
        })}
      </ListPresence>
    </ol>
  );
});
