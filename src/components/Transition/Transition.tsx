'use client';

/* Transition.
 *
 * Entry and exit choreography bound to Crystal's timings, easings and travel
 * limits. It is a thin component over `usePreset` and `AnimatePresence`.
 * Everything it could decide is already decided in `@crystal-ui/core`, and a
 * transition component that carried its own durations would be a second motion
 * system.
 *
 * It uses `AnimatePresence` instead of a mount flag. Without it, a closing
 * element unmounts immediately and its exit never plays, because the unmount
 * wins the race with the animation. `Dialog` uses it for the same reason.
 *
 * The catalogue sets two rules:
 *
 *   - Interruptible. Motion is asked to reverse mid-flight instead of queueing,
 *     so a person toggling something twice quickly does not wait out the first
 *     animation.
 *   - Never delays a semantic change. The content is present and correct before
 *     the animation runs, and the movement describes the change without
 *     performing it. A transition that gates when text becomes readable makes a
 *     page slower for everyone and unusable for somebody who cannot wait.
 *
 * Reduced motion is handled inside `usePreset`. The movement is removed, the
 * state change is kept, and the promise still settles so an exit is not left
 * hanging.
 */
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePreset, type CrystalPresetName } from '../../motion/usePreset.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

/* Crystal's exit duration, read from the tokens. Motion takes seconds. */
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
   * Anchored things fade on the way out and unanchored ones drop away. A panel
   * fixed to the page is anchored, and a floating control is not.
   */
  anchored?: boolean;
  /**
   * Transition renders a wrapping `div`. It cannot be `display: contents`,
   * because an element that generates no box cannot be faded, and the exit
   * animation would silently disappear.
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
          /* Opacity only on the way out, and through Motion instead of the
             preset, because `AnimatePresence` must own the exit to hold the
             subtree mounted until it settles. */
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_SECONDS }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
