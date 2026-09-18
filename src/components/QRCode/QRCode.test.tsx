import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { QRCode } from './QRCode.js';

describe('QRCode', () => {
  /* A code is an image of a string. Without the string, somebody using a screen
     reader — or anyone whose camera will not focus — has no route to it. */
  it('always carries the encoded value as text', async () => {
    const { container } = renderWithCrystal(<QRCode value="https://example.com/x" />);
    expect(screen.getByRole('img', { name: 'https://example.com/x' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('takes an override for a value that is not human-readable', () => {
    renderWithCrystal(<QRCode value="00A1FF93B2" alt="Ticket for row F, seat 12" />);
    expect(screen.getByRole('img', { name: 'Ticket for row F, seat 12' })).toBeInTheDocument();
  });

  /* An expired code must not look — or read — as though it will scan. */
  it('says so when it has expired', () => {
    renderWithCrystal(<QRCode value="abc" isExpired />);
    expect(screen.getByRole('img', { name: /expired/i })).toBeInTheDocument();
  });

  /* The one deliberate exception to "every colour is a token": a scanner reads
     luminance, and a palette-tinted code is a decoration that sometimes works. */
  it('renders the code in fixed contrast rather than palette colours', () => {
    const { container } = renderWithCrystal(<QRCode value="abc" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')?.toLowerCase() ?? '').toMatch(/#ffffff|^$/);  // crystal-allow-literal: asserting the fixed contrast
    expect(container.innerHTML).toContain('#000000');  // crystal-allow-literal: asserting the fixed contrast
  });
});
