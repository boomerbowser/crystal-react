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
import motionRecipes from '@crystal-ui/core/motion-recipes' with { type: 'json' };
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
  /**
   * Reorient a directional recipe. The physics are untouched; what changes is
   * which way the movement points.
   *
   * Crystal authors its directional recipes once, for one direction, with
   * physical transforms: `drawer-in` reads `translateX(105%) rotateY(-12deg)`,
   * which is a panel arriving from the **right**. That is correct for a drawer on
   * the inline-end edge of a left-to-right page and wrong for every other case —
   * and CSS cannot mirror a transform for you the way it mirrors
   * `padding-inline-start`. Right-to-left is a verified axis in Crystal, so a
   * recipe that cannot follow it is a gap rather than a preference.
   *
   * Reorienting rather than authoring three more recipes is deliberate: a
   * recipe carries a fitted spring, and a second copy of the same movement is a
   * second thing to keep in step with it. See `reorientRecipe`.
   */
  readonly reorient?: Reorientation;
}

/** Where a mark sits in a staggered arrival: its position and how many arrive. */
export interface StaggerPosition {
  readonly index: number;
  readonly count: number;
}

export interface Reorientation {
  /** Negate the inline component: a movement from the right becomes one from the left. */
  readonly mirrorInline?: boolean;
  /** Turn the movement onto the block axis: from the side becomes from the top or bottom. */
  readonly toBlockAxis?: boolean;
}

/**
 * Rewrite a recipe's transforms so the same movement points somewhere else.
 *
 * Only two things are touched, and both are geometry rather than physics:
 *
 *   - `mirrorInline` negates `translateX` and `rotateY`. A panel arriving from
 *     the right arrives from the left instead, tilted the other way, over the
 *     same distance in the same time.
 *   - `toBlockAxis` swaps the axes: `translateX` becomes `translateY` and
 *     `rotateY` becomes `rotateX` with its sign flipped, because a positive
 *     rotation about Y and a positive rotation about X tip a panel *toward*
 *     opposite corners. The result is the authored movement about the other edge.
 *
 * Durations, offsets, easing and the fitted spring are all carried through
 * untouched. Nothing here invents a movement; it points an authored one.
 */
export function reorientRecipe(recipe: CrystalRecipe, how: Reorientation): CrystalRecipe {
  const { mirrorInline = false, toBlockAxis = false } = how;
  if (!mirrorInline && !toBlockAxis) return recipe;

  /* Captures the function name and its single argument. Crystal's recipes write
     one argument per transform function, which is what makes this tractable: a
     general transform parser would be a CSS parser. A function this does not
     know is left exactly as it is. */
  const negate = (value: string): string => (value.startsWith('-') ? value.slice(1) : `-${value}`);

  const rewrite = (transform: string): string => transform.replace(
    /(translateX|translateY|rotateX|rotateY)\(([^)]*)\)/g,
    (whole, fn: string, argument: string) => {
      const value = argument.trim();
      if (toBlockAxis) {
        if (fn === 'translateX') return `translateY(${mirrorInline ? negate(value) : value})`;
        /* The sign flip is the axis change, not the mirroring: the two rotations
           are opposite-handed. Mirroring on top of it cancels back out. */
        if (fn === 'rotateY') return `rotateX(${mirrorInline ? value : negate(value)})`;
        return whole;
      }
      if (fn === 'translateX' || fn === 'rotateY') return `${fn}(${negate(value)})`;
      return whole;
    },
  );

  /* A background position is geometry too: the skeleton's sweep moves its
     highlight from `200% 0` to `-200% 0`, left to right. Mirroring negates the
     horizontal component so the highlight travels in reading direction; the block
     axis has no horizontal sweep to turn. */
  const mirrorPosition = (position: string): string => {
    if (!mirrorInline || toBlockAxis) return position;
    const [x, ...rest] = position.trim().split(/\s+/);
    return [x === undefined ? '0' : negate(x), ...rest].join(' ');
  };

  return {
    ...recipe,
    keyframes: recipe.keyframes.map((frame) => {
      let next = frame;
      if (typeof frame.transform === 'string') next = { ...next, transform: rewrite(frame.transform) };
      if (typeof frame.backgroundPosition === 'string') {
        next = { ...next, backgroundPosition: mirrorPosition(frame.backgroundPosition) };
      }
      return next;
    }),
  };
}

/**
 * Turn a recipe's keyframes into Motion's per-property arrays.
 *
 * Motion animates each property across its own array of values, where Crystal
 * authors a list of frames each holding several properties. The frames carry
 * explicit offsets, which become Motion's `times`.
 */
