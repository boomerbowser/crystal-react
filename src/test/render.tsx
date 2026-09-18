/* Render a component inside Crystal, the way an application would.
 *
 * Every test needs a provider, because `useCrystalTheme` throws without one —
 * deliberately, since a component silently rendering un-themed is the failure
 * that produces "it looks nothing like the design system" reports. Repeating the
 * wrapper in each file invites them to drift apart, and it is also where the
 * theme axes belong: a test that needs dark mode or right-to-left should say so
 * in one argument rather than rebuild the tree.
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { CrystalProvider } from '../theme/CrystalProvider.js';
import type { CrystalThemeInput } from '../theme/types.js';

export interface CrystalRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme axes for this render: palette, mode, density, direction, effects. */
  theme?: CrystalThemeInput;
}

export function renderWithCrystal(
  ui: ReactElement,
  { theme, ...options }: CrystalRenderOptions = {},
): RenderResult & { rerenderWithCrystal: (next: ReactElement) => void } {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CrystalProvider {...theme}>{children}</CrystalProvider>
  );

  const result = render(ui, { wrapper, ...options });

  return {
    ...result,
    /* `rerender` from Testing Library replaces the tree *inside* the wrapper, but
       only if the caller remembers to wrap again. This keeps the provider so a
       rerender cannot silently drop the theme — which is a test passing for the
       wrong reason. */
    rerenderWithCrystal: (next: ReactElement) => result.rerender(next),
  };
}

export { screen, within, waitFor, act, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
