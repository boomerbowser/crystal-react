import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Anchor } from './Anchor.js';

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

  /* The underline — the non-chromatic signal that this is a link, present at
     rest and not only on hover — is deliberately NOT asserted here. jsdom loads
     no stylesheet, so `getComputedStyle(link).textDecorationLine` is "none"
     whatever `Anchor.module.scss` says, and a test written against it would pass
     on a component with no styling at all. That is the same shape as the 36px
     tab: a check that cannot see what it claims to check. It belongs in a
     browser; see R-11 in docs/open-issues.md. */

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
