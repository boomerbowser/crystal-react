'use client';

/* Plays a recipe when a value changes, and never on the render that first shows it.
 *
 * Most of the motion Crystal's catalogue assigns marks a state being entered:
 * `selection` when an item becomes the selected one, `highlight` when a number
 * is replaced, `slider-step` when a value is committed, `attention` when a
 * status changes. They all follow the same rules, so they share one hook:
 *
 *   - It is bound to the value, not to an event. A tab chosen by an arrow key, a
 *     value set by a form reset or a status pushed by a server has entered the
 *     state as one chosen by hand has, and moves the same way. A press that
 *     changes nothing, such as on the tab already selected, plays nothing.
 *   - It never plays on the first render. A tab that mounts selected did not
 *     become selected, and playing then would be motion nobody started.
 *   - It plays on the element that changed. The hook returns the scope of its
 *     own `useMotion`, so the recipe plays on whatever the caller attaches it
 *     to (the one chip, the one tab, the one figure) and not on the group.
 *
 * `pick` receives the previous and the next value and names the recipe to play,
 * or returns `null` for a change that is not the state the recipe marks.
 * `selection` plays when an item becomes selected, not when it stops being
 * selected.
 *
 * `ChoiceMotion` in `Checkbox` is an older, component-specific copy of the
 * same rule.
 */
import { useEffect, useRef } from 'react';
import { useMotion, type UseMotionOptions } from './useMotion.js';

export function useChangeMotion<T>(
  value: T,
  pick: (previous: T, next: T) => string | null,
  options: UseMotionOptions = {},
): ReturnType<typeof useMotion>[0] {
  const [scope, play] = useMotion(options);
  usePlayOnChange(value, pick, play);
  return scope;
}

/** The same rule, on a \`play\` the caller already has. For an element that
 *  plays more than one recipe, such as a chip that marks its press and its
 *  selection on one scope. */
export function usePlayOnChange<T>(
  value: T,
  pick: (previous: T, next: T) => string | null,
  play: (name: string) => Promise<void>,
): void {
  const previous = useRef<{ value: T } | null>(null);
  /* The latest \`pick\`, read inside the effect, so an inline arrow does not make
     the effect run on every render and compare a value with itself. */
  const choose = useRef(pick);
  choose.current = pick;

  useEffect(() => {
    const before = previous.current;
    previous.current = { value };
    if (before === null || Object.is(before.value, value)) return;
    const recipe = choose.current(before.value, value);
    if (recipe) void play(recipe);
  }, [value, play]);
}

/** A `pick` that names `recipe` when a flag turns on, and nothing otherwise:
 *  `selection` when an item becomes the selected one, not when it stops being.
 *  The recipe is named where it is bound, so the manifest can read it there. */
export const entered = (recipe: string) => (was: boolean, is: boolean): string | null =>
  (is && !was ? recipe : null);
