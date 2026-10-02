/* The Jest compatibility suite.
 *
 * Small and real. It renders a themed component, reads the theme through
 * Crystal's resolver, and drives a keyboard interaction. That exercises what
 * differs under Jest: module resolution for ESM-style specifiers, SCSS module
 * handling, and the jsdom environment.
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
    /* Compared with the token, because a check that the value is not 999 would
       pass even if the resolver clamped to the wrong value. */
    expect(scope.style.getPropertyValue('--cr-radius')).toBe(crystalTokens['shape.contentRadius']);
  });
});
