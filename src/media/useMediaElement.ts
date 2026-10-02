'use client';

/* The state of a real `<audio>` or `<video>`, read from the element itself.
 *
 * The catalogue asks for this twice: "A real audio element", "native video
 * element underneath". The element is the source of truth for every value here.
 * A player that kept its own `isPlaying` flag would be wrong as soon as anything
 * else touched the media: the operating system's media keys, a Bluetooth
 * headset's pause button, another tab taking audio focus, the browser's own
 * picture-in-picture window, or a refused `autoplay`.
 *
 * The controls set none of this state. They call methods on the element, the
 * element fires events, and the events update the state. If the controls set
 * the state instead, a pause button that failed would still show a paused
 * player.
 *
 * `timeupdate` fires about four times a second, the browser's own rate, and is
 * not supplemented with an animation frame loop. A scrubber that updates sixty
 * times a second costs sixty renders a second, and a phone's battery, without
 * showing the reader anything more. The reason is that cost, not the rule that
 * nothing moves at rest.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface MediaState {
  isPlaying: boolean;
  /** Waiting for data. Distinct from paused: the reader did not ask for this. */
  isBuffering: boolean;
  isEnded: boolean;
  isMuted: boolean;
  /** 0 to 1. */
  volume: number;
  /** Seconds. */
  currentTime: number;
  /** Seconds, or 0 until the metadata says otherwise. */
  duration: number;
  /** 1 is normal speed. Read from the element, so a rate set elsewhere shows. */
  playbackRate: number;
  /** The video is in the browser's picture-in-picture window. Always false for audio. */
  isPictureInPicture: boolean;
}

export interface MediaControlsApi extends MediaState {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (to: number) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  /** Whether this element can enter picture in picture here. Read after mount. */
  canPictureInPicture: boolean;
  togglePictureInPicture: () => void;
}

const AT_REST: MediaState = {
  isPlaying: false,
  isBuffering: false,
  isEnded: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  isPictureInPicture: false,
};

/* Picture in picture is a video feature, behind a document flag (Firefox has
   its own window and no API, so the flag is absent there), and an element can
   opt out with `disablePictureInPicture`. Any of the three hides the control:
   a button that does nothing when pressed is worse than no button. */
function supportsPictureInPicture(element: HTMLMediaElement | null): boolean {
  if (typeof document === 'undefined' || !element || element.tagName !== 'VIDEO') return false;
  const video = element as HTMLVideoElement & { disablePictureInPicture?: boolean };
  return document.pictureInPictureEnabled === true
    && typeof video.requestPictureInPicture === 'function'
    && video.disablePictureInPicture !== true;
}

export function useMediaElement(
  media: RefObject<HTMLMediaElement | null>,
): MediaControlsApi {
  const [state, setState] = useState<MediaState>(AT_REST);
  /* The last state written, so the listener can skip a render when nothing a
     person could notice has changed. `timeupdate` is the frequent one. */
  const last = useRef<MediaState>(AT_REST);

  useEffect(() => {
    const element = media.current;
    if (!element) return undefined;

    const read = (): void => {
      const next: MediaState = {
        isPlaying: !element.paused && !element.ended,
        /* Read from `readyState` instead of a local `waiting`/`playing` flag. The
           element already knows whether it has enough data, and a flag would
           have to be cleared by an event that does not always arrive. */
        isBuffering: !element.paused && element.readyState < element.HAVE_FUTURE_DATA,
        isEnded: element.ended,
        isMuted: element.muted,
        volume: element.volume,
        currentTime: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
        playbackRate: element.playbackRate,
        isPictureInPicture: typeof document !== 'undefined'
          && (document as Document & { pictureInPictureElement?: Element | null }).pictureInPictureElement === element,
      };
      const before = last.current;
      if (
        before.isPlaying === next.isPlaying
        && before.isBuffering === next.isBuffering
        && before.isEnded === next.isEnded
        && before.isMuted === next.isMuted
        && before.volume === next.volume
        && before.duration === next.duration
        && before.playbackRate === next.playbackRate
        && before.isPictureInPicture === next.isPictureInPicture
        && Math.abs(before.currentTime - next.currentTime) < 0.05
      ) return;
      last.current = next;
      setState(next);
    };

    /* Every event that can change any of the above, including the ones nothing
       in this library fires: the operating system's media keys land here too. */
    const events = [
      'play', 'pause', 'ended', 'timeupdate', 'durationchange', 'loadedmetadata',
      'volumechange', 'waiting', 'playing', 'canplay', 'seeked', 'emptied',
      'ratechange', 'enterpictureinpicture', 'leavepictureinpicture',
    ] as const;
    for (const event of events) element.addEventListener(event, read);
    read();
    return () => {
      for (const event of events) element.removeEventListener(event, read);
    };
  }, [media]);

  const play = useCallback(() => {
    /* `play()` returns a promise that rejects when the browser refuses, because
       there has been no gesture yet or a policy forbids autoplay. The rejection
       is swallowed: the element stays paused, the state stays accurate, and
       there is nothing anybody could do about the error. */
    void media.current?.play().catch(() => undefined);
  }, [media]);

  const pause = useCallback(() => { media.current?.pause(); }, [media]);

  const toggle = useCallback(() => {
    const element = media.current;
    if (!element) return;
    if (element.paused || element.ended) void element.play().catch(() => undefined);
    else element.pause();
  }, [media]);

  const seek = useCallback((to: number) => {
    const element = media.current;
    if (!element) return;
    const limit = Number.isFinite(element.duration) ? element.duration : to;
    element.currentTime = Math.min(Math.max(0, to), limit);
  }, [media]);

  const setMuted = useCallback((muted: boolean) => {
    if (media.current) media.current.muted = muted;
  }, [media]);

  const setVolume = useCallback((volume: number) => {
    const element = media.current;
    if (!element) return;
    element.volume = Math.min(1, Math.max(0, volume));
    /* Raising the volume unmutes, so the slider never moves while the sound
       stays off. */
    if (element.volume > 0 && element.muted) element.muted = false;
  }, [media]);

  const setPlaybackRate = useCallback((rate: number) => {
    const element = media.current;
    if (!element || !Number.isFinite(rate) || rate <= 0) return;
    element.playbackRate = rate;
    /* Pitch is kept, so speech at 1.5x is faster and not higher. It is the
       default in every engine, and is set because a product may have turned it
       off for music. */
    if ('preservesPitch' in element) (element as HTMLMediaElement & { preservesPitch: boolean }).preservesPitch = true;
  }, [media]);

  /* Read after mount, so the server and the first client render agree. */
  const [canPictureInPicture, setCanPictureInPicture] = useState(false);
  useEffect(() => { setCanPictureInPicture(supportsPictureInPicture(media.current)); }, [media]);

  const togglePictureInPicture = useCallback(() => {
    const element = media.current as HTMLVideoElement | null;
    if (!element || !supportsPictureInPicture(element)) return;
    const doc = document as Document & { pictureInPictureElement?: Element | null; exitPictureInPicture?: () => Promise<void> };
    /* Both calls return promises that reject when the browser refuses (no
       gesture, no metadata yet). The state is read from the element's events,
       so a refusal leaves it accurate and there is nothing to report. */
    if (doc.pictureInPictureElement === element) void doc.exitPictureInPicture?.().catch(() => undefined);
    else void element.requestPictureInPicture().catch(() => undefined);
  }, [media]);

  return {
    ...state, play, pause, toggle, seek, setMuted, setVolume,
    setPlaybackRate, canPictureInPicture, togglePictureInPicture,
  };
}
