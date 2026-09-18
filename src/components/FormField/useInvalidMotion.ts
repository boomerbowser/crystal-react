'use client';

/* The validation binding, once.
 *
 * Crystal's rule is that motion binds to **state** rather than to an event, and
 * validation is where that matters most: a field that failed on the server must
 * look exactly like one that failed locally, because to the person filling in the
 * form they are the same thing. A `onBlur` handler cannot express that — it only
 * knows about the one route it was attached to.
 *
 * `previous` starts undefined so a field that mounts already invalid — a
 * re-rendered server error, a form restored from storage — does not animate on
 * arrival. Motion marks the moment a state is entered; playing it for a state
 * that was already true is motion marking nothing.
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
  const [scope, play] = useMotion({ once: true });
  const previous = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== isInvalid) {
      play(isInvalid ? 'field-invalid' : 'field-valid');
    }
    previous.current = isInvalid;
  }, [isInvalid, play]);

  return [scope, play];
}

/**
 * What to hand React Aria for `isInvalid` — and, usually, nothing at all.
 *
 * React Aria treats a **defined** `isInvalid` as "the caller owns validity from
 * here". So `isInvalid={false}` is not a statement that the field is fine; it is
 * a statement that React Aria should stop working out whether it is fine. Under
 * it, the browser's native validation stops reaching the field, and so does
 * every error a `Form` was given to distribute — `<FieldError>` renders nothing
 * and `aria-invalid` is never set, however loudly the server objected.
 *
 * Every field in this library did that, from the first component: `isInvalid`
 * was coerced with `?? Boolean(errorMessage)`, so an untouched field passed
 * `false` and could not be told it was wrong by anybody but its own caller.
 *
 * So: say nothing unless somebody has actually decided. A caller's explicit
 * `isInvalid` wins; an `errorMessage` implies `true`, because two ways of saying
 * the same thing would eventually disagree; otherwise React Aria keeps it.
 */
export function declaredInvalid(
  isInvalid: boolean | undefined,
  errorMessage: unknown,
): { isInvalid?: boolean } {
  if (isInvalid !== undefined) return { isInvalid };
  if (errorMessage === undefined || errorMessage === null || errorMessage === false) return {};
  return { isInvalid: true };
}
