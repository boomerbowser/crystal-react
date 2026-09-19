import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NavLink } from './NavLink.js';

const Icon = <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>;

describe('NavLink', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <nav aria-label="Sections">
        <NavLink href="/inbox">Inbox</NavLink>
        <NavLink href="/drafts" isCurrent>Drafts</NavLink>
      </nav>,
    );
    await expectNoAxeViolations(container);
  });

  /* `aria-selected` belongs to a widget with a selection model. Announcing a
     destination that way says somebody picked an option inside a control, when
     what they did was arrive somewhere. */
  it('marks the current page with aria-current and never aria-selected', () => {
    renderWithCrystal(<NavLink href="/drafts" isCurrent>Drafts</NavLink>);
    const link = screen.getByRole('link', { name: 'Drafts' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.getAttribute('aria-selected')).toBeNull();
  });

  it('leaves aria-current off an entry that is not current', () => {
    renderWithCrystal(<NavLink href="/inbox">Inbox</NavLink>);
    expect(screen.getByRole('link').getAttribute('aria-current')).toBeNull();
  });

  /* The lesson from the menu, and the reason Meridian withdrew the leading
     selection mark: a column that appears only for the current entry shifts
     every label in the list the moment you navigate. The slot is always there. */
  it('reserves the dot’s room whether or not the dot is drawn', () => {
    const { container } = renderWithCrystal(
      <nav aria-label="Sections">
        <NavLink href="/inbox">Inbox</NavLink>
        <NavLink href="/drafts" isCurrent>Drafts</NavLink>
      </nav>,
    );
    const links = [...container.querySelectorAll('a')];
    const slots = links.map((link) => link.firstElementChild);
    expect(slots.every((slot) => slot !== null)).toBe(true);
    /* Same element, same place in the order — one is painted and one is not,
       which is a background rather than a box. */
    expect(slots[0]).toHaveAttribute('data-empty');
    expect(slots[1]?.hasAttribute('data-empty')).toBe(false);
  });

  it('hides the dot from assistive technology, because aria-current says it', () => {
    renderWithCrystal(<NavLink href="/drafts" isCurrent>Drafts</NavLink>);
    const link = screen.getByRole('link');
    expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(link).toHaveAccessibleName('Drafts');
  });

  it('treats an icon as decoration and keeps the label as the name', () => {
    renderWithCrystal(<NavLink href="/inbox" icon={Icon}>Inbox</NavLink>);
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('Inbox');
    expect(link.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('carries trailing content without it becoming the name', () => {
    renderWithCrystal(<NavLink href="/inbox" trailing={<span>12</span>}>Inbox</NavLink>);
    expect(screen.getByRole('link')).toHaveAccessibleName('Inbox 12');
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('is a real anchor with a destination', () => {
    renderWithCrystal(<NavLink href="/inbox">Inbox</NavLink>);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/inbox');
  });

  /* Selection is weight and location is a dot; neither is a check mark, which in
     Crystal means validated. */
  it('never marks the current page with a check', () => {
    renderWithCrystal(<NavLink href="/drafts" isCurrent>Drafts</NavLink>);
    const link = screen.getByRole('link');
    expect(link.textContent).not.toMatch(/[✓✔]/);
    expect(link.getAttribute('aria-checked')).toBeNull();
  });
});
