import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { ClickAway } from './ClickAway.js';

describe('ClickAway', () => {
  it('calls back when a press finishes outside the subtree', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(
      <div>
        <ClickAway onDismiss={onDismiss}><div>Inside</div></ClickAway>
        <button type="button">Outside</button>
      </div>,
    );
    await userEvent.click(screen.getByText('Inside'));
    expect(onDismiss).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  /* Crystal's rule, which no library supplies: dismissal is never only a
     click-away. A keyboard user has no way to click outside, so Escape calls the
     same callback and taking this component gets both halves. */
  it('dismisses on Escape as well, because a keyboard user cannot click outside', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(
      <ClickAway onDismiss={onDismiss}><button type="button">Inside</button></ClickAway>,
    );
    screen.getByRole('button', { name: 'Inside' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stops listening when disabled', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(
      <div>
        <ClickAway onDismiss={onDismiss} isDisabled><div>Inside</div></ClickAway>
        <button type="button">Outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
