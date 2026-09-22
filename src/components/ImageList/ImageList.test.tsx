import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { ImageList } from './ImageList.js';

const items = [
  { id: 'a', src: '/a.jpg', alt: 'A harbour at first light', caption: 'Sunrise, 5:40am' },
  { id: 'b', src: '/b.jpg', alt: 'A jetty in fog', caption: 'Fog, 7:10am' },
  { id: 'c', src: '/c.jpg', alt: '' },
];

describe('ImageList', () => {
  /* "A list" — so a reader is told how many images there are before walking
     them. A grid of divs announces nothing and gives no way out. */
  it('is a real named list', () => {
    renderWithCrystal(<ImageList items={items} label="Harbour series" />);
    const list = screen.getByRole('list', { name: 'Harbour series' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  /* The caption is not the alt text: one says what the picture means, the other
     what it is. Both are present and they are not the same sentence. */
  it('keeps the caption and the alt text as different things', () => {
    renderWithCrystal(<ImageList items={items} label="Harbour series" />);
    expect(screen.getByAltText('A harbour at first light')).toBeInTheDocument();
    expect(screen.getByText('Sunrise, 5:40am')).toBeInTheDocument();
  });

  /* Empty alt is decorative, and stays empty rather than being filled in from
     the caption. */
  it('leaves a decorative image decorative', () => {
    const { container } = renderWithCrystal(<ImageList items={items} label="Harbour series" />);
    const images = [...container.querySelectorAll('img')];
    expect(images.some((node) => node.getAttribute('alt') === '')).toBe(true);
  });

  it('makes the whole tile a link when given one', () => {
    renderWithCrystal(
      <ImageList label="Harbour series" items={[{ ...items[0]!, href: '/a' }]} />,
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<ImageList items={items} label="Harbour series" />);
    await expectNoAxeViolations(container);
  });
});
