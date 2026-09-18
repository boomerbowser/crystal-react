import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { FocusTrap } from './FocusTrap.js';

describe('FocusTrap', () => {
  it('contains Tab within the region while active', async () => {
    renderWithCrystal(
      <div>
        <button type="button">Outside</button>
        <FocusTrap>
          <div>
            <button type="button">First</button>
            <button type="button">Last</button>
          </div>
        </FocusTrap>
      </div>,
    );
    screen.getByRole('button', { name: 'Last' }).focus();
    await userEvent.tab();
    /* Wrapping to First rather than escaping to Outside is the containment. */
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));
  });

  /* Rendering it unconditionally around something only sometimes modal has to be
     safe, or every caller writes the same conditional. */
  it('leaves the subtree alone when inactive', async () => {
    renderWithCrystal(
      <div>
        <FocusTrap isActive={false}>
          <div><button type="button">Inside</button></div>
        </FocusTrap>
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole('button', { name: 'Inside' }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside' }));
  });
});
