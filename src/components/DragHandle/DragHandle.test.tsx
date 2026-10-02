import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { DragHandle } from './DragHandle.js';

const items = () => [{ 'text/plain': 'Alpha' }];

describe('DragHandle', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <DragHandle getItems={items} handleLabel="Move Alpha"><p>Alpha</p></DragHandle>,
    );
    await expectNoAxeViolations(container);
  });

  /* The catalogue makes keyboard drag a requirement, and a keyboard or a screen
     reader can start one from a button. A decorated div supports only the
     pointer path. */
  it('offers a real button to start a keyboard drag', async () => {
    renderWithCrystal(
      <DragHandle getItems={items} handleLabel="Move Alpha"><p>Alpha</p></DragHandle>,
    );
    const grip = screen.getByRole('button', { name: 'Move Alpha' });
    expect(grip).toBeInTheDocument();

    await userEvent.tab();
    expect(document.activeElement).toBe(grip);
  });

  it('starts at rest and refuses to lift when disabled', () => {
    renderWithCrystal(
      <DragHandle getItems={items} handleLabel="Move Alpha" isDisabled data-testid="d">
        <p>Alpha</p>
      </DragHandle>,
    );
    expect(screen.getByTestId('d').dataset['crState']).toBe('at-rest');
    expect(screen.getByRole('button', { name: 'Move Alpha' })).toBeDisabled();
  });
});
