import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Spoiler } from './Spoiler.js';

describe('Spoiler', () => {
  /* Unlike a disclosure, a spoiler is a visual economy, so the hidden part stays
     readable to anyone who is not looking at the page. */
  it('keeps the truncated content in the accessibility tree', () => {
    renderWithCrystal(<Spoiler>Six paragraphs of it</Spoiler>);
    expect(screen.getByText('Six paragraphs of it')).toBeInTheDocument();
  });

  it('is a real button carrying aria-expanded and aria-controls', async () => {
    renderWithCrystal(<Spoiler>Content</Spoiler>);
    const control = screen.getByRole('button', { name: 'Show more' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control.getAttribute('aria-controls')).toBeTruthy();

    await userEvent.click(control);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts open when asked to', () => {
    renderWithCrystal(<Spoiler defaultExpanded>Content</Spoiler>);
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Spoiler>Content</Spoiler>);
    await expectNoAxeViolations(container);
  });
});
