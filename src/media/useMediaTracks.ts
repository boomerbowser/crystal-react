'use client';

/* The tracks of a real `<video>` or `<audio>`: captions and subtitles, audio
 * tracks and video tracks, read from the element and switched on it.
 *
 * As with `useMediaElement`, the element is the source of truth. The lists are
 * read from `textTracks`, `audioTracks` and `videoTracks`, and every change is
 * made on those lists and read back from their events, so a track the browser
 * turned on from the reader's system caption preference, or one a streaming
 * library added after the manifest loaded, shows here without being told.
 *
 * Three facts about the platform shape the API:
 *
 *   - Captions are rendered by Crystal, not the browser. A browser draws a cue
 *     at the bottom of the picture, under the transport while the transport is
 *     shown, and in its own type in every engine. The chosen track is put in
 *     `hidden` mode, which keeps its cues firing without drawing them, and the
 *     player draws `activeCues` above the transport on Stone. `native: true`
 *     leaves the browser to draw them, in `showing` mode.
 *   - `audioTracks` and `videoTracks` exist in Safari, and in Chromium only
 *     behind a flag. Where a list is absent the hook reports no tracks, so the
 *     player offers no choice it cannot make.
 *   - Switching a video track is not switching quality. Adaptive streams change
 *     rendition inside the streaming library, which is the product's; the
 *     player takes those renditions as a prop. A native video-track list is
 *     offered only when the file really carries more than one.
 */
import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface MediaTrackOption {
  /** Stable for the life of the element: the track's own id, or its position. */
  id: string;
  /** What the reader sees: the track's label, else its language, else its position. */
  label: string;
  language: string;
  kind: string;
}

export interface MediaTracks {
  /** Caption and subtitle tracks. Chapters, descriptions and metadata are not offered. */
  textTracks: MediaTrackOption[];
  /** The caption track that is on, or `null` for off. */
  activeTextTrack: string | null;
  selectTextTrack: (id: string | null) => void;
  /** The cues to draw now, when Crystal draws them. Empty when `native`. */
  activeCues: TextTrackCue[];
  /** Empty where the browser has no audio track list. */
  audioTracks: MediaTrackOption[];
  activeAudioTrack: string | null;
  selectAudioTrack: (id: string) => void;
  /** Empty where the browser has no video track list. */
  videoTracks: MediaTrackOption[];
  activeVideoTrack: string | null;
  selectVideoTrack: (id: string) => void;
}

/* The track lists that are not in TypeScript's DOM library, as far as they are
   used here. */
interface PlatformTrack { id: string; kind: string; label: string; language: string; enabled?: boolean; selected?: boolean }
interface PlatformTrackList extends EventTarget { readonly length: number; [index: number]: PlatformTrack }
type WithTrackLists = HTMLMediaElement & { audioTracks?: PlatformTrackList; videoTracks?: PlatformTrackList };

const CAPTION_KINDS = new Set(['captions', 'subtitles']);

function captionTracks(element: HTMLMediaElement): TextTrack[] {
  return [...element.textTracks].filter((track) => CAPTION_KINDS.has(track.kind));
}

function idOf(track: { id?: string }, index: number, prefix: string): string {
  return track.id ? track.id : `${prefix}-${index}`;
}

function labelOf(track: { label?: string; language?: string }, index: number, noun: string): string {
  if (track.label) return track.label;
  if (track.language) {
    /* The language's own name in the reader's language, where the runtime can
       give one: "French", not "fr". */
    try {
      const names = new Intl.DisplayNames(undefined, { type: 'language' });
      return names.of(track.language) ?? track.language;
    } catch {
      return track.language;
    }
  }
  return `${noun} ${index + 1}`;
}

function listOf(list: PlatformTrackList | undefined, noun: string, prefix: string): MediaTrackOption[] {
  if (!list) return [];
  const out: MediaTrackOption[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const track = list[i];
    if (!track) continue;
    out.push({ id: idOf(track, i, prefix), label: labelOf(track, i, noun), language: track.language, kind: track.kind });
  }
  return out;
}

function activeOf(list: PlatformTrackList | undefined, flag: 'enabled' | 'selected', prefix: string): string | null {
  if (!list) return null;
  for (let i = 0; i < list.length; i += 1) {
    const track = list[i];
    if (track?.[flag]) return idOf(track, i, prefix);
  }
  return null;
}

/* Events on a list that may not be an `EventTarget` in every engine (jsdom, and
   several shipped Safaris for `textTracks`). Guarded so the player never throws
   on load; without the listener it learns about a change on the next read. */
function listen(target: unknown, events: readonly string[], handler: () => void): () => void {
  const list = target as EventTarget | undefined;
  if (!list || typeof list.addEventListener !== 'function') return () => undefined;
  for (const event of events) list.addEventListener(event, handler);
  return () => { for (const event of events) list.removeEventListener(event, handler); };
}

/* The cues showing now. Chromium leaves `activeCues` empty until playback or
   a seek updates it, so a cue that starts at 0:00 was not drawn before the
   picture moved (R-M11). When the browser reports none and the track has
   loaded cues, they are read against the current time, which is the answer the
   browser gives once it updates. */
