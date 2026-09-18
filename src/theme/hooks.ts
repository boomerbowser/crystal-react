'use client';

/* The named hooks.
 *
 * Each is a narrow read of the theme rather than a separate store. Components
 * that only care about direction should not re-render when the palette changes,
 * and a narrow hook is what makes that possible later without changing call
 * sites now.
 */
import { useCrystalTheme } from './CrystalProvider.js';
import type {
  CrystalDensity, CrystalDirection, CrystalEffects, CrystalMode, CrystalPalette,
} from './types.js';

/** Palette and light/dark mode together, since almost nothing needs only one. */
export function useColorScheme(): { palette: CrystalPalette; mode: CrystalMode } {
  const { palette, mode } = useCrystalTheme();
  return { palette, mode };
}

export function useDensity(): CrystalDensity {
  return useCrystalTheme().density;
}

/** Logical direction. Components use logical CSS properties; this is for the
 *  cases that genuinely cannot, such as choosing an arrow key handler. */
export function useDirection(): CrystalDirection {
  return useCrystalTheme().direction;
}

/**
 * Whether optical effects are reduced.
 *
 * `effects === 'opaque'` is the product-level preference. The operating system
 * asking through `prefers-reduced-transparency` is honoured separately, in CSS,
 * and is deliberately not merged into this value: one is a choice the product
 * stored, the other is a setting the person made, and a component that needs to
 * know which is which would otherwise have no way to tell.
 */
export function useReducedEffects(): { effects: CrystalEffects; opaque: boolean } {
  const { effects } = useCrystalTheme();
  return { effects, opaque: effects === 'opaque' };
}

/**
 * Motion speed and the resolver.
 *
 * `resolveDuration` is Crystal's own arithmetic: reduced motion resolves to
 * zero, and every result is capped at the 5000ms ceiling.
 */
export function useMotionSpeed(): {
  motionSpeed: number;
  reduceMotion: boolean;
  resolveDuration: (baseMs: number) => number;
} {
  const { motionSpeed, reduceMotion, resolveDuration } = useCrystalTheme();
  return { motionSpeed, reduceMotion, resolveDuration };
}

