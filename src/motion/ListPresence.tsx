'use client';

/* A collection's items arriving and leaving: Crystal's `list-in` and `list-out`.
 *
 * The catalogue gives these to every collection — chips in a tags field, rows
 * of files, cards, reviews, the items of a list — and its text is exact about
 * when: `list-in` for "real added" items, `list-out` "after completion", with
 * the change announced and focus kept valid. Two rules follow, and Motion for
 * React's own presence machinery is what keeps them:
 *
 *   - **An item present when the collection first renders did not arrive.** A
 *     page of twelve cards does not play twelve arrivals on load. `ListPresence`
 *     is `AnimatePresence` with `initial={false}`, which marks exactly those
 *     first-render children, and the hook plays `list-in` only on the others.
 *   - **An item leaves after its exit, not before.** When a keyed child is
 *     removed, `AnimatePresence` keeps it rendered until the child says it is
 *     done; the hook plays `list-out` and then says so. Under reduced motion the
 *     recipe resolves at once and the item goes at once.
 *
 * The hook is inert outside a `ListPresence`: a `Card` on its own is not in a
 * collection, and nothing plays. A product that renders its own collection of
 * cards wraps them in `ListPresence`, keyed, and the cards do the rest.
 */
import { forwardRef, useContext, useEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, PresenceContext, usePresence } from 'motion/react';
import { useMotion } from './useMotion.js';
import { mergeRefs } from '../utils/mergeRefs.js';

/** The collection. Its direct children must be keyed, and each should call
 *  `useListItemMotion` on the element that arrives and leaves. */
export function ListPresence({ children }: { children: ReactNode }): React.JSX.Element {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

export interface ListItemMotionOptions {
  /** Play `list-out` before the item goes. Off where the catalogue assigns only
   *  the arrival — a timeline's events are added, not taken away. */
  leaves?: boolean;
}

/** One item of a `ListPresence`: the scope to put on the item's element. */
export function useListItemMotion({ leaves = true }: ListItemMotionOptions = {}): ReturnType<typeof useMotion>[0] {
  return usePresenceMotion('list-in', leaves ? 'list-out' : null);
}

/**
 * The same rule for any element Motion's presence decides: `enter` when it
 * genuinely arrives inside an `AnimatePresence` (not on that presence's first
 * render if it was told `initial={false}`), `exit` before it goes, awaited, with
 * the element inert meanwhile. Outside an `AnimatePresence`, nothing — so a
 * floating window a product simply renders does not sweep itself in, and one it
 * shows and hides inside `AnimatePresence` does.
 */
export function usePresenceMotion(enter: string, exit: string | null): ReturnType<typeof useMotion>[0] {
  const [scope, play] = useMotion();
  const presence = useContext(PresenceContext);
  const [isPresent, safeToRemove] = usePresence();
  /* Decided once, on mount: in a presence, and not one of its first-render
     children. The ref also keeps StrictMode's second effect from playing twice. */
  const arriving = useRef(presence !== null && presence.initial !== false);

  useEffect(() => {
    if (!arriving.current) return;
    arriving.current = false;
    void play(enter);
  }, [play, enter]);

  useEffect(() => {
    if (presence === null || isPresent) return;
    if (exit === null) { safeToRemove?.(); return; }
    /* Removed as far as anybody reading or tabbing is concerned: the element is
       only still here to be seen leaving, so it is inert while it does. */
    (scope.current as HTMLElement | null)?.setAttribute('inert', '');
    void play(exit).finally(() => safeToRemove?.());
  }, [presence, isPresent, play, safeToRemove, scope, exit]);

  return scope;
}

/** An element that is one item of a `ListPresence`: an `li` in a list, or a
 *  `div` where the collection is not one. */
export const PresenceItem = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & {
  as?: 'li' | 'div';
  leaves?: boolean;
}>(function PresenceItem({ as: Element = 'li', leaves = true, ...props }, ref) {
  const scope = useListItemMotion({ leaves });
  const merged = useMemo(() => mergeRefs(ref, scope as never), [ref, scope]);
  return <Element ref={merged as never} {...props} />;
});
