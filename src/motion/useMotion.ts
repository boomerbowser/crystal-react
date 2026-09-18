'use client';

/* Crystal's motion, on Motion for React.
 *
 * Crystal owns the physics; this file owns the binding. CONTRACT §6 is explicit
 * that a library honours the *physics* rather than copying keyframes, and that is
 * what makes Motion for React the right engine rather than merely a React-shaped
 * one: every Crystal recipe carries a real spring — `{ stiffness, damping, mass }`
 * fitted so its settling time equals the authored duration — and Motion's spring
 * transition takes exactly those three numbers. The recipe's own physics drive
 * the animation, instead of a duration and a bezier approximating them.
 *
 * `useAnimate` gives a scope whose animations are cancelled when the component
 * unmounts, which is the lifecycle guarantee a plain WAAPI call cannot make and
 * the reason an animation here can never outlive the element it plays on.
 *
 * Three things this deliberately does NOT do:
 *
 *   - It never drives an animation through React state. A 60fps animation that
 *     re-renders is a 60fps render; the imperative path costs nothing.
 *   - It never animates a property the compositor cannot handle. The web preview
 *     animates `box-shadow`, `border-radius` and `background-position` across 46
 *     keyframes, each forcing a repaint every frame. Crystal React restricts
 *     itself to `transform` and `opacity`, and expresses a shadow change as an
 *     opacity cross-fade between pre-rendered layers.
 *   - It never starts anything at rest. Ambient motion is deferred upstream (R22)
 *     and must not be reinvented here.
 */
import { useCallback, useRef } from 'react';
import { useAnimate } from 'motion/react';
import type { AnimationSequence, DOMKeyframesDefinition } from 'motion/react';
import motionRecipes from '@crystal/core/motion-recipes' with { type: 'json' };
import { useCrystalTheme } from '../theme/CrystalProvider.js';

const RECIPES: ReadonlyMap<string, CrystalRecipe> = new Map(
  motionRecipes.recipes.map((recipe) => [recipe.id, recipe]),
);

export type CrystalRecipeName = string;

export function getRecipe(name: CrystalRecipeName): CrystalRecipe | undefined {
  return RECIPES.get(name);
}

/** Every recipe id Crystal ships. Exported for the generated documentation. */
export const recipeNames: readonly string[] = [...RECIPES.keys()];

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
 * Turn a recipe's keyframes into Motion's per-property arrays.
 *
 * Motion animates each property across its own array of values, where Crystal
 * authors a list of frames each holding several properties. The frames carry
 * explicit offsets, which become Motion's `times`.
 */
function toMotionKeyframes(recipe: CrystalRecipe): {
  values: DOMKeyframesDefinition;
  times: number[] | undefined;
  frameCount: number;
} {
  const properties = new Set<string>();
  for (const frame of recipe.keyframes) {
    for (const key of Object.keys(frame)) if (key !== 'offset') properties.add(key);
  }

  const values: Record<string, unknown[]> = {};
  for (const property of properties) {
    values[property] = recipe.keyframes.map((frame) => {
      const value = (frame as Record<string, unknown>)[property];
      /* A frame that omits a property holds the previous value rather than
         jumping to a default — which is what the frame list means. */
      return value ?? null;
    });
  }

  const offsets = recipe.keyframes.map((frame) => frame.offset);
  const times = offsets.every((offset): offset is number => typeof offset === 'number')
    ? offsets
    : undefined;

  return { values: values as DOMKeyframesDefinition, times, frameCount: recipe.keyframes.length };
}

/**
 * Returns `[scope, play]`.
 *
 * Attach `scope` to the element the recipe plays on. `play(name)` is imperative
 * on purpose: it triggers no render, and is safe from an event handler, an effect
 * or a state-change observer.
 */
export function useMotion(
  options: UseMotionOptions = {},
): [ReturnType<typeof useAnimate>[0], (name: CrystalRecipeName) => void] {
  const [scope, animate] = useAnimate();
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const running = useRef<string | null>(null);
  const once = options.once ?? false;

  const play = useCallback((name: CrystalRecipeName) => {
    const element = scope.current as HTMLElement | null;
    if (!element) return;

    const recipe = RECIPES.get(name);
    if (!recipe) {
      throw new RangeError(
        `Unknown Crystal motion "${name}". Recipes come from @crystal/core; this library defines none of its own.`,
      );
    }

    /* Reduced motion removes the movement, never the state change. Whatever this
       recipe was marking has already been applied by the caller. */
    const duration = resolveDuration(recipe.duration);
    if (reduceMotion || duration === 0) {
      element.dataset['crMotionState'] = 'instant';
      return;
    }

    if (once && running.current === name) return;
    running.current = name;
    element.dataset['crMotionName'] = name;
    element.dataset['crMotionState'] = 'running';

    const { values, times, frameCount } = toMotionKeyframes(recipe);
    const web = recipe.spring?.platform?.web;

    /* A spring is a continuous solution from one value to another, so it can only
       describe a two-keyframe animation — Motion refuses more, and it is right
       to: "settle from A to B" has no meaning across four waypoints.
     *
     * Crystal authors most recipes as three or four frames (press overshoots,
     * recovers, and returns), and fits each recipe's spring so that its settling
     * time EQUALS the authored duration. So the two forms agree by construction,
     * and the split below loses nothing: where Motion can take the spring it gets
     * the real physics, and where it cannot, the duration it falls back to is the
     * one that spring was fitted to produce. */
    const transition = web && frameCount === 2
      ? { type: 'spring' as const, stiffness: web.stiffness, damping: web.damping, mass: web.mass }
      : { duration: duration / 1000, ease: [0.22, 0.65, 0.22, 1] as const, ...(times ? { times } : {}) };

    void animate(element, values, transition)
      .then(() => {
        if (running.current === name) element.dataset['crMotionState'] = 'finished';
      })
      /* A cancelled animation is the normal path, not an error: it happens
         whenever a component unmounts mid-motion. */
      .catch(() => { /* cancelled */ })
      .finally(() => { if (running.current === name) running.current = null; });
  }, [scope, animate, resolveDuration, reduceMotion, once]);

  return [scope, play];
}

export type { AnimationSequence };
