import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavRail } from './NavRail.js';

const items = [
  { id: 'home', label: 'Home', href: '/', icon: <svg /> },
  { id: 'inbox', label: 'Inbox', href: '/inbox', icon: <svg />, badge: 12 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <svg /> },
];

describe('NavRail', () => {
  it('is a navigation landmark with a distinguishing name', () => {
    render(<NavRail items={items} aria-label="Workspace" />);
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeTruthy();
  });

  it('marks the current destination with aria-current, never aria-selected', () => {
    render(<NavRail items={items} currentId="inbox" />);
    const current = screen.getByRole('link', { current: 'page' });
    expect(current.textContent).toContain('Inbox');
    /* `aria-selected` belongs to a widget with a selection model. Arriving
       somewhere is not picking an option, and announcing it that way says the
       wrong thing about what the reader has done. */
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('keeps every destination named when collapsed', () => {
    const { rerender } = render(<NavRail items={items} currentId="home" />);
    const expanded = screen.getAllByRole('link').map((l) => l.textContent?.trim());
    rerender(<NavRail items={items} currentId="home" isCollapsed />);
    /* The accessible name must be the same string in both states. An icon-only
       rail whose links lose their names is the most common way this component
       becomes unusable without sight, and it looks identical on screen. */
    for (const label of ['Home', 'Inbox', 'Settings']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeTruthy();
    }
    expect(expanded.length).toBe(screen.getAllByRole('link').length);
  });

  it('marks exactly one destination as current', () => {
    render(<NavRail items={items} currentId="settings" />);
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')).toHaveLength(1);
  });

  it('marks none when the current id matches nothing', () => {
    render(<NavRail items={items} currentId="nowhere" />);
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });

  it('separates a badge from the label in the accessible name', () => {
    render(<NavRail items={items} />);
    /* Without the space the name accumulates as "Inbox12" — one token,
       announced as one word, because the name computation joins adjacent
       inline content with nothing between it. */
    expect(screen.getByRole('link', { name: 'Inbox 12' })).toBeTruthy();
  });
});
