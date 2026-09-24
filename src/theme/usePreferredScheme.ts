'use client';

/* The system's own answers, as React state.
 *
 * Three media queries Crystal cares about, read the same way: `prefers-color-scheme`
 * for `mode="system"`, `prefers-reduced-transparency` for the reduced-effects
 * scope, and `forced-colors` for the mode where the operating system is painting
 * rather than the design system.
 *
 * `useSyncExternalStore` rather than `useEffect` plus state, because the value has
 * a server snapshot and a subscription — which is exactly the shape that hook
 * exists for. The naive version renders the wrong answer first and corrects it,
 * which is a flash of the wrong theme on every load.
 */
import { useMediaQuery } from './useMediaQuery.js';


/** `dark` when the operating system asks for it, `light` otherwise. */
export function usePreferredMode(): 'light' | 'dark' {
  return useMediaQuery('(prefers-color-scheme: dark)', false) ? 'dark' : 'light';
}

/** True when the operating system asks for less transparency. */
export function usePrefersReducedTransparency(): boolean {
  return useMediaQuery('(prefers-reduced-transparency: reduce)', false);
}

/** True when the operating system is painting the colours rather than Crystal. */
export function useForcedColors(): boolean {
  return useMediaQuery('(forced-colors: active)', false);
}
