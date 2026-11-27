'use client';

/* Prismata's motion presets, on Motion for React.
 *
 * A preset is the movement a material makes entering or leaving: Plastic
 * rising, Frost coming toward the viewer, Resin flowing in, Mirage washing across
 * the scene, and the shared dismissal. Unlike a recipe it has no stored
 * keyframes. Its geometry is computed from travel and depth tokens, so changing
 * a travel token moves every preset at once.
 *
 * The computation is `@prismata/core/core/presets` and is not repeated here.
 * CONTRACT §1 says two implementations of the same formula diverge. Here the
 * numbers are read from live custom properties, so a second implementation
 * would drift silently instead of failing. This file measures the environment,
 * hands the numbers over, and plays what comes back.
 */
import { useCallback } from 'react';
import { useAnimate } from 'motion/react';
import type { DOMKeyframesDefinition } from 'motion/react';
import presets from '@prismata/core/core/presets';
import type { PrismataPresetName, PrismataFlowDirection } from '@prismata/core/core/presets';
import { usePrismataTheme } from '../theme/PrismataProvider.js';
import { releaseRestingStyles } from './useMotion.js';

/** Read a `--pr-*` length from the resolved theme, falling back to Prismata's own default. */
function readLength(styles: CSSStyleDeclaration, token: string, fallback: number): number {
  const value = Number.parseFloat(styles.getPropertyValue(`--pr-${token}`));
  return Number.isFinite(value) ? value : fallback;
}

export interface UsePresetOptions {
  /**
   * A dismissal that fades instead of falling. True for anything anchored to the
   * page (a dialog, a Haze card, a Stone backing), and false for something
   * floating above it, which drops away.
   */
  readonly anchored?: boolean;
  /** Which edge a Mirage wash flows from. */
  readonly from?: PrismataFlowDirection;
}

export type { PrismataPresetName };

/**
 * Returns `[scope, play]`, where `play(preset)` resolves to a promise that
 * settles when the movement finishes.
 *
 * Awaiting it makes an exit animation possible: a dialog can play its dismissal
 * and then unmount, instead of vanishing while the animation runs.
 */
export function usePreset(
  options: UsePresetOptions = {},
): [ReturnType<typeof useAnimate>[0], (preset: PrismataPresetName) => Promise<void>] {
  const [scope, animate] = useAnimate();
  const { resolveDuration, reduceMotion } = usePrismataTheme();
  const { anchored = false, from } = options;

  const play = useCallback(async (preset: PrismataPresetName): Promise<void> => {
    const element = scope.current as HTMLElement | null;
    if (!element) return;

    /* Reduced motion removes the movement, never the state change. The promise
       still settles, so an exit that waits on it is not left waiting. */
    if (reduceMotion) {
      element.dataset['prMotionState'] = 'instant';
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const limit = readLength(styles, 'motion-max-travel', 50);
    const clamp = (value: number) => Math.min(limit, Math.max(0, value));

    const built = presets.presetKeyframes(preset, {
      travel: clamp(readLength(styles, `travel-${presets.travelRole(preset)}`, 24)),
      depth: clamp(readLength(styles, 'travel-depth', 50)),
      anchored,
      ...(from ? { from } : {}),
      /* A registered custom property gives the wash a softer edge than a clip
         path can. Without one, the core module returns the clip path when this
         is false. */
      softFlow: typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function',
    });

    if (!built.keyframes.length) {
      /* haze and stone have no component movement: their signature is paint. */
      element.dataset['prMotionState'] = 'instant';
      return;
    }

    element.dataset['prMotionName'] = preset;
    element.dataset['prMotionState'] = 'running';

    /* Prismata resolves the duration: reduced motion to zero, and everything
       capped at the five-second ceiling so slowing playback cannot strand
       somebody inside a transition. */
    const base = Number.parseFloat(styles.getPropertyValue(`--pr-${built.duration}`)) || 1000;
    const duration = resolveDuration(base);
    const easing = styles.getPropertyValue(`--pr-ease-${built.easing}`).trim();

    const properties = new Set<string>();
    for (const frame of built.keyframes) {
      for (const key of Object.keys(frame)) if (key !== 'offset') properties.add(key);
    }
    const values: Record<string, unknown[]> = {};
    for (const property of properties) {
      values[property] = built.keyframes.map((frame) => (frame as Record<string, unknown>)[property] ?? null);
    }

    try {
      await animate(element, values as DOMKeyframesDefinition, {
        duration: duration / 1000,
        ...(easing ? { ease: easing as never } : {}),
      });
      releaseRestingStyles(element, values);
      element.dataset['prMotionState'] = 'finished';
    } catch {
      /* Cancelled. This happens whenever a component unmounts mid-motion. */
    }
  }, [scope, animate, resolveDuration, reduceMotion, anchored, from]);

  return [scope, play];
}
