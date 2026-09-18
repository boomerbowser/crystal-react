import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Masonry } from './Masonry.js';

describe('Masonry', () => {
  /* A multi-column layout fills each column top to bottom, so the visual order is
     columnar while the reading order is not. For a gallery that is expected; for
     an ordered set the set has to be explicit, or the positions are unfollowable. */
  it('is presentational by default and a list when the items are a set', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <Masonry data-testid="m"><div>One</div></Masonry>,
    );
    expect(screen.queryByRole('list')).toBeNull();

    rerenderWithCrystal(<Masonry as="ul" data-testid="m"><li>One</li></Masonry>);
    expect(screen.getByRole('list')).toBe(screen.getByTestId('m'));
  });

  it('takes its columns and gap as custom properties', () => {
    renderWithCrystal(<Masonry columns={4} gap="lg" data-testid="m"><div>x</div></Masonry>);
    const el = screen.getByTestId('m');
    expect(el.style.getPropertyValue('--cr-masonry-columns')).toBe('4');
    expect(el.style.getPropertyValue('--cr-masonry-gap')).toBe('var(--cr-spacing-lg)');
  });
});