function cuesNow(track: TextTrack, time: number): TextTrackCue[] {
  const active = [...(track.activeCues ?? [])];
  if (active.length || !track.cues?.length) return active;
  return [...track.cues].filter((cue) => cue.startTime <= time && time < cue.endTime);
}

export function useMediaTracks(
  media: RefObject<HTMLMediaElement | null>,
  { native = false }: { native?: boolean } = {},
): MediaTracks {
  const [textTracks, setTextTracks] = useState<MediaTrackOption[]>([]);
  const [activeTextTrack, setActiveTextTrack] = useState<string | null>(null);
  const [activeCues, setActiveCues] = useState<TextTrackCue[]>([]);
  const [audioTracks, setAudioTracks] = useState<MediaTrackOption[]>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState<string | null>(null);
  const [videoTracks, setVideoTracks] = useState<MediaTrackOption[]>([]);
  const [activeVideoTrack, setActiveVideoTrack] = useState<string | null>(null);

  const read = useCallback(() => {
    const element = media.current as WithTrackLists | null;
    if (!element) return;
    const captions = captionTracks(element);
    /* A track the browser turned on itself (the `default` attribute, or the
       reader's system caption preference) is `showing`. When Crystal draws the
       captions it is moved to `hidden`, which keeps the reader's choice and
       moves only who draws it. The guard keeps this from looping on the
       `change` event it fires. */
    if (!native) {
      for (const track of captions) if (track.mode === 'showing') track.mode = 'hidden';
    }
    setTextTracks(captions.map((track, i) => ({
      id: idOf(track, i, 'text'), label: labelOf(track, i, 'Track'), language: track.language, kind: track.kind,
    })));
    const on = captions.findIndex((track) => track.mode === (native ? 'showing' : 'hidden'));
    setActiveTextTrack(on === -1 ? null : idOf(captions[on]!, on, 'text'));
    setActiveCues(on === -1 || native ? [] : cuesNow(captions[on]!, element.currentTime));
    setAudioTracks(listOf(element.audioTracks, 'Audio', 'audio'));
    setActiveAudioTrack(activeOf(element.audioTracks, 'enabled', 'audio'));
    setVideoTracks(listOf(element.videoTracks, 'Video', 'video'));
    setActiveVideoTrack(activeOf(element.videoTracks, 'selected', 'video'));
  }, [media, native]);

  useEffect(() => {
    const element = media.current as WithTrackLists | null;
    if (!element) return undefined;
    read();
    const stops = [
      listen(element.textTracks, ['change', 'addtrack', 'removetrack'], read),
      listen(element.audioTracks, ['change', 'addtrack', 'removetrack'], read),
      listen(element.videoTracks, ['change', 'addtrack', 'removetrack'], read),
    ];
    element.addEventListener('loadedmetadata', read);
    /* `cuechange` fires on the track, not the list, so each caption track is
       listened to. A track added later is picked up by the next `addtrack`. */
    const tracks = captionTracks(element);
    for (const track of tracks) track.addEventListener?.('cuechange', read);
    /* A `<track>` turned on loads its file afterwards, and its cues arrive with
       the element's `load` event, not with a `cuechange` (R-M11). */
    const elements = [...element.querySelectorAll('track')];
    for (const one of elements) one.addEventListener('load', read);
    return () => {
      for (const stop of stops) stop();
      element.removeEventListener('loadedmetadata', read);
      for (const track of tracks) track.removeEventListener?.('cuechange', read);
      for (const one of elements) one.removeEventListener('load', read);
    };
  }, [media, read, textTracks.length]);

  const selectTextTrack = useCallback((id: string | null) => {
    const element = media.current;
    if (!element) return;
    captionTracks(element).forEach((track, i) => {
      const chosen = idOf(track, i, 'text') === id;
      track.mode = chosen ? (native ? 'showing' : 'hidden') : 'disabled';
    });
    read();
  }, [media, native, read]);

  const selectAudioTrack = useCallback((id: string) => {
    const list = (media.current as WithTrackLists | null)?.audioTracks;
    if (!list) return;
    /* One audio track at a time. Enabling two mixes them, which is never what
       a language or commentary choice means. */
    for (let i = 0; i < list.length; i += 1) {
      const track = list[i];
      if (track) track.enabled = idOf(track, i, 'audio') === id;
    }
    read();
  }, [media, read]);

  const selectVideoTrack = useCallback((id: string) => {
    const list = (media.current as WithTrackLists | null)?.videoTracks;
    if (!list) return;
    for (let i = 0; i < list.length; i += 1) {
      const track = list[i];
      if (track) track.selected = idOf(track, i, 'video') === id;
    }
    read();
  }, [media, read]);

  return {
    textTracks, activeTextTrack, selectTextTrack, activeCues,
    audioTracks, activeAudioTrack, selectAudioTrack,
    videoTracks, activeVideoTrack, selectVideoTrack,
  };
}
