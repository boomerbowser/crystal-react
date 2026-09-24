'use client';

/* The state of a real `<audio>` or `<video>`, read from the element itself.
 *
 * "A **real** audio element", "native video element underneath" — the catalogue
 * says it twice, and this hook is what makes it true rather than decorative. The
 * element is the source of truth for every value here: a player that kept its
 * own `isPlaying` flag would be wrong the moment anything else touched the
 * media, and plenty does — the operating system's media keys, a Bluetooth
 * headset's pause button, another tab taking audio focus, the browser's own
 * picture-in-picture window, `autoplay` being refused.
 *
 * So nothing here is set by the controls. The controls call methods on the
 * element; the element fires events; the events are what move this state. A
 * pause button that did not work would show a paused player anyway if it were
 * the other way round.
 *
 * `timeupdate` fires about four times a second, which is the browser's own rate
 * and is deliberately not supplemented with an animation frame loop: a scrubber
 * that updates sixty times a second is sixty renders a second for a bar nobody
 * is watching that closely, and "nothing moves at rest" is not the argument —
 * the argument is that it costs a phone its battery to say the same thing.
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
}

export interface MediaControlsApi extends MediaState {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (to: number) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

const AT_REST: MediaState = {
  isPlaying: false,
  isBuffering: false,
  isEnded: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
};

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
        /* `readyState` rather than a `waiting`/`playing` flag of our own: the
           element already knows whether it has enough data, and a flag would
           have to be unset by an event that does not always arrive. */
        isBuffering: !element.paused && element.readyState < element.HAVE_FUTURE_DATA,
        isEnded: element.ended,
        isMuted: element.muted,
        volume: element.volume,
        currentTime: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
      };
      const before = last.current;
      if (
        before.isPlaying === next.isPlaying
        && before.isBuffering === next.isBuffering
        && before.isEnded === next.isEnded
        && before.isMuted === next.isMuted
        && before.volume === next.volume
        && before.duration === next.duration
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
    ] as const;
    for (const event of events) element.addEventListener(event, read);
    read();
    return () => {
      for (const event of events) element.removeEventListener(event, read);
    };
  }, [media]);

  const play = useCallback(() => {
    /* `play()` returns a promise that rejects when the browser refuses — no
       gesture yet, or a policy against autoplay. Swallowed rather than thrown:
       the element stays paused and the state stays truthful, which is the
       correct outcome and not an error anybody can act on. */
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
    /* Raising the volume unmutes. A slider that moved while the sound stayed off
       would be a control that appeared to do nothing. */
    if (element.volume > 0 && element.muted) element.muted = false;
  }, [media]);

  return { ...state, play, pause, toggle, seek, setMuted, setVolume };
}
