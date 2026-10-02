import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Marquee } from './Marquee.js';

describe('Marquee', () => {
  it('is a named region, so a moving strip is not a mystery', () => {
    renderWithCrystal(<Marquee label="Latest releases"><span>One</span></Marquee>);
    expect(screen.getByRole('region', { name: 'Latest releases' })).toBeInTheDocument();
  });

  /* "Pausable on hover and focus" needs something a keyboard user can focus.
     The strip is also a scroll container, so the tab stop is what makes its
     content reachable. */
  it('takes a tab stop, so it can be paused without a pointer', () => {
    renderWithCrystal(<Marquee label="Latest releases"><span>One</span></Marquee>);
    expect(screen.getByRole('region')).toHaveAttribute('tabindex', '0');
  });

  /* "Removed entirely under reduced motion". The duplicate copy goes too: it
     exists only to make the loop seamless, and would otherwise read the same
     content twice. */
  it('renders one copy under reduced motion, not two', () => {
    renderWithCrystal(
      <Marquee label="Latest releases"><span>Crystal 2.1</span></Marquee>,
      { theme: { reduceMotion: true } },
    );
    expect(screen.getAllByText('Crystal 2.1')).toHaveLength(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Marquee label="Latest releases"><span>Crystal 2.1 · Slice J · Data display</span></Marquee>,
    );
    await expectNoAxeViolations(container);
  });
});
