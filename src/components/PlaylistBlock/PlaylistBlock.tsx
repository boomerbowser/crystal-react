'use client';

/* PlaylistBlock: an ordered, reorderable queue with a now-playing row.
 *
 * "Reorder works by keyboard; the now-playing row is `aria-current`."
 * States: `at-rest`, `playing`, `dragging`, `focus-visible`.
 *
 * Both halves are React Aria's GridList:
 *
 *   - Reordering is drag and drop that the keyboard can do. Each row has a
 *     drag handle. From it, Enter picks the track up, the arrow keys move it
 *     between the drop positions (each one announced), and Enter puts it down.
 *     A pointer drags the same handle. The new order is computed here and handed
 *     to the product as a list of ids, because the queue is the product's.
 *   - The now-playing row says so. `aria-current` goes on the row the reader
 *     lands on. React Aria owns that row and will not take the attribute as a
 *     prop, so it is set from inside the row, as `NavigationTree` does. Weight
 *     shows it too.
 *
 * Motion is Crystal's and bound to state: a row lifts with `drag-pickup` as it
 * is picked up and settles with `drag-settle` where it lands; the rows it
 * displaced play `reorder`; a track added plays `list-in`, and a track removed
 * plays `list-out` before it goes. React Aria drops a row the moment its item
 * leaves the collection, so the block keeps a removed track in the grid for the
 * length of its exit, disabled so the keyboard passes over it, and drops it
 * when the recipe ends (at once under reduced motion).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  GridList, GridListItem, Button, DropIndicator, useDragAndDrop, type Key,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { usePlayOnChange } from '../../motion/useChangeMotion.js';
import { dropIndicatorClassName } from '../DropIndicator/DropIndicator.js';
import { cx } from '../../styles/cx.js';
import styles from './PlaylistBlock.module.scss';

export interface PlaylistTrack {
  id: string;
  title: ReactNode;
  /** The title as text: the row's name, and the drag handle's. */
  titleText: string;
  artist?: ReactNode;
  /** "3:41". */
  duration?: string;
}

export interface PlaylistBlockProps {
  /** Names the queue. */
  label: string;
  tracks: readonly PlaylistTrack[];
  /** The track playing now. Its row is `aria-current`. */
  nowPlaying?: string;
  onReorder: (ids: readonly string[]) => void;
  /** Enter on a row, or a double click. */
  onPlay?: (id: string) => void;
  /** The drag handle's name, given the track. */
  handleLabel?: (title: string) => string;
  nowPlayingLabel?: string;
  className?: string;
}

