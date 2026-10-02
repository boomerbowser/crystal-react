import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DropIndicator } from './DropIndicator.js';

describe('DropIndicator', () => {
  /* Announced as the drag moves, so a keyboard drag is followable without sight.
     An indicator that is only drawn cannot be followed without sight. */
  it('is announced, not only drawn', () => {
    renderWithCrystal(<DropIndicator label="Insert before Beta" isActive />);
    const target = screen.getByRole('option', { name: 'Insert before Beta' });
    expect(target.getAttribute('aria-selected')).toBe('true');
  });

  /* A reader who cannot see the indicator appear has no way to tell "not here"
     from "not yet", so an invalid target is announced as one. */
  it('says when a target cannot be used', () => {
    renderWithCrystal(<DropIndicator label="Insert before Beta" isActive isInvalid />);
    expect(screen.getByRole('option', { name: /not allowed here/ })).toBeInTheDocument();
  });
});
