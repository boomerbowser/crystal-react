'use client';

/* Transition.
 *
 * Entry and exit choreography bound to Crystal's timings, easings and travel
 * limits. It is a thin component over `usePreset` and `AnimatePresence`, and the
 * thinness is the point: everything it could decide is already decided in
 * `@crystal-ui/core`, and a transition component that carries its own durations is a
 * second motion system.
 *
 * Why `AnimatePresence` rather than a mount flag: without it, a closing element
 * unmounts immediately and its exit never plays — the animation and the unmount
 * race, and the unmount wins. This is the same reason `Dialog` uses it, and it is
 * the single thing a hand-rolled transition almost always gets wrong.
 *
 * The catalogue's two rules, both about not making a transition a liability:
 *
 *   - **Interruptible.** Motion is asked to reverse mid-flight rather than queue,
 *     so a person toggling something twice quickly does not wait out the first
 *     animation.
 *   - **Never delays a semantic change.** The content is present and correct
 *     before the animation runs; the movement describes the change rather than
 *     performing it. A transition that gates when text becomes readable makes a
 *     page slower for everyone and unusable for somebody who cannot wait.
 *
 * Reduced motion is handled inside `usePreset` — the movement is removed, the
 * state change is kept, and the promise still settles so an exit is not left
 * hanging.
 */
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePreset, type CrystalPresetName } from '../../motion/usePreset.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

/* Crystal's exit duration, not a number chosen here. Motion takes seconds. */
const EXIT_SECONDS = Number.parseFloat(crystalTokens['motion.duration.exit']) / 1000;

export interface TransitionProps {
  /** Whether the content is present. Exit plays before it leaves the tree. */
  isPresent: boolean;
  /**
   * Which material's movement. `frost` comes toward the viewer, `plastic` rises,
   * `resin` flows in, `mirage` washes across. Defaults to `frost`.
   */
  preset?: CrystalPresetName;
  /**
   * Anchored things fade on the way out; unanchored ones drop away. A panel fixed
   * to the page is anchored, a floating control is not.
   */
  anchored?: boolean;
  /**
   * Transition renders a wrapping `div`. It cannot be `display: contents` —
   * an element that generates no box cannot be faded, which would silently
   * remove the exit animation this component exists for.
   */
  children?: ReactNode;
}

export function Transition({
  isPresent, preset = 'frost', anchored = false, children,
}: TransitionProps): React.JSX.Element {
  const [scope, play] = usePreset({ anchored });

  useEffect(() => {
    if (isPresent) void play(preset);
  }, [isPresent, preset, play]);

  return (
    <AnimatePresence>
      {isPresent ? (
        <motion.div
          ref={scope as never}
          /* Opacity only on the way out, and through Motion rather than through
             the preset, because `AnimatePresence` needs to own the exit in order
             to hold the subtree mounted until it settles. */
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_SECONDS }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
