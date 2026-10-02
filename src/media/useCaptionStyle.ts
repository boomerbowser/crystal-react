'use client';

/* The reader's caption style (R-M12), kept for this browser.
 *
 * It is the reader's, not the product's, so every player on the origin starts
 * from it and two players on one page agree. It is read with
 * `useSyncExternalStore`, as `useMediaQuery` reads a media query: the server
 * cannot know the reader's choice, so it renders the default and the first
 * client render agrees with it; reading storage during render would be a
 * hydration mismatch on every server-rendered player.
 *
 * Storage can be missing or refuse a write (a private window, a blocked site).
 * The choice is then kept in memory for this page.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from '../components/MediaControls/MediaSettings.js';

const KEY = 'crystal-caption-style';
/* Same-page changes; `storage` only reports other pages. */
const CHANGED = 'crystal-caption-style-change';

let memory: string | null = null;
let cachedRaw: string | null | undefined;
let cached: CaptionStyle = DEFAULT_CAPTION_STYLE;

function read(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function parse(raw: string | null): CaptionStyle {
  try {
    const saved = JSON.parse(raw ?? 'null') as Partial<CaptionStyle> | null;
    return {
      size: saved?.size === 'large' || saved?.size === 'larger' ? saved.size : DEFAULT_CAPTION_STYLE.size,
      backing: saved?.backing === 'solid' ? 'solid' : DEFAULT_CAPTION_STYLE.backing,
    };
  } catch {
    return DEFAULT_CAPTION_STYLE;
  }
}

/* The same object for the same stored value, as `useSyncExternalStore` needs. */
function snapshot(): CaptionStyle {
  const raw = read();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function subscribe(notify: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const changed = (event: Event): void => {
    if (event instanceof StorageEvent && event.key !== KEY && event.key !== null) return;
    notify();
  };
  window.addEventListener('storage', changed);
  window.addEventListener(CHANGED, changed);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener(CHANGED, changed);
  };
}

export function useCaptionStyle(): [CaptionStyle, (next: CaptionStyle) => void] {
  const style = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_CAPTION_STYLE);
  const set = useCallback((next: CaptionStyle) => {
    const raw = JSON.stringify(next);
    try {
      globalThis.localStorage.setItem(KEY, raw);
      memory = null;
    } catch {
      memory = raw;
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
  }, []);
  return [style, set];
}
