'use client';

/* The validation binding, once.
 *
 * Crystal's rule is that motion binds to state and not to an event. For
 * validation this means a field that failed on the server must look exactly
 * like one that failed locally, because to the person filling in the form they
 * are the same thing. An `onBlur` handler cannot do that, because it only knows
 * about the one route it is attached to.
 *
 * `previous` starts undefined so a field that mounts already invalid (a
 * re-rendered server error, a form restored from storage) does not animate on
 * arrival. Motion marks the moment a state is entered, and does not play for a
 * state that was already true.
 */
import { useEffect, useRef } from 'react';
import { useMotion } from '../../motion/useMotion.js';

/** Returns the scope to attach to the control's shell. */
export function useInvalidMotion(isInvalid: boolean): ReturnType<typeof useMotion>[0] {
  const [scope, play] = useMotion({ once: true });
  const previous = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== isInvalid) {
      play(isInvalid ? 'field-invalid' : 'field-valid');
    }
    previous.current = isInvalid;
  }, [isInvalid, play]);

  return scope;
}

/** The same binding, with the play function, for a shell that also marks focus. */
export function useFieldMotion(isInvalid: boolean): ReturnType<typeof useMotion> {
  const [scope, play, stop] = useMotion({ once: true });
  const previous = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== isInvalid) {
      play(isInvalid ? 'field-invalid' : 'field-valid');
    }
    previous.current = isInvalid;
  }, [isInvalid, play]);

  return [scope, play, stop];
}

/**
 * What to hand React Aria for `isInvalid`, which is usually nothing at all.
 *
 * React Aria treats a defined `isInvalid` as "the caller owns validity from
 * here". So `isInvalid={false}` tells React Aria to stop working out whether
 * the field is valid. The browser's native validation then stops reaching the
 * field, and so does every error a `Form` was given to distribute.
 * `<FieldError>` renders nothing and `aria-invalid` is never set, whatever the
 * server returned.
 *
 * Do not coerce `isInvalid` with `?? Boolean(errorMessage)`. An untouched field
 * would pass `false`, and nobody but its own caller could mark it wrong.
 *
 * Pass a value only when somebody has decided. A caller's explicit `isInvalid`
 * wins. An `errorMessage` implies `true`, so the message and the flag cannot
 * disagree. Otherwise React Aria keeps it.
 */
export function declaredInvalid(
  isInvalid: boolean | undefined,
  errorMessage: unknown,
): { isInvalid?: boolean } {
  if (isInvalid !== undefined) return { isInvalid };
  if (errorMessage === undefined || errorMessage === null || errorMessage === false) return {};
  return { isInvalid: true };
}
