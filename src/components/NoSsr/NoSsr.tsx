'use client';

/* NoSsr.
 *
 * Defers a subtree until the client, for the small number of things that genuinely
 * cannot render on a server — a canvas, a measurement of the viewport, a widget
 * from a third party that touches `window` on import.
 *
 * Two rules from the catalogue, both about what happens in the gap:
 *
 *   - **Fall back to content, not to emptiness**, wherever you can. A skeleton or
 *     a plain-text version of the thing is a page that is readable before
 *     hydration; `null` is a page with a hole in it, and on a slow connection the
 *     hole is what the reader gets.
 *   - **Reserve the final size**, so nothing shifts when it resolves. Wrap the
 *     fallback in `AspectRatio`, or give it the same box.
 *
 * `useIsSSR` rather than a `useEffect` flag: React Aria's version is tied to
 * React's own hydration signal, so the first client render matches the server's
 * and there is no hydration mismatch to warn about.
 */
import type { ReactNode } from 'react';
import { useIsSSR } from 'react-aria';

export interface NoSsrProps {
  /**
   * What to render on the server and during hydration. Prefer real content or a
   * skeleton of the right size over nothing.
   */
  fallback?: ReactNode;
  children?: ReactNode;
}

export function NoSsr({ fallback = null, children }: NoSsrProps): React.JSX.Element {
  const isServer = useIsSSR();
  return <>{isServer ? fallback : children}</>;
}
