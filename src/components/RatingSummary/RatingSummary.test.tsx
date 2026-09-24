import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { RatingSummary } from './RatingSummary.js';

describe('RatingSummary', () => {
  /* "The average and the count are both stated." Either alone is a different
     claim: 4.8 from three people and from three thousand are not the same fact,
     and a bar at 60% could be six votes or six hundred. */
  it('states the average and the count together', () => {
    renderWithCrystal(<RatingSummary average={4.6} count={128} />);
    expect(screen.getByText('4.6 out of 5, from 128 ratings')).toBeInTheDocument();
  });

  /* "Bars are labelled" — each segment its own meter with its own name, rather
     than a row of coloured divs whose proportions exist only as pixels. */
  it('labels every bar', () => {
    renderWithCrystal(
      <RatingSummary average={4.6} count={10} distribution={[7, 2, 1, 0, 0]} />,
    );
    expect(screen.getByRole('meter', { name: /5 stars, 7/ })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: /1 star, 0/ })).toBeInTheDocument();
  });

  /* No reviews is the absence of an average, not an average of nought — and
     "0 out of 5" tells a reader the product was rated badly. */
  it('does not report nothing as a rating of zero', () => {
    renderWithCrystal(<RatingSummary count={0} />);
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    expect(screen.queryByText(/out of 5/)).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <RatingSummary average={4.6} count={10} distribution={[7, 2, 1, 0, 0]} />,
    );
    await expectNoAxeViolations(container);
  });
});
