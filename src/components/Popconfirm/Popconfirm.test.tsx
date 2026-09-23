import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Popconfirm } from './Popconfirm.js';
import { Button } from '../Button/Button.js';

describe('Popconfirm', () => {
  /* The decision this component exists to make. A confirmation exists because
     the action is hard to undo, and one that puts the destructive choice under
     the key the reader is already pressing has asked a question whose default
     answer is yes. Cancel is also what Escape does and what clicking away does,
     so the focused control and all three ways out agree. */
  it('opens with focus on cancel, not on confirm', async () => {
    renderWithCrystal(
      <Popconfirm label="Delete this project?" destructive>
        <Button>Delete</Button>
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('confirms when the reader takes the second step', async () => {
    const onConfirm = vi.fn();
    renderWithCrystal(
      <Popconfirm label="Delete this project?" onConfirm={onConfirm}>
        <Button>Delete</Button>
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  /* A confirmation that can be pressed twice has confirmed twice. */
  it('disables both controls while it is in flight', async () => {
    renderWithCrystal(
      <Popconfirm label="Delete this project?" pending>
        <Button>Delete</Button>
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Working' })).toBeDisabled();
  });
});
