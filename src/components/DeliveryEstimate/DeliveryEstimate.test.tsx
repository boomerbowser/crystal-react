import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DeliveryEstimate } from './DeliveryEstimate.js';

/* Constructed from local calendar fields, because that is what the component
   claims to render — a date built from a UTC string is a different day for half
   the world. */
const friday = new Date(2026, 9, 2);

describe('DeliveryEstimate', () => {
  /* "An absolute date, not only a relative phrase." */
  it('gives an absolute date', () => {
    renderWithCrystal(<DeliveryEstimate on={friday} data-testid="d" />);
    expect(screen.getByTestId('d')).toHaveTextContent('Arrives Friday, October 2');
  });

  /* Machine-readable, and built from the local calendar day rather than from
     `toISOString` — which returns a different day for anybody whose clock is
     not on UTC.
   *
     Two instants, early and late, because one is not enough to see the bug: a
     date at local midnight has the same UTC day in a zone behind Greenwich, and
     one at local midnight has the same UTC day in a zone ahead of it. Whatever
     the offset, one of these two crosses — and in UTC itself neither does,
     which is the one place the defect does not exist. The expected value is the
     local calendar read the way a person reads a calendar, which is the
     specification rather than a second copy of the implementation. */
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
