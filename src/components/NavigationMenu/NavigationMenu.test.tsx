import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { NavigationMenu } from './NavigationMenu.js';

const sections = [
  { id: 'products', label: 'Products', children: <a href="/a">Analytics</a> },
  { id: 'company', label: 'Company', children: <a href="/b">About</a> },
];

describe('NavigationMenu', () => {
  it('is a navigation landmark and not a menu', () => {
    renderWithCrystal(<NavigationMenu sections={sections} aria-label="Site" />);
    expect(screen.getByRole('navigation', { name: 'Site' })).toBeTruthy();
    /* role="menuitem" would tell a reader that following a link runs a command,
       and would bring the menu keyboard model (no Tab between items) into a
       panel full of links a reader expects to Tab through. */
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    expect(screen.queryByRole('menubar')).toBeNull();
  });

  it('discloses its panel, and says so', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<NavigationMenu sections={sections} />);
    const trigger = screen.getByRole('button', { name: 'Products' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeTruthy();
  });

  it('keeps the panel out of the accessibility tree while closed', () => {
    renderWithCrystal(<NavigationMenu sections={sections} />);
    /* `hidden`, not only off-screen: a closed panel whose links are still
       reachable puts every destination in the tab order twice. */
    expect(screen.queryByRole('link', { name: 'Analytics' })).toBeNull();
  });

  it('opens one panel at a time', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<NavigationMenu sections={sections} />);
    await user.click(screen.getByRole('button', { name: 'Products' }));
    await user.click(screen.getByRole('button', { name: 'Company' }));
    /* Two overlapping panels beneath a bar is a layout with no reading order. */
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Company' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<NavigationMenu sections={sections} />);
    const trigger = screen.getByRole('button', { name: 'Products' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    /* Without the return, a reader who dismisses a panel is focused on nothing,
       at the top of the document, with no indication of where they were. */
    expect(document.activeElement).toBe(trigger);
  });

  it('lets a panel be closed by pressing its own trigger again', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<NavigationMenu sections={sections} />);
    const trigger = screen.getByRole('button', { name: 'Company' });
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
