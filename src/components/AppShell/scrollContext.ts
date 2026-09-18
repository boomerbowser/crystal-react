'use client';

/* Which element a view scrolls.
 *
 * `AppBar` shows elevation once something has scrolled past it, and it has to
 * know which element that is. Standalone on a page it is the window. Inside an
 * `AppShell` the bar never moves at all — the content region scrolls underneath
 * it — so watching the window would leave it flat forever. That was the first
 * version, and the story is what showed it.
 *
 * So the shell publishes its scrolling region and the bar takes it when there is
 * one. A context rather than a prop because the bar is handed to the shell as a
 * node: the shell cannot reach into it to pass anything.
 */
import { createContext, useContext, type RefObject } from 'react';

export const ShellScrollContext = createContext<RefObject<HTMLElement | null> | null>(null);

/** The scrolling region of the surrounding shell, or null when there is none. */
export function useShellScroll(): RefObject<HTMLElement | null> | null {
  return useContext(ShellScrollContext);
}
