'use client';

/* AudioPlayer — an audio transport with scrubbing and volume.
 *
 * "**A real audio element.**" The `<audio>` is the component, not an
 * implementation detail behind it: it is what plays, what the operating
 * system's media keys reach, what a Bluetooth headset's pause button pauses,
 * and what the browser's own controls would drive if a product asked for them.
 * Everything drawn here reads its state from that element rather than keeping a
 * copy — see `useMediaElement`, which explains why a player that tracked its own
 * `isPlaying` is wrong the first time anything else touches the media.
 *
 * It is exposed, too: `mediaRef` hands the element to the caller, because
 * sources, playlists and streaming are the product's half and all of them are
 * done on the element.
 *
 * The transport is `MediaControls`, shared with the video player. "The scrubber
 * is a slider announcing time, not a progress bar" is enforced there.
 */
import {
  forwardRef, useRef, type AudioHTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { MediaControls } from '../MediaControls/MediaControls.js';
import { useMediaElement } from '../../media/useMediaElement.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './AudioPlayer.module.scss';

export interface AudioPlayerProps
  /* `title` is dropped from the inherited set: on an element it is the tooltip
     attribute and must be a string, and here it is the heading above the
     transport. A tooltip is not what a player's title is. */
  extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'controls' | 'children' | 'title'> {
  /** What is playing. Named, because "Play" alone names nothing on a page of
   *  players. */
  label: string;
  /** Shown above the transport. Omit it and the label is the only naming. */
  title?: ReactNode;
  /** `<source>` elements, or a `<track>`. The element's own children. */
  children?: ReactNode;
  /** Seconds the skip controls jump. Omit to leave them off. */
  skipBy?: number;
  /** The element itself, for sources, playlists and streaming. */
  mediaRef?: RefObject<HTMLAudioElement | null>;
  className?: string;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(function AudioPlayer({
  label, title, children, skipBy, mediaRef, className, ...props
}, ref): ReactNode {
  const own = useRef<HTMLAudioElement>(null);
  const media = useMediaElement(own);

  return (
    <div className={cx(styles['player'], className)}>
      {title ? <p className={styles['title']}>{title}</p> : null}
      {/* No `controls`: the transport below is the control surface, and two sets
          of controls for one element is two sets of everything — two tab stops
          per action, two things to style, two places a state can be shown
          differently. The element keeps its own semantics all the same. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a caption track is the product's to supply through `children`, and an audio element with no spoken content owes none */}
      <audio
        {...props}
        ref={mergeRefs(ref, own, mediaRef)}
        aria-label={label}
        className={styles['element']}
      >
        {children}
      </audio>
      <MediaControls
        mediaLabel={label}
        isPlaying={media.isPlaying}
        onPlayPause={media.toggle}
        currentTime={media.currentTime}
        duration={media.duration}
        onSeek={media.seek}
        isBuffering={media.isBuffering}
        isMuted={media.isMuted}
        onMuteToggle={() => media.setMuted(!media.isMuted)}
        volume={media.volume}
        onVolumeChange={media.setVolume}
        {...(skipBy === undefined
          ? {}
          : { skipBy, onSkip: (by: number) => media.seek(media.currentTime + by) })}
      />
    </div>
  );
});
