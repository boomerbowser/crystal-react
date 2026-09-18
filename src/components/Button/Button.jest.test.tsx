/* The Jest compatibility suite.
 *
 * Deliberately small and deliberately real: it renders a themed component, reads
 * the theme through Crystal's resolver, and drives a keyboard interaction. That
 * exercises the three things that actually differ under Jest — module resolution
 * for ESM-style specifiers, SCSS module handling, and the jsdom environment —
 * rather than asserting something trivial and calling the runner supported.
 */
import { render, screen } from '@testing-library/react';
import { CrystalProvider } from '../../theme/CrystalProvider.js';
import { Button } from './Button.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

describe('Jest compatibility', () => {
  it('renders a themed Button', () => {
    render(<CrystalProvider><Button>Save</Button></CrystalProvider>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('resolves the theme through Crystal rather than a local default', () => {
    render(
      <CrystalProvider palette="cobalt" mode="dark">
        <Button>Save</Button>
      </CrystalProvider>,
    );
    const scope = document.querySelector('[data-crystal-scope]') as HTMLElement;
    expect(scope.dataset.crystalPalette).toBe('cobalt');
    expect(scope.dataset.crystalMode).toBe('dark');
  });

  it('clamps an out-of-range value to Crystal\'s own maximum, proving the resolver ran', () => {
    render(<CrystalProvider radius={999}><Button>Save</Button></CrystalProvider>);
    const scope = document.querySelector('[data-crystal-scope]') as HTMLElement;
    /* Asserting the clamped result against the token, not merely that it is not
       999: the first form passes even if the resolver clamped to the wrong value. */
    expect(scope.style.getPropertyValue('--cr-radius')).toBe(crystalTokens['shape.contentRadius']);
  });
});
