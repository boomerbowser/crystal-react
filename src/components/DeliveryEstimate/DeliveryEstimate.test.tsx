import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DeliveryEstimate } from './DeliveryEstimate.js';

/* Constructed from local calendar fields, because the component renders the
   local calendar day. A date built from a UTC string is a different day for half
   the world. */
const friday = new Date(2026, 9, 2);

describe('DeliveryEstimate', () => {
  /* "An absolute date, not only a relative phrase." */
  it('gives an absolute date', () => {
    renderWithCrystal(<DeliveryEstimate on={friday} data-testid="d" />);
    expect(screen.getByTestId('d')).toHaveTextContent('Arrives Friday, October 2');
  });

  /* The `datetime` attribute is the local calendar day. `toISOString` returns
     a different day for anybody whose clock is not on UTC.

     The test uses an early and a late local instant. In any zone ahead of UTC
     the early one falls on the previous UTC day, and in any zone behind it the
     late one falls on the next, so one of the two crosses the UTC day boundary
     whatever the offset. In UTC neither crosses. The expected value is read
     from the local calendar fields, as a person reads a calendar, and does not
     reuse the implementation. */
  it('marks the date up as the local calendar day', () => {
    const calendar = (date: Date) => [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    for (const at of [new Date(2026, 9, 2, 1, 30), new Date(2026, 9, 2, 22, 30)]) {
      const { container, unmount } = renderWithCrystal(<DeliveryEstimate on={at} />);
      expect(container.querySelector('time')).toHaveAttribute('datetime', calendar(at));
      unmount();
    }
  });

  /* A relative phrase is additional and never instead: "in 3 days" stops being
     true the moment it is cached, screenshotted or read the next morning. */
  it('keeps the date when a relative phrase is given too', () => {
    renderWithCrystal(<DeliveryEstimate on={friday} relative="in 3 days" data-testid="d" />);
    const estimate = screen.getByTestId('d');
    expect(estimate).toHaveTextContent('in 3 days');
    expect(estimate).toHaveTextContent('October 2');
  });

  /* A blank space where a delivery date goes is indistinguishable from a
     delivery date of never. */
  it('says it is still working the estimate out, in a live region', () => {
    renderWithCrystal(<DeliveryEstimate loading data-testid="d" />);
    expect(screen.getByRole('status')).toHaveTextContent('Working out when this arrives');
  });

  it('says there is no estimate rather than rendering nothing', () => {
    renderWithCrystal(<DeliveryEstimate data-testid="d" />);
    expect(screen.getByTestId('d')).toHaveTextContent('No delivery estimate');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<DeliveryEstimate on={friday} relative="in 3 days" />);
    await expectNoAxeViolations(container);
  });
});
