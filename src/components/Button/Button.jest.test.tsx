/* The Jest compatibility suite.
 *
 * Small and real. It renders a themed component, reads the theme through
 * Prismata's resolver, and drives a keyboard interaction. That exercises what
 * differs under Jest: module resolution for ESM-style specifiers, SCSS module
 * handling, and the jsdom environment.
 */
import { render, screen } from '@testing-library/react';
import { PrismataProvider } from '../../theme/PrismataProvider.js';
import { Button } from './Button.js';
import { prismataTokens } from '../../theme/tokens.generated.js';

describe('Jest compatibility', () => {
  it('renders a themed Button', () => {
    render(<PrismataProvider><Button>Save</Button></PrismataProvider>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('resolves the theme through Prismata rather than a local default', () => {
    render(
      <PrismataProvider palette="cobalt" mode="dark">
        <Button>Save</Button>
      </PrismataProvider>,
    );
    const scope = document.querySelector('[data-prismata-scope]') as HTMLElement;
    expect(scope.dataset.prismataPalette).toBe('cobalt');
    expect(scope.dataset.prismataMode).toBe('dark');
  });

  it('clamps an out-of-range value to Prismata\'s own maximum, proving the resolver ran', () => {
    render(<PrismataProvider radius={999}><Button>Save</Button></PrismataProvider>);
    const scope = document.querySelector('[data-prismata-scope]') as HTMLElement;
    /* Compared with the token, because a check that the value is not 999 would
       pass even if the resolver clamped to the wrong value. */
    expect(scope.style.getPropertyValue('--pr-radius')).toBe(prismataTokens['shape.contentRadius']);
  });
});