export function PlaylistBlock({
  label, tracks, nowPlaying, onReorder, onPlay,
  handleLabel = (title) => `Reorder ${title}`, nowPlayingLabel = 'Now playing', className,
}: PlaylistBlockProps): React.JSX.Element {
  /* Each row's player, by track. React Aria rebuilds its rows when the order
     changes, so a row cannot see its own move from the inside; the block, which
     knows the old order and the new, plays it on the rows that moved. */
  const players = useRef(new Map<string, (name: string) => Promise<void>>());
  const moving = useRef<ReadonlySet<string>>(new Set());
  const arriving = useRef(new Set<string>());
  const order = useRef<readonly string[] | null>(null);

  /* Tracks the product removed that are still playing `list-out`, each with the
     position it left. Worked out while rendering, so the commit that receives
     the shorter list still holds the row and React Aria does not drop it. */
  const [leaving, setLeaving] = useState<readonly { track: PlaylistTrack; at: number }[]>([]);
  const [seen, setSeen] = useState(tracks);
  if (seen !== tracks) {
    const kept = new Set(tracks.map((track) => track.id));
    const gone = seen.flatMap((track, at) => (kept.has(track.id) ? [] : [{ track, at }]));
    setSeen(tracks);
    if (gone.length) setLeaving((current) => [...current.filter((one) => !kept.has(one.track.id)), ...gone]);
  }
  const shown = [...tracks];
  for (const { track, at } of leaving) {
    if (!shown.some((one) => one.id === track.id)) shown.splice(Math.min(at, shown.length), 0, track);
  }
  const leavingKeys = leaving.map((one) => one.track.id);

  /* Each exit plays once, though the list changes as the others finish. */
  const exiting = useRef(new Set<string>());
  useEffect(() => {
    for (const { track } of leaving) {
      if (exiting.current.has(track.id)) continue;
      exiting.current.add(track.id);
      const done = (): void => {
        exiting.current.delete(track.id);
        setLeaving((current) => current.filter((one) => one.track.id !== track.id));
      };
      const play = players.current.get(track.id);
      if (play) void play('list-out').finally(done);
      else done();
    }
  }, [leaving]);

  useEffect(() => {
    const now = tracks.map((track) => track.id);
    const before = order.current;
    order.current = now;
    if (!before) return;
    /* Added since the last render: a real arrival, never the first render's
       rows. React Aria builds a new row in a pass of its own, so its player may
       not be registered yet; the arrival is then left for the row to play when
       it registers. */
    for (const id of now) {
      if (before.includes(id)) continue;
      const play = players.current.get(id);
      if (play) void play('list-in');
      else arriving.current.add(id);
    }
    if (before.length !== now.length) return;
    for (const [index, id] of now.entries()) {
      if (before[index] === id) continue;
      /* Put down here, or pushed along by the one that was. */
      void players.current.get(id)?.(moving.current.has(id) ? 'drag-settle' : 'reorder');
    }
    moving.current = new Set();
  }, [tracks]);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: (event) => {
      const carried = [...event.keys].map(String);
      const rest = tracks.map((track) => track.id).filter((id) => !carried.includes(id));
      const at = rest.indexOf(String(event.target.key));
      const index = event.target.dropPosition === 'after' ? at + 1 : at;
      const next = [...rest.slice(0, index), ...carried, ...rest.slice(index)];
      moving.current = new Set(carried);
      onReorder(next);
    },
    renderDropIndicator: (target) => <DropIndicator target={target} className={dropIndicatorClassName} />,
  });

  return (
    <GridList
      aria-label={label}
      items={shown}
      disabledKeys={leavingKeys}
      dragAndDropHooks={dragAndDropHooks}
      {...(onPlay ? { onAction: (key: Key) => { onPlay(String(key)); } } : {})}
      className={cx(styles['playlist'], className)}
    >
      {(track: PlaylistTrack) => (
        <GridListItem id={track.id} textValue={track.titleText} className={cx(styles['row'], 'cr-haze')}>
          {({ isDragging }) => (
            <Track
              track={track}
              isCurrent={track.id === nowPlaying}
              isDragging={isDragging ?? false}
              players={players.current}
              arriving={arriving.current}
              handleLabel={handleLabel(track.titleText)}
              nowPlayingLabel={nowPlayingLabel}
            />
          )}
        </GridListItem>
      )}
    </GridList>
  );
}

function Track({ track, isCurrent, isDragging, players, arriving, handleLabel, nowPlayingLabel }: {
  track: PlaylistTrack;
  isCurrent: boolean;
  isDragging: boolean;
  /** Where this row registers its player, for the block to play its move. */
  players: Map<string, (name: string) => Promise<void>>;
  /** Tracks added before their row could register; the row plays `list-in`. */
  arriving: Set<string>;
  handleLabel: string;
  nowPlayingLabel: string;
}): React.JSX.Element {
  const [scope, play] = useMotion();

  /* `aria-current` on the row React Aria owns, from inside it. */
  useEffect(() => {
    const row = (scope.current as HTMLElement | null)?.closest('[role="row"]');
    if (!row) return;
    if (isCurrent) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  }, [isCurrent, scope]);

  /* Registered before the block's effect runs, because a child's effects run
     first, so a row rebuilt by the reorder is the one the block plays on. */
  useEffect(() => {
    players.set(track.id, play);
    if (arriving.delete(track.id)) void play('list-in');
    return () => { if (players.get(track.id) === play) players.delete(track.id); };
  }, [players, arriving, track.id, play]);

  /* Picked up. Putting down, and being pushed along, are the block's to play. */
  usePlayOnChange(isDragging, (was, is) => (is && !was ? 'drag-pickup' : null), play);

  return (
    <div ref={scope as never} className={cx(styles['track'])} data-current={isCurrent || undefined}>
      <Button slot="drag" aria-label={handleLabel} className={cx(styles['handle'], 'cr-bare', 'cr-drag-handle')}>
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
      </Button>
      <span className={cx(styles['text'])}>
        <span className={cx(styles['title'])}>{track.title}</span>
        {track.artist ? <span className={cx(styles['artist'])}>{track.artist}</span> : null}
      </span>
      {isCurrent ? <span className={cx(styles['now'])}>{nowPlayingLabel}</span> : null}
      {track.duration ? <span className={cx(styles['duration'])}>{track.duration}</span> : null}
    </div>
  );
}
