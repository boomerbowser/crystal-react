import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Focusable } from './Focusable.js';

describe('Focusable', () => {
  it('adds a tab stop', async () => {
    renderWithCrystal(
      <div>
        <button type="button">Before</button>
        <Focusable><div data-testid="f">A region</div></Focusable>
      </div>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByTestId('f'));
  });

  /* "Without inventing a role" is the contract. A focusable div is announced as
     whatever it already was — if it *does* something, it wants Pressable. */
  it('invents no role', () => {
    renderWithCrystal(<Focusable><div data-testid="f">A region</div></Focusable>);
    expect(screen.getByTestId('f').getAttribute('role')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('can be reachable programmatically without being a tab stop', async () => {
    renderWithCrystal(
      <div>
        <button type="button">Before</button>
        <Focusable excludeFromTabOrder><div data-testid="f">A region</div></Focusable>
        <button type="button">After</button>
      </div>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
  });
});
