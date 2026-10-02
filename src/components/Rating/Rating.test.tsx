import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Rating } from './Rating.js';

describe('Rating', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Rating label="Rate this" defaultValue={3} />);
    await expectNoAxeViolations(container);
  });

  /* "Never symbol-only". Four filled stars is a picture of a number, which a
     reader who cannot see it does not get. */
  it('always shows the value as text', () => {
    renderWithCrystal(<Rating label="Rate this" value={4} isReadOnly />);
    expect(screen.getByText('4 out of 5')).toBeInTheDocument();
  });

  /* Read-only is text with a picture. A disabled radio group would announce
     "you may not change this", which is not what a published score means. */
  it('is not a control when it is read-only', () => {
    renderWithCrystal(<Rating label="Average" value={4.2} isReadOnly />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('is a radio group with one tab stop when interactive', async () => {
    renderWithCrystal(<Rating label="Rate this" defaultValue={0} />);
    expect(screen.getByRole('radiogroup', { name: /Rate this/ })).toBeInTheDocument();

    /* Each symbol says what it means, so arrowing announces "3 out of 5" rather
       than "radio button, 3". */
    await userEvent.click(screen.getByRole('radio', { name: '3 out of 5' }));
    expect(screen.getByRole('radio', { name: '3 out of 5' })).toBeChecked();
  });
});
