'use client';

/* Crystal's motion, bound to a React lifecycle.
 *
 * Crystal owns the physics: the recipes, their springs, their durations and the
 * engine that plays them all come from `@crystal/core`. CONTRACT §6 is explicit
 * that a library honours the physics rather than copying the keyframes, and §1
 * that it reuses the resolver's arithmetic rather than reimplementing it,
 * "because two implementations of the same formula will diverge".
 *
 * What this file implements is the binding — refs, effects and cleanup — which is
 * genuinely different on a platform with a component lifecycle, and is what §2
 * means by a platform-appropriate technique.
 *
 * Three things it deliberately does NOT do:
 *
 *   - It never drives an animation through React state. A 60fps animation that
 *     re-renders is a 60fps render, and the imperative path costs nothing.
 *   - It never animates a property the compositor cannot handle. The web preview
 *     animates `box-shadow`, `border-radius` and `background-position` on its
 *     optical layers — 46 keyframes between them — and each of those forces a
 *     repaint every frame. Crystal React restricts itself to `transform` and
 *     `opacity`, and expresses a shadow change as an opacity cross-fade between
 *     two pre-rendered layers instead.
 *   - It never starts anything at rest. Ambient motion is deferred upstream
 *     (R22) and must not be reinvented here.
 */
import { useCallback, useEffect, useRef } from 'react';
import { frames } from '@crystal/core/engines';
import motionRecipes from '@crystal/core/motion-recipes' with { type: 'json' };
import { useCrystalTheme } from '../theme/CrystalProvider.js';

const RECIPES: ReadonlyMap<string, CrystalRecipe> = new Map(
  motionRecipes.recipes.map((recipe) => [recipe.id, recipe]),
);

/** Every recipe Crystal ships, for editors and for the generated manifest. */
export type CrystalRecipeName = string;

export function getRecipe(name: CrystalRecipeName): CrystalRecipe | undefined {
  return RECIPES.get(name);
}

export interface UseMotionOptions {
  /**
   * Coalesce a repeat of the SAME recipe while it is still running.
   *
   * A continuous control fires its event many times a second, and restarting a
   * 320ms animation on every one of them stops it partway and begins again —
   * which is what makes a slider feel choppy. A *different* recipe still
   * interrupts, because that is a different thing being expressed.
   */
  readonly once?: boolean;
}

/**
 * Returns a `play(recipeName)` bound to an element ref.
 *
 * Playing is imperative on purpose: it causes no render, and it is safe to call
 * from an event handler, an effect, or a state-change observer.
 */
export function useMotion<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseMotionOptions = {},
): (name: CrystalRecipeName) => void {
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const running = useRef<{ name: string; handle: CrystalAnimation } | null>(null);
  const once = options.once ?? false;

  /* One cancellation path, used by both a replacement and unmount, so an
     animation can never outlive the element it is playing on. */
  const stop = useCallback(() => {
    running.current?.handle.cancel();
    running.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  return useCallback((name: CrystalRecipeName) => {
    const element = ref.current;
    if (!element) return;

    const recipe = RECIPES.get(name);
    if (!recipe) {
      throw new RangeError(
        `Unknown Crystal motion "${name}". Recipes come from @crystal/core; this library defines none of its own.`,
      );
    }

    /* Reduced motion removes the movement, never the state change. The caller has
       already applied whatever this recipe was marking. */
    const duration = resolveDuration(recipe.duration);
    if (reduceMotion || duration === 0) {
      element.dataset['crMotionState'] = 'instant';
      return;
    }

    if (once && running.current?.name === name) return;
    stop();

    element.dataset['crMotionName'] = name;
    element.dataset['crMotionState'] = 'running';

    const handle = frames(element, recipe.keyframes, {
      duration,
      engine: recipe.engine,
      easing: 'cubic-bezier(0.22, 0.65, 0.22, 1)',
    });

    const record = { name, handle };
    running.current = record;

    void handle.finished
      .then(() => { if (running.current === record) element.dataset['crMotionState'] = 'finished'; })
      /* A cancelled animation is the normal path, not an error: it happens
         whenever a component unmounts mid-motion. */
      .catch(() => { /* cancelled */ })
      .finally(() => { if (running.current === record) running.current = null; });
  }, [ref, resolveDuration, reduceMotion, once, stop]);
}
