import { describe, expect, it } from 'vitest';
import { renderWithCrystal as render, screen } from '../../test/render.js';
import { Dock } from './Dock.js';

const items = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'library', label: 'Library', href: '/library' },
  { id: 'account', label: 'Account', href: '/account' },
];

describe('Dock', () => {
  it('is a named navigation landmark', () => {
    render(<Dock items={items} aria-label="Primary" />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
  });

  it('marks the current destination with aria-current, never aria-selected', () => {
    render(<Dock items={items} currentId="library" />);
    expect(screen.getByRole('link', { current: 'page' }).textContent).toContain('Library');
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('holds every destination in one list, not one plane each', () => {
    const { container } = render(<Dock items={items} currentId="home" />);
    /* One Resin plane. A row of separate planes would put Resin beside Resin,
       which is the arrangement the material contract forbids — and it is
       invisible in a screenshot taken against a plain background. */
    expect(container.querySelectorAll('ul')).toHaveLength(1);
    expect(screen.getAllByRole('link')).toHaveLength(items.length);
  });

  it('marks exactly one destination current, or none', () => {
    const { rerender } = render(<Dock items={items} currentId="account" />);
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current'))).toHaveLength(1);
    rerender(<Dock items={items} />);
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });
});
