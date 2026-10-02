import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { CopyButton } from './CopyButton.js';

describe('CopyButton', () => {
  it('copies the value and says what it copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderWithCrystal(<CopyButton value="npm i @crystal-ui/react" label="Copy the install command" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy the install command' }));

    expect(writeText).toHaveBeenCalledWith('npm i @crystal-ui/react');
    /* Announced as well as drawn. A label change is visual only, so the live
       region speaks it. */
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Copy the install command');
    });
  });

  /* Claiming a copy that did not happen is worse than a control that appears not
     to have worked. The value is still on screen to select. */
  it('claims nothing when the clipboard refuses', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });

    renderWithCrystal(<CopyButton value="x" label="Copy" copiedLabel="Copied" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});
