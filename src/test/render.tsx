/* Render a component inside Prismata, the way an application would.
 *
 * Every test needs a provider, because `usePrismataTheme` throws without one.
 * It throws by decision: a component silently rendering un-themed is the failure
 * that produces "it looks nothing like the design system" reports. Repeating the
 * wrapper in each file invites the copies to drift apart. The wrapper is also
 * where the theme axes belong: a test that needs dark mode or right-to-left says
 * so in one argument and does not rebuild the tree.
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { PrismataProvider } from '../theme/PrismataProvider.js';
import type { PrismataThemeInput } from '../theme/types.js';

export interface PrismataRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme axes for this render: palette, mode, density, direction, effects. */
  theme?: PrismataThemeInput;
}

export function renderWithPrismata(
  ui: ReactElement,
  { theme, ...options }: PrismataRenderOptions = {},
): RenderResult & { rerenderWithPrismata: (next: ReactElement) => void } {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PrismataProvider {...theme}>{children}</PrismataProvider>
  );

  const result = render(ui, { wrapper, ...options });

  return {
    ...result,
    /* `rerender` from Testing Library replaces the tree inside the wrapper, but
       only if the caller remembers to wrap again. This keeps the provider so a
       rerender cannot silently drop the theme and let a test pass for the wrong
       reason. */
    rerenderWithPrismata: (next: ReactElement) => result.rerender(next),
  };
}

export { screen, within, waitFor, act, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
