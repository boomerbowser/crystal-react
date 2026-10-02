'use client';

/* VideoPlayer is a video surface with Crystal transport controls.
 *
 * "Native video element underneath. Controls are real buttons, **captions are
 * supported and their state is announced**, and **keyboard shortcuts do not trap
 * focus**."
 *
 * Captions. A `<track>` is not enough on its own, because a reader has no way to
 * turn it on and no way to know whether it is on. The caption control is a
 * toggle over `textTracks`, its pressed state is the track's real `mode`, and
 * the change is announced in words for a reader who cannot see subtitles
 * appear.
 *
 * Keyboard shortcuts do not trap focus. The player answers Space, the arrow keys
 * and `M` while focus is inside it, and does nothing when focus is not. There is
 * no document-level listener, which would steal the space bar from the page's
 * own scrolling and the arrow keys from every control elsewhere. The shortcuts
 * never `preventDefault` on a control that has its own use for the key: the
 * handler ignores an event that started on a button, a slider or anything else
 * focusable, so Space on the play toggle is the button's Space.
 *
 * Showing and hiding the controls is Crystal's, and Crystal's rule is that
 * nothing moves at rest, so the bar does not fade in and out on a timer. It is
 * shown whenever a pointer is over the video or focus is inside the player, and
 * hidden otherwise, so a person always started the change.
 */
import {
  forwardRef, useCallback, useEffect, useRef, useState,
  type KeyboardEvent, type ReactNode, type RefObject, type VideoHTMLAttributes,
} from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { MediaControls } from '../MediaControls/MediaControls.js';
import { useMediaElement } from '../../media/useMediaElement.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import { useMediaArrival } from '../../media/useMediaArrival.js';
import styles from './VideoPlayer.module.scss';

export interface VideoPlayerProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'controls' | 'children' | 'title'> {
  /** What is playing. The video's accessible name. */
  label: string;
  /** `<source>` and `<track>` elements. */
  children?: ReactNode;
  /** Seconds the arrow keys and the skip controls jump. */
  skipBy?: number;
  /** The element itself, for sources, captions, DRM and analytics. */
  mediaRef?: RefObject<HTMLVideoElement | null>;
  /** What the caption control is called. */
  captionsLabel?: string;
  /** More controls at the end of the transport, after captions, such as full screen or quality. */
  controls?: ReactNode;
  className?: string;
}

const CaptionsIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M9 11a2 2 0 1 0 0 2M16 11a2 2 0 1 0 0 2" />
  </svg>
);

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer({
  label, children, skipBy = 10, mediaRef, captionsLabel = 'Captions', controls, className, ...props
}, ref): ReactNode {
  const own = useRef<HTMLVideoElement>(null);
  const media = useMediaElement(own);
  /* `media-in` on the picture once its first frame is ready. */
  const arrival = useMediaArrival(own);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [hasCaptions, setHasCaptions] = useState(false);
  const [said, setSaid] = useState('');

  /* The track's real mode, read from the element. A separate flag would go
     stale when anything else changed the mode, and some engines turn a track on
     from the user's system caption preference. */
  const readTracks = useCallback(() => {
    const element = own.current;
    if (!element) return;
    const tracks = [...element.textTracks].filter(
      (track) => track.kind === 'captions' || track.kind === 'subtitles',
    );
    setHasCaptions(tracks.length > 0);
    setCaptionsOn(tracks.some((track) => track.mode === 'showing'));
  }, []);

  useEffect(() => {
    const element = own.current;
    if (!element) return undefined;
    readTracks();
    /* `TextTrackList` is an `EventTarget` in current engines. It is not one in
       jsdom, and was not in several shipped Safaris. The listener catches a
       track turned on by the system's caption preference. Without it the
       component is still correct and learns about the change later. The check
       is guarded so the player does not throw on load in those engines. */
    const tracks: EventTarget | null = typeof element.textTracks.addEventListener === 'function'
      ? element.textTracks
      : null;
    tracks?.addEventListener('change', readTracks);
    element.addEventListener('loadedmetadata', readTracks);
    return () => {
      tracks?.removeEventListener('change', readTracks);
      element.removeEventListener('loadedmetadata', readTracks);
    };
  }, [readTracks]);

  const toggleCaptions = useCallback(() => {
    const element = own.current;
    if (!element) return;
    const tracks = [...element.textTracks].filter(
      (track) => track.kind === 'captions' || track.kind === 'subtitles',
    );
    const next = !tracks.some((track) => track.mode === 'showing');
    for (const track of tracks) track.mode = next ? 'showing' : 'disabled';
    readTracks();
    /* Announced. A reader who cannot see subtitles appear has no other way to
       know whether the control did anything. */
    setSaid(next ? `${captionsLabel} on` : `${captionsLabel} off`);
  }, [captionsLabel, readTracks]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    /* The shortcut never takes a key from the control the reader is on. Space
       on the play toggle is the button's Space, and the arrow keys inside the
       scrubber are the slider's. The player answers only a press that started
       on the player itself or on the video. */
    const from = event.target as HTMLElement;
    if (from.closest('button, input, [role="slider"], a, select, textarea')) return;

    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        media.toggle();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        media.seek(media.currentTime - skipBy);
        break;
      case 'ArrowRight':
        event.preventDefault();
        media.seek(media.currentTime + skipBy);
        break;
      case 'm':
        event.preventDefault();
        media.setMuted(!media.isMuted);
        break;
      default:
        break;
    }
  }, [media, skipBy]);

  return (
    /* No `tabIndex` on the region and no document listener. The shortcuts work
       only when focus is already inside the player, which is what "do not trap
       focus" requires. A player that took the space bar from the page would be
       a trap. */
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions -- the handler is a shortcut for controls that are focusable in their own right, not a control itself
    <div className={cx(styles['player'], className)} onKeyDown={onKeyDown}>
      <div className={styles['surface']}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the caption `<track>` is the product's to supply through `children`; the control for it is below */}
        <video
          {...props}
          ref={mergeRefs(ref, own, mediaRef, arrival as never)}
          aria-label={label}
          className={styles['video']}
          onClick={media.toggle}
        >
          {children}
        </video>
        <div className={styles['bar']}>
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
            skipBy={skipBy}
            onSkip={(by) => media.seek(media.currentTime + by)}
          >
            {hasCaptions ? (
              <IconButton
                label={captionsLabel}
                icon={CaptionsIcon}
                isSelected={captionsOn}
                onPress={toggleCaptions}
              />
            ) : null}
            {controls}
          </MediaControls>
        </div>
      </div>
      <span role="status" className={styles['announcement']}>{said}</span>
    </div>
  );
});
