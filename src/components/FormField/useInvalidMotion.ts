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
