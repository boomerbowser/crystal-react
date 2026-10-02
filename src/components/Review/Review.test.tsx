import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Review } from './Review.js';
import { Rating } from '../Rating/Rating.js';

describe('Review', () => {
  /* "The rating is text as well as stars." A row of five stars is, to anything
     that does not see it, either nothing or "star star star star star". */
  it('carries the rating as text', () => {
    renderWithCrystal(
      <Review rating={<Rating label="Rating" value={4} isReadOnly />} author="Ada">
        A good print.
      </Review>,
    );
    expect(screen.getByText(/4 out of 5/)).toBeInTheDocument();
  });

  /* A review with no attribution is an assertion from nobody, and one with no
     date is from any time. Both change how much weight it should carry. */
  it('marks the date up as a date', () => {
    const { container } = renderWithCrystal(
      <Review author="Ada" date="2 October 2026" dateTime="2026-10-02">Good.</Review>,
    );
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-10-02');
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  /* A review clipped with an ellipsis and no way to open it cannot be read.
     The hidden text stays in the document, so a screen reader and a page
     search both find it. */
  it('offers a control to read a collapsed review, and keeps the text', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Review author="Ada" collapsible>
        The quay at dusk, and the light on the water is exactly right.
      </Review>,
    );
    expect(screen.getByText(/the light on the water/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Read the whole review' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Review
        rating={<Rating label="Rating" value={4} isReadOnly />}
        title="Exactly right"
        author="Ada"
        date="2 October 2026"
        dateTime="2026-10-02"
      >
        A good print.
      </Review>,
    );
    await expectNoAxeViolations(container);
  });
});