export function toMotionKeyframes(recipe: CrystalRecipe): {
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
 * The Motion transition for one play of a recipe — shared by every hook that plays
 * Crystal's recipes, so a spring, a loop and a stagger are decided in one place.
 *
 * A spring is a continuous solution from one value to another, so it can only
 * describe a two-keyframe animation — Motion refuses more, and it is right to:
 * "settle from A to B" has no meaning across four waypoints. Crystal authors most
 * recipes as three or four frames and fits each spring so its settling time EQUALS
 * the authored duration, so the two forms agree by construction: where Motion can
 * take the spring it gets the real physics, and where it cannot, the duration it
 * falls back to is the one that spring was fitted to produce.
 *
 * A continuous recipe travels at constant speed and repeats until stopped. It
 * carries no spring — a loop has no rest position to settle to — so it never takes
 * the spring branch.
 */
export function transitionFor(
  recipe: CrystalRecipe,
  durationMs: number,
  delayMs: number,
  frameCount: number,
  times: number[] | undefined,
): Record<string, unknown> {
  const web = recipe.spring?.platform?.web;
  const delay = delayMs > 0 ? { delay: delayMs / 1000 } : {};
  if (recipe.loop) {
    return { duration: durationMs / 1000, ease: 'linear', repeat: Infinity, ...(times ? { times } : {}) };
  }
  if (web && frameCount === 2) {
    return { type: 'spring', stiffness: web.stiffness, damping: web.damping, mass: web.mass, ...delay };
  }
  return { duration: durationMs / 1000, ease: [0.22, 0.65, 0.22, 1], ...(times ? { times } : {}), ...delay };
}

/**
 * Returns `[scope, play]`.
 *
 * Attach `scope` to the element the recipe plays on. `play(name)` is imperative
 * on purpose: it triggers no render, and is safe from an event handler, an effect
 * or a state-change observer.
 *
 * It returns a promise that settles when the movement finishes, which is what
 * makes an *exit* recipe possible at all: `accordion-out` and `list-out` mark a
 * region closing, and a region that unmounted the moment the state changed would
 * play them into a detached node. `usePreset` already worked this way for the
 * material presets; recipes had no equivalent, so the catalogue's exit recipes
 * could not be honoured. Nothing has to await it — every existing caller marks an
 * arrival and ignores the result — and the promise settles on every path,
 * including reduced motion and a missing element, so an awaiting caller is never
 * left hanging.
 */
export function useMotion(
  options: UseMotionOptions = {},
): [
  ReturnType<typeof useAnimate>[0],
  (name: CrystalRecipeName, position?: StaggerPosition) => Promise<void>,
  () => void,
] {
  const [scope, animate] = useAnimate();
  /* The one thing a continuous recipe needs that a transition does not: a way to
     end it. It repeats until stopped, and the moment to stop is the caller's —
     the work it reports has resolved. */
  const current = useRef<{ stop: () => void } | null>(null);
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const running = useRef<string | null>(null);
  const once = options.once ?? false;
  const mirrorInline = options.reorient?.mirrorInline ?? false;
  const toBlockAxis = options.reorient?.toBlockAxis ?? false;

  const play = useCallback(async (name: CrystalRecipeName, position?: StaggerPosition): Promise<void> => {
    const element = scope.current as HTMLElement | null;
    if (!element) return;

    const authored = RECIPES.get(name);
    const recipe = authored && reorientRecipe(authored, { mirrorInline, toBlockAxis });
    if (!recipe) {
      throw new RangeError(
        `Unknown Crystal motion "${name}". Recipes come from @crystal-ui/core; this library defines none of its own.`,
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

    /* A staggered mark waits its turn, scaled by the same speed as the movement.
       Past the recipe's ceiling every mark arrives together, and a mark that does
       not know how many there are does not stagger — it cannot know it is last. */
    const delay = recipe.stagger && position && position.count <= recipe.stagger.maxMarks
      ? resolveDuration(position.index * recipe.stagger.step)
      : 0;

    const controls = animate(element, values, transitionFor(recipe, duration, delay, frameCount, times));
    current.current = controls;
    await controls
      .then(() => {
        if (running.current === name) element.dataset['crMotionState'] = 'finished';
      })
      /* A cancelled animation is the normal path, not an error: it happens
         whenever a component unmounts mid-motion. */
      .catch(() => { /* cancelled */ })
      .finally(() => { if (running.current === name) running.current = null; });
  }, [scope, animate, resolveDuration, reduceMotion, once, mirrorInline, toBlockAxis]);

  const stop = useCallback((): void => {
    current.current?.stop();
    current.current = null;
    running.current = null;
  }, []);

  return [scope, play, stop];
}

export type { AnimationSequence };
