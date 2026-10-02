import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { RecentlyViewed } from './RecentlyViewed.js';

describe('RecentlyViewed', () => {
  /* "A labelled list." List semantics let a reader count the cards, and the
     label distinguishes this strip from the others on a storefront. */
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

  /* "Scrolls within its own container; never the page", with the scrollbar
     Crystal's scroll contract specifies. The contract puts Frost on panels and
     reading surfaces and Resin on compact or horizontal scrollers. This strip
     is horizontal, so it is Resin, and the test asserts it. */
  it('owns its own scrolling, with the scrollbar the material asks for', () => {
    const { container } = renderWithCrystal(
      <RecentlyViewed label="Recently viewed"><span>One</span></RecentlyViewed>,
    );
    const scroller = container.querySelector('[data-cr-scroll-axis="x"]');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveClass('cr-scroll-resin');
    expect(scroller).not.toHaveClass('cr-scroll-frost');
  });

  /* An empty strip would be a heading over nothing, telling a first-time
     reader about a feature they have not used. */
  it('renders nothing at all when there is nothing to show', () => {
    /* Asserts on structure. An empty strip with a heading and an empty list has
       no text content either, so a `textContent` assertion would pass with the
       guard deleted. The claim is that there is no region and no list. */
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
