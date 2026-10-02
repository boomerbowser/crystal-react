'use client';

/* MediaControls: the shared transport, used by both players.
 *
 * "Each control is a button with a name; play and pause are one toggle with a
 * pressed state." With two buttons swapped by state, the one a reader has
 * focused disappears when they press it, and focus falls to the document. A
 * toggle stays in place, keeps focus, and reports the change: a screen reader
 * announces "playing" as "Play, pressed".
 *
 * "The scrubber is a slider announcing time, not a progress bar." A progress
 * bar only reports, and a scrubber is something a person moves. It also has to
 * speak a time: `1:23` is right on the screen and wrong in an announcement,
 * where it reads as "one colon twenty-three". The display takes `formatTime` and
 * the thumb takes `speakPosition`, and `src/media/time.ts` owns both so the two
 * players cannot format a second differently.
 *
 * "Pill; 44px targets throughout." The bar is a Resin pill and every control in
 * it is an `IconButton`, which already has the target floor.
 *
 * Buffering is announced as well as drawn. A spinner on a control bar reaches
 * only sighted readers.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Slider } from '../Slider/Slider.js';
import { formatTime, speakPosition, speakTime } from '../../media/time.js';
import { cx } from '../../styles/cx.js';
import styles from './MediaControls.module.scss';

export interface MediaControlsProps
  /* `onVolumeChange` is also a DOM media event, and a `<div>` inherits the
     handler for it. Ours takes a number and React's takes an event. It is
     dropped from the inherited set instead of renamed, because `onVolumeChange`
     is the name a person would look for. */
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onVolumeChange'> {
  isPlaying: boolean;
  onPlayPause: () => void;
  /** Seconds. */
  currentTime: number;
  duration: number;
  onSeek: (to: number) => void;
  /** Waiting for data. This differs from paused, and is announced. */
  isBuffering?: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  /** 0 to 1. Omit the handler and the volume slider does not appear. */
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  /** Seconds to jump. Omit and the skip controls do not appear. */
  skipBy?: number;
  onSkip?: (seconds: number) => void;
  /** Extra controls at the end of the bar, such as captions, full screen or a playlist. */
  children?: ReactNode;
  /** What is being played, for the controls' names. */
  mediaLabel?: string;
}

const PlayIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />
  </svg>
);

const PauseIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none" />
  </svg>
);

const BackIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M11 6L5 12l6 6M19 6l-6 6 6 6" />
  </svg>
);

const ForwardIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M13 6l6 6-6 6M5 6l6 6-6 6" />
  </svg>
);

const SoundIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4zM17 9a4 4 0 0 1 0 6" />
  </svg>
);

const MutedIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4zM17 10l4 4M21 10l-4 4" />
  </svg>
);

export const MediaControls = forwardRef<HTMLDivElement, MediaControlsProps>(
  function MediaControls({
    isPlaying, onPlayPause, currentTime, duration, onSeek, isBuffering = false,
    isMuted = false, onMuteToggle, volume, onVolumeChange, skipBy = 10, onSkip,
    children, mediaLabel, className, ...props
  }, ref): ReactNode {
    const of = mediaLabel ? ` ${mediaLabel}` : '';
    /* Before the metadata arrives there is no duration, and a scrubber with a
       range of nought cannot be operated. It is disabled and says so, instead
       of claiming a length nobody knows yet. */
    const known = Number.isFinite(duration) && duration > 0;

    return (
      <div {...props} ref={ref} className={cx(styles['controls'], 'cr-resin', className)} data-buffering={isBuffering ? '' : undefined}>
        {onSkip ? (
          <IconButton
            label={`Back ${skipBy} seconds`}
            icon={BackIcon}
            onPress={() => onSkip(-skipBy)}
          />
        ) : null}

        {/* One toggle. Its name stays "Play" and its pressed state changes. If
            both the name and the icon changed, the reader who pressed it would
            have to work out which control they now have. */}
        <IconButton
          label={`Play${of}`}
          icon={isPlaying ? PauseIcon : PlayIcon}
          isSelected={isPlaying}
          onPress={onPlayPause}
        />

        {onSkip ? (
          <IconButton
            label={`Forward ${skipBy} seconds`}
            icon={ForwardIcon}
            onPress={() => onSkip(skipBy)}
          />
        ) : null}

        <span className={styles['time']}>{formatTime(currentTime)}</span>

        <Slider
          className={styles['scrubber'] ?? ''}
          label={`Seek${of}`}
          hideOutput
          hideLabel
          minValue={0}
          maxValue={known ? duration : 1}
          step={1}
          value={Math.min(currentTime, known ? duration : 1)}
          isDisabled={!known}
          onChange={(next) => onSeek(next)}
          /* What the thumb says. `1:23` is not a time to a screen reader. */
          valueText={(at) => speakPosition(at, known ? duration : 0)}
        />

        <span className={styles['time']}>{known ? formatTime(duration) : '--:--'}</span>

        {onMuteToggle ? (
          <IconButton
            label={`Mute${of}`}
            icon={isMuted ? MutedIcon : SoundIcon}
            isSelected={isMuted}
            onPress={onMuteToggle}
          />
        ) : null}

        {onVolumeChange && volume !== undefined ? (
          <Slider
            className={styles['volume'] ?? ''}
            label="Volume"
            hideOutput
            hideLabel
            minValue={0}
            maxValue={1}
            step={0.05}
            value={volume}
            onChange={(next) => onVolumeChange(next)}
            formatOptions={{ style: 'percent' }}
          />
        ) : null}

        {children}

        {/* Announced as well as drawn, because a spinner on the bar reaches only
            sighted readers. Polite, because the reader is waiting and should not
            be interrupted. */}
        <span role="status" className={styles['announcement']}>
          {isBuffering ? `Buffering at ${speakTime(currentTime)}` : ''}
        </span>
      </div>
    );
  },
);
