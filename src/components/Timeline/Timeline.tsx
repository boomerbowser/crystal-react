'use client';

/* Timeline: ordered events on a connector.
 *
 * An ordered list, because the order is the meaning. These events happened in
 * this sequence, and a reader who is told "list, 5 items" without the numbers has
 * lost what a timeline adds to a list.
 *
 * `aria-current="step"` goes on the current event and nothing on the others. The
 * status of the rest is written in words beside the marker instead of drawn into
 * it. The catalogue's four states are complete, current, upcoming and error, and
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
   * The status in words, shown to everyone. Without it, three of the four states
   * differ only by the colour of a small circle.
   */
  statusLabel?: ReactNode;
}

export interface TimelineProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: readonly TimelineEvent[];
  /** Names the sequence, so two timelines on a page can be told apart. */
  label: string;
}

export const Timeline = forwardRef<HTMLElement, TimelineProps>(function Timeline(
  { items, label, className, ...props },
  ref,
) {
  return (
    <ol {...props} ref={ref as never} aria-label={label} className={cx(styles['timeline'], className)}>
      {/* An event added after the timeline first rendered arrives with
          `list-in`. The catalogue gives it no exit, because recorded events
          are never withdrawn. */}
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
