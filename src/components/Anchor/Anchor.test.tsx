import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Anchor } from './Anchor.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

describe('Anchor', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Anchor href="/docs">The documentation</Anchor>);
    await expectNoAxeViolations(container);
  });

  /* "Native anchor with an href. A link that acts is a button, not a link."
     React Aria will render a `<span role="link">` when given no href, and the
     result announces as a link while being invisible to the browser's link list,
     to open-in-new-tab and to the status bar. The type refuses that shape, and
     this is the run-time half of the same claim. */
  it('is a real anchor element with a destination', () => {
    renderWithCrystal(<Anchor href="/docs">The documentation</Anchor>);
    const link = screen.getByRole('link', { name: 'The documentation' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/docs');
  });

  /* The underline is the second, non-chromatic signal that distinguishes a link
     from the sentence around it — WCAG 1.4.1 — so it is present at rest and not
     only on hover.
     
     Read as the shorthand, and that is not a style choice. Vitest is configured
     with `css: true`, so the module stylesheet really is applied here, but jsdom
     does not derive longhands from a shorthand: `textDecoration` answers
     "underline" and `textDecorationLine` answers "none" for the same element.
     The first attempt at this test read the longhand, concluded that jsdom loads
     no CSS at all, and deleted itself. It was wrong, and so was the note it left
     behind. What jsdom genuinely cannot do is resolve a custom property —
     `color` here reads back as the literal text `var(--cr-primary)` — so a check
     about a colour still belongs in a browser. */
  it('is underlined at rest, not only on hover', () => {
    renderWithCrystal(<Anchor href="/docs">The documentation</Anchor>);
    const link = screen.getByRole('link');
    expect(getComputedStyle(link).textDecoration).toContain('underline');
  });

  /* Against the token rather than against the number. A test that writes `4px`
     keeps passing after the token moves, which makes it a test of nothing —
     which is why `lint:tokens` refuses a literal in here too. */
  it('clears the descenders it runs under, by the published offset', () => {
    renderWithCrystal(<Anchor href="/docs">The documentation</Anchor>);
    const offset = getComputedStyle(screen.getByRole('link')).getPropertyValue('text-underline-offset');
    expect(offset).toBe(crystalTokens['anchor.underlineOffset']);
  });

  it('opens an external link safely', () => {
    renderWithCrystal(<Anchor href="https://example.com" isExternal>Example</Anchor>);
    const link = screen.getByRole('link', { name: /Example/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  /* Opening a new tab is a change of context the reader did not ask for, and the
     reader most likely to be lost by it is the one who cannot see it happen. The
     disclosure is text, not an icon — an icon announces nothing. */
  it('says that an external link opens a new tab', () => {
    renderWithCrystal(<Anchor href="https://example.com" isExternal>Example</Anchor>);
    expect(screen.getByRole('link', { name: 'Example (opens in a new tab)' })).toBeInTheDocument();
  });

  it('does not disclose a new tab for an ordinary link', () => {
    renderWithCrystal(<Anchor href="/docs">The documentation</Anchor>);
    const link = screen.getByRole('link');
    expect(link.getAttribute('target')).toBeNull();
    expect(link.textContent).not.toMatch(/new tab/);
  });

  it('marks the external icon as decoration', () => {
    renderWithCrystal(<Anchor href="https://example.com" isExternal>Example</Anchor>);
    const svg = screen.getByRole('link').querySelector('svg');
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
