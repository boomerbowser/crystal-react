import { describe, expect, it } from 'vitest';
import { renderWithCrystal as render, screen } from '../../test/render.js';
import { BottomNavigation } from './BottomNavigation.js';

const items = [
  { id: 'feed', label: 'Feed', href: '/' },
  { id: 'search', label: 'Search', href: '/search' },
  { id: 'you', label: 'You', href: '/you' },
];

describe('BottomNavigation', () => {
  it('is a named navigation landmark', () => {
    render(<BottomNavigation items={items} aria-label="Sections" />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
  });

  it('marks the current destination with aria-current, never aria-selected', () => {
    render(<BottomNavigation items={items} currentId="search" />);
    expect(screen.getByRole('link', { current: 'page' }).textContent).toContain('Search');
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('always shows every label', () => {
    render(<BottomNavigation items={items} currentId="feed" />);
    /* Not an icon-only bar that reveals the label for the current destination
       only: that is the leading-mark defect in another form — the targets move
       as you navigate, and two of the three are unnamed to anyone who does not
       recognise the icon. */
    for (const item of items) {
      expect(screen.getByRole('link', { name: item.label })).toBeTruthy();
    }
  });

  it('gives every destination an equal slot', () => {
    const { container } = render(<BottomNavigation items={items} />);
    expect(container.querySelectorAll('li')).toHaveLength(items.length);
  });
});
