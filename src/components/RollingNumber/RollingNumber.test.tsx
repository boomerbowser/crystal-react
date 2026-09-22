import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { RollingNumber } from './RollingNumber.js';

describe('RollingNumber', () => {
  /* "The value is announced once it settles, not on every frame." The digits are
     a picture of the number while it moves; the live region carries the value. */
  it('hides the digits and announces the value', () => {
    const { container } = renderWithCrystal(<RollingNumber value={42} />);
    const digits = container.querySelector('[aria-hidden="true"]');
    expect(digits).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('42');
  });

  it('announces the settled value after the roll, not during it', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(<RollingNumber value={42} />);
    expect(screen.getByRole('status')).toHaveTextContent('42');

    rerenderWithCrystal(<RollingNumber value={57} />);
    /* Still the old value on the tick after the change: the announcement waits
       for the roll, which is the half a `waitFor` alone would not catch. */
    expect(screen.getByRole('status')).toHaveTextContent('42');
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent('57'); });
  });

  /* Reduced motion removes the movement, never the state change — so there is
     nothing to wait for and the value is current immediately. */
  it('announces immediately under reduced motion', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <RollingNumber value={42} />, { theme: { reduceMotion: true } },
    );
    rerenderWithCrystal(<RollingNumber value={57} />);
    expect(screen.getByRole('status')).toHaveTextContent('57');
  });

  it('formats the digits and the announcement with the same thing', () => {
    renderWithCrystal(
      <RollingNumber value={1234.5} locale="en-GB" format={{ style: 'currency', currency: 'GBP' }} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('£1,234.50');
  });

  it('names what the number is of', () => {
    renderWithCrystal(<RollingNumber value={9} description="open tickets" />);
    expect(screen.getByRole('status')).toHaveTextContent('9 open tickets');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<RollingNumber value={1234} description="subscribers" />);
    await expectNoAxeViolations(container);
  });
});
