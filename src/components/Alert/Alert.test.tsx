import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Alert } from './Alert.js';

describe('Alert', () => {
  /* The catalogue's sharpest sentence: role=alert *only* for genuinely urgent,
     interrupting content. An assertive live region interrupts a screen reader
     mid-word, and a page rendering four of them on load has interrupted the
     reader four times about things already on the screen. */
  it('is an ordinary region, not a live one, by default', () => {
    renderWithCrystal(<Alert title="Saved" status="success" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('region', { name: 'Saved' })).toBeInTheDocument();
  });

  /* Urgency is not implied by severity. A danger alert that was on the page all
     along is not an interruption. */
  it('stays quiet even when the status is danger', () => {
    renderWithCrystal(<Alert title="Payment failed" status="danger" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('interrupts only when asked to', () => {
    renderWithCrystal(<Alert title="Session ending" status="attention" urgent />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  /* The words carry the meaning; the glyph is reinforcement. A reader told both
     would hear "exclamation mark, Payment failed". */
  it('hides the symbol from assistive technology', () => {
    const { container } = renderWithCrystal(<Alert title="Payment failed" status="danger" />);
    const symbol = container.querySelector('[aria-hidden="true"]');
    expect(symbol).not.toBeNull();
    expect(screen.getByRole('region').textContent).toContain('Payment failed');
  });

  /* Three alerts on a page otherwise offer a reader three buttons called
     "Close" and no way to tell which closes what. */
  it('names its dismiss control for what it dismisses', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(<Alert title="Payment failed" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: 'Dismiss: Payment failed' });
    await userEvent.click(button);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has no dismiss control when nothing would happen', () => {
    renderWithCrystal(<Alert title="Saved" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Alert title="Payment failed" status="danger">Your card was declined.</Alert>,
    );
    await expectNoAxeViolations(container);
  });
});
