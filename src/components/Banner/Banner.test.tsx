import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Banner } from './Banner.js';

describe('Banner', () => {
  it('is a status region by default and an alert only when asked', () => {
    const { rerender } = renderWithCrystal(<Banner>Maintenance at 21:00</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Banner urgent>Maintenance has started</Banner>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  /* "Dismissal returns focus sensibly." The control that was focused is the one
     being removed, so without somewhere to send it focus falls to the document
     body and a keyboard reader starts again from the top of the page. */
  it('returns focus where the caller says after dismissing', async () => {
    const back = createRef<HTMLButtonElement>();
    const onDismiss = vi.fn();
    renderWithCrystal(
      <>
        <button type="button" ref={back}>Back to content</button>
        <Banner onDismiss={onDismiss} returnFocusTo={back}>Maintenance at 21:00</Banner>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss this message' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(back.current);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Banner status="attention">Maintenance at 21:00</Banner>,
    );
    await expectNoAxeViolations(container);
  });
});
