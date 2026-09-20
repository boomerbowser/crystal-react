'use client';

/* Crystal's motion presets, on Motion for React.
 *
 * A preset is the movement a *material* makes entering or leaving — Plastic
 * rising, Frost coming toward the viewer, Resin flowing in, Mirage washing across
 * the scene, and the shared dismissal. Unlike a recipe it carries no stored
 * keyframes: its geometry is computed from travel and depth tokens, so changing a
 * travel token moves every preset at once.
 *
 * The computation is `@crystal-ui/core/core/presets` and is not repeated here.
 * CONTRACT §1 is explicit that two implementations of the same formula diverge,
 * and this one is more exposed to that than most: the numbers are read from live
 * custom properties, so a second implementation would drift silently rather than
 * fail. What this file does is measure the environment, hand the numbers over,
 * and play what comes back.
 */
import { useCallback } from 'react';
import { useAnimate } from 'motion/react';
import type { DOMKeyframesDefinition } from 'motion/react';
import presets from '@crystal-ui/core/core/presets';
import type { CrystalPresetName, CrystalFlowDirection } from '@crystal-ui/core/core/presets';
import { useCrystalTheme } from '../theme/CrystalProvider.js';

/** Read a `--cr-*` length from the resolved theme, falling back to Crystal's own default. */
function readLength(styles: CSSStyleDeclaration, token: string, fallback: number): number {
  const value = Number.parseFloat(styles.getPropertyValue(`--cr-${token}`));
  return Number.isFinite(value) ? value : fallback;
}

export interface UsePresetOptions {
  /**
   * A dismissal that fades rather than falls. True for anything anchored to the
   * page — a dialog, a Haze card, a Stone backing — and false for something
   * floating above it, which drops away.
   */
  readonly anchored?: boolean;
  /** Which edge a Mirage wash flows from. */
  readonly from?: CrystalFlowDirection;
}

export type { CrystalPresetName };

/**
 * Returns `[scope, play]`, where `play(preset)` resolves to a promise that
 * settles when the movement finishes.
 *
 * Awaiting it is what makes an exit animation possible: a dialog can play its
 * dismissal and *then* unmount, rather than vanishing while the animation runs.
 */
export function usePreset(
  options: UsePresetOptions = {},
): [ReturnType<typeof useAnimate>[0], (preset: CrystalPresetName) => Promise<void>] {
  const [scope, animate] = useAnimate();
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const { anchored = false, from } = options;

  const play = useCallback(async (preset: CrystalPresetName): Promise<void> => {
    const element = scope.current as HTMLElement | null;
    if (!element) return;

    /* Reduced motion removes the movement, never the state change — and the
       promise still settles, so an exit that waits on it is not left hanging. */
    if (reduceMotion) {
      element.dataset['crMotionState'] = 'instant';
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
         path can. Absent that, the clip path is the fallback, which is what the
         core module returns when this is false. */
      softFlow: typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function',
    });

    if (!built.keyframes.length) {
      /* haze and stone have no component movement: their signature is paint. */
      element.dataset['crMotionState'] = 'instant';
      return;
    }

    element.dataset['crMotionName'] = preset;
    element.dataset['crMotionState'] = 'running';

    /* Crystal resolves the duration: reduced motion to zero, and everything
       capped at the five-second ceiling so slowing playback cannot strand
       somebody inside a transition. */
    const base = Number.parseFloat(styles.getPropertyValue(`--cr-${built.duration}`)) || 1000;
    const duration = resolveDuration(base);
    const easing = styles.getPropertyValue(`--cr-ease-${built.easing}`).trim();

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
      element.dataset['crMotionState'] = 'finished';
    } catch {
      /* Cancelled — the normal path when a component unmounts mid-motion. */
    }
  }, [scope, animate, resolveDuration, reduceMotion, anchored, from]);

  return [scope, play];
}
