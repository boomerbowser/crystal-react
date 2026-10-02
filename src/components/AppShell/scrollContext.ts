'use client';

/* Which element a view scrolls.
 *
 * `AppBar` shows elevation once something has scrolled past it, so it has to
 * know which element scrolls. Standalone on a page it is the window. Inside an
 * `AppShell` the bar never moves, because the content region scrolls underneath
 * it, and watching the window would leave the bar flat.
 *
 * The shell publishes its scrolling region and the bar uses it when there is
 * one. It is a context and not a prop because the bar is handed to the shell as
 * a node, and the shell cannot reach into it to pass anything.
 */
import { createContext, useContext, type RefObject } from 'react';

export const ShellScrollContext = createContext<RefObject<HTMLElement | null> | null>(null);

/** The scrolling region of the surrounding shell, or null when there is none. */
export function useShellScroll(): RefObject<HTMLElement | null> | null {
  return useContext(ShellScrollContext);
}
