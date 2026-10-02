/* useMediaTracks, against track lists shaped like the browser's.
 *
 * jsdom populates no `textTracks` and has no `audioTracks`, so these tests put
 * lists on the element with the shape the browser gives them. They test the
 * hook's own decisions (who draws captions, that one audio track plays at a
 * time, that a missing list offers nothing), not the browser's. Whether a real
 * engine honours them is `verify:behaviour`'s, against a real clip.
 */
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import { useMediaTracks, type MediaTracks } from './useMediaTracks.js';

interface FakeTrack { id: string; kind: string; label: string; language: string; mode?: string; enabled?: boolean; activeCues?: unknown[] }

function list<T extends object>(items: T[]): T[] & EventTarget {
  const target = new EventTarget();
  return Object.assign(items, {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  });
}

function harness(text: FakeTrack[], audio?: FakeTrack[], native = false): { result: { current: MediaTracks } } {
  const result = { current: undefined as unknown as MediaTracks };
  function Probe(): ReactNode {
    const ref = useRef<HTMLVideoElement>(null);
    result.current = useMediaTracks(ref, { native });
    return (
      <video
        ref={(element) => {
          if (element && !('__tracks' in element)) {
            Object.defineProperty(element, '__tracks', { value: true });
            Object.defineProperty(element, 'textTracks', { value: list(text) });
            if (audio) Object.defineProperty(element, 'audioTracks', { value: list(audio) });
          }
          (ref as { current: HTMLVideoElement | null }).current = element;
        }}
      />
    );
  }
  render(<Probe />);
  return { result };
}

describe('useMediaTracks', () => {
  /* Crystal draws the captions, above the transport, so a track the browser
     turned on from the reader's preference is moved to `hidden`: the choice is
     kept and only who draws it changes. */
  it('keeps a track the browser turned on, and draws it itself', () => {
    const english: FakeTrack = { id: '', kind: 'captions', label: 'English', language: 'en', mode: 'showing' };
    const { result } = harness([english, { id: '', kind: 'chapters', label: 'Chapters', language: 'en', mode: 'hidden' }]);
    expect(english.mode).toBe('hidden');
    expect(result.current.textTracks.map((track) => track.label)).toEqual(['English']);
    expect(result.current.activeTextTrack).toBe('text-0');
  });

  it('leaves the browser to draw when asked to', () => {
    const english: FakeTrack = { id: '', kind: 'captions', label: 'English', language: 'en', mode: 'showing' };
    const { result } = harness([english], undefined, true);
    expect(english.mode).toBe('showing');
    expect(result.current.activeTextTrack).toBe('text-0');
  });

  it('turns one caption track on and the others off, or all off', () => {
    const tracks: FakeTrack[] = [
      { id: '', kind: 'captions', label: 'English', language: 'en', mode: 'disabled' },
      { id: '', kind: 'subtitles', label: '', language: 'fr', mode: 'disabled' },
    ];
    const { result } = harness(tracks);
    /* A track with no label is named by its language, in words. */
    expect(result.current.textTracks[1]!.label).toMatch(/French|fr/);
    act(() => { result.current.selectTextTrack('text-1'); });
    expect(tracks.map((track) => track.mode)).toEqual(['disabled', 'hidden']);
    act(() => { result.current.selectTextTrack(null); });
    expect(tracks.map((track) => track.mode)).toEqual(['disabled', 'disabled']);
    expect(result.current.activeTextTrack).toBeNull();
  });

  /* Enabling two audio tracks mixes them, which is never what a language or
     commentary choice means. */
  it('plays one audio track at a time', () => {
    const audio: FakeTrack[] = [
      { id: 'a', kind: 'main', label: 'English', language: 'en', enabled: true },
      { id: 'b', kind: 'translation', label: 'Français', language: 'fr', enabled: false },
    ];
    const { result } = harness([], audio);
    expect(result.current.activeAudioTrack).toBe('a');
    act(() => { result.current.selectAudioTrack('b'); });
    expect(audio.map((track) => track.enabled)).toEqual([false, true]);
    expect(result.current.activeAudioTrack).toBe('b');
  });

  /* Chromium has no audio track list without a flag. The player then offers no
     audio choice, because it could not make one. */
  it('offers no audio tracks where the browser has no list', () => {
    const { result } = harness([]);
    expect(result.current.audioTracks).toEqual([]);
    expect(result.current.videoTracks).toEqual([]);
  });
});
