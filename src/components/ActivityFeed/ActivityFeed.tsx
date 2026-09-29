'use client';

/* ActivityFeed — what happened, who did it, and when, newest first.
 *
 * "**Live updates are announced politely and never steal focus.**" States:
 * `at-rest`, `loading`, `empty`, `live`.
 *
 * A feed that updates while it is read has two ways to go wrong, and the clause
 * names both. It can say nothing, so a reader who cannot see the list grow never
 * learns an event arrived; or it can take them to the event, which moves them
 * out of whatever they were reading every time somebody else acts. So:
 *
 *   - **New events are said, politely, and counted.** "2 new events" — from the
 *     events whose ids the feed had not shown before, not from the length of the
 *     list, which also changes when old events page in. The first render says
 *     nothing: the events it shows were already there.
 *   - **Focus stays where it is.** An arriving event is inserted with `list-in`
 *     and nothing is focused; the reader goes to it when they choose to.
 *
 * `live` is shown as well as said — a word beside the heading while updates are
 * arriving — because a feed that changes by itself should say that it does.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Loader } from '../Loader/Loader.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import { cx } from '../../styles/cx.js';
import styles from './ActivityFeed.module.scss';

export interface ActivityEvent {
  id: string;
  /** Who did it. */
  actor: ReactNode;
  /** What they did, as the rest of the sentence: "commented on Quarterly figures". */
  action: ReactNode;
  /** When, for machines: an ISO date and time. */
  dateTime: string;
  /** When, for people: "3 minutes ago". The caller's words, in the reader's language. */
  timestamp: ReactNode;
  /** A face or a mark. Decorative: the actor's name is the name. */
  avatar?: ReactNode;
}

export type ActivityFeedState = 'at-rest' | 'loading' | 'empty';

export interface ActivityFeedProps {
  title: ReactNode;
  headingLevel?: 2 | 3 | 4;
  events: readonly ActivityEvent[];
  state?: ActivityFeedState;
  /** Updates are arriving by themselves. Shown beside the heading. */
  isLive?: boolean;
  liveLabel?: string;
  /** What is said when events arrive. */
  announceNew?: (count: number) => string;
  emptyLabel?: ReactNode;
  /** More, below the list — a "Show earlier" control. */
  footer?: ReactNode;
  className?: string;
}

export function ActivityFeed({
  title, headingLevel = 2, events, state = 'at-rest', isLive = false, liveLabel = 'Live',
  announceNew = (count) => (count === 1 ? '1 new event' : `${String(count)} new events`),
  emptyLabel = 'Nothing has happened here yet', footer, className,
}: ActivityFeedProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const headingId = useId();
  const arrived = useArrivals(events);
  const shown = state === 'at-rest' && events.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state === 'loading' || undefined}
      className={cx(styles['feed'], className)}
      data-cr-state={isLive ? 'live' : state}
    >
      <div className={cx(styles['top'])}>
        <Heading id={headingId} className={cx(styles['heading'])}>{title}</Heading>
        {isLive ? <span className={cx(styles['live'])}>{liveLabel}</span> : null}
      </div>

      {state === 'loading' ? <Loader label="Loading activity" /> : null}
      {state === 'empty' || (state === 'at-rest' && events.length === 0) ? (
        <EmptyState state="empty" title={emptyLabel} />
      ) : null}
      {shown ? (
        <ol className={cx(styles['events'])}>
          <ListPresence>
            {events.map((event) => (
              <PresenceItem key={event.id} leaves={false} className={cx(styles['event'], 'cr-haze')}>
                {event.avatar ? <span aria-hidden="true" className={cx(styles['avatar'])}>{event.avatar}</span> : null}
                <p className={cx(styles['sentence'])}>
                  <span className={cx(styles['actor'])}>{event.actor}</span>{' '}{event.action}
                </p>
                <time dateTime={event.dateTime} className={cx(styles['time'])}>{event.timestamp}</time>
              </PresenceItem>
            ))}
          </ListPresence>
        </ol>
      ) : null}
      {footer}

      {/* Polite and present from the first frame; nothing here is focused. */}
      <VisuallyHidden role="status">{arrived > 0 ? announceNew(arrived) : ''}</VisuallyHidden>
    </section>
  );
}

/* How many events arrived in the latest change: ids the feed had not shown
   before. Zero on the first render, and zero when the list only shrinks. */
function useArrivals(events: readonly ActivityEvent[]): number {
  const seen = useRef<Set<string> | null>(null);
  const [arrived, setArrived] = useState(0);
  useEffect(() => {
    const ids = events.map((event) => event.id);
    if (seen.current !== null) {
      const fresh = ids.filter((id) => !seen.current!.has(id)).length;
      if (fresh > 0) setArrived(fresh);
    }
    seen.current = new Set([...(seen.current ?? []), ...ids]);
  }, [events]);
  return arrived;
}
