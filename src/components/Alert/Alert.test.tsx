import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Alert } from './Alert.js';

describe('Alert', () => {
  /* The catalogue's sharpest sentence: role=alert only for genuinely urgent,
     interrupting content. An assertive live region interrupts a screen reader
     mid-word, and a page rendering four of them on load has interrupted the
     reader four times about things already on the screen. */
  it('is an ordinary region, not a live one, by default', () => {
    renderWithPrismata(<Alert title="Saved" status="success" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('region', { name: 'Saved' })).toBeInTheDocument();
  });

  /* Urgency is not implied by severity. A danger alert that was on the page all
     along is not an interruption. */
  it('stays quiet even when the status is danger', () => {
    renderWithPrismata(<Alert title="Payment failed" status="danger" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('interrupts only when asked to', () => {
    renderWithPrismata(<Alert title="Session ending" status="attention" urgent />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  /* The words carry the meaning; the glyph is reinforcement. A reader told both
     would hear "exclamation mark, Payment failed". */
  it('hides the symbol from assistive technology', () => {
    const { container } = renderWithPrismata(<Alert title="Payment failed" status="danger" />);
    const symbol = container.querySelector('[aria-hidden="true"]');
    expect(symbol).not.toBeNull();
    expect(screen.getByRole('region').textContent).toContain('Payment failed');
  });

  /* Three alerts on a page otherwise offer a reader three buttons called
     "Close" and no way to tell which closes what. */
  it('names its dismiss control for what it dismisses', async () => {
    const onDismiss = vi.fn();
    renderWithPrismata(<Alert title="Payment failed" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: 'Dismiss: Payment failed' });
    await userEvent.click(button);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('removes itself when dismissed, with or without a handler', async () => {
    renderWithPrismata(<Alert title="Saved" dismissible />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Saved' }));
    expect(screen.queryByRole('region', { name: 'Saved' })).toBeNull();
  });

  it('stays while a controlled alert is not dismissed', async () => {
    const onDismiss = vi.fn();
    renderWithPrismata(<Alert title="Saved" onDismiss={onDismiss} dismissed={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Saved' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByRole('region', { name: 'Saved' })).toBeInTheDocument();
  });

  it('has no dismiss control when nothing would happen', () => {
    renderWithPrismata(<Alert title="Saved" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(
      <Alert title="Payment failed" status="danger">Your card was declined.</Alert>,
    );
    await expectNoAxeViolations(container);
  });
});
