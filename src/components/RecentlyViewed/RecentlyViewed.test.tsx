import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { RecentlyViewed } from './RecentlyViewed.js';

describe('RecentlyViewed', () => {
  /* "A labelled list." A strip of cards with no list semantics is a sequence a
     reader cannot count, and the label is what distinguishes this from the four
     other strips on a storefront. */
  it('is a labelled list', () => {
    renderWithCrystal(
      <RecentlyViewed label="Recently viewed">
        <span>One</span>
        <span>Two</span>
      </RecentlyViewed>,
    );
    expect(screen.getByRole('region', { name: 'Recently viewed' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  /* "Scrolls within its own container; never the page" — and with the
     scrollbar Crystal's scroll contract specifies for it. The contract puts
     Frost on panels and reading surfaces and **Resin on compact or horizontal
     scrollers**; this is horizontal, so it is Resin. That is a rule read off
     the contract rather than a preference, and it is exactly the kind of thing
     that silently goes the other way when nobody asserts which sentence
     decided it. */
  it('owns its own scrolling, with the scrollbar the material asks for', () => {
    const { container } = renderWithCrystal(
      <RecentlyViewed label="Recently viewed"><span>One</span></RecentlyViewed>,
    );
    const scroller = container.querySelector('[data-cr-scroll-axis="x"]');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveClass('cr-scroll-resin');
    expect(scroller).not.toHaveClass('cr-scroll-frost');
  });

  /* A "recently viewed" strip with nothing in it is a heading over a void, and
     a first-time reader is told about a feature they have not used. */
  it('renders nothing at all when there is nothing to show', () => {
    /* The structure, not the text. An empty strip with a heading and an empty
       list has no text content either, so asserting on `textContent` passed
       with the whole guard deleted — the first version of this test did exactly
       that. What is being claimed is that there is no region and no list. */
    const { container } = renderWithCrystal(
      <RecentlyViewed label="Recently viewed" count={0}>{[]}</RecentlyViewed>,
    );
    expect(container.querySelector('section')).toBeNull();
    expect(container.querySelector('ul')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Recently viewed' })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <RecentlyViewed label="Recently viewed" heading="Recently viewed">
        <span>One</span>
      </RecentlyViewed>,
    );
    await expectNoAxeViolations(container);
  });
});
