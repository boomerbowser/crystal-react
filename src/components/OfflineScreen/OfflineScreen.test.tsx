import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { OfflineScreen } from './OfflineScreen.js';

describe('OfflineScreen', () => {
  /* "Retry is a real button." Anything that follows links could trigger a retry
     offered as a link. */
  it('offers the retry as a button', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithCrystal(<OfflineScreen onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  /* Reconnecting is a state of the button, on the same screen. The region
     reports busy so the reader is not told the whole view changed. */
  it('reports reconnecting as busy and stops a second press', () => {
    renderWithCrystal(<OfflineScreen onRetry={() => {}} isReconnecting data-testid="screen" />);
    expect(screen.getByTestId('screen')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Reconnecting…' })).toBeDisabled();
  });

  /* "With what still works" is the half products tend to skip. An offline
     screen that only says "you are offline" replaces a working view with a
     dead one. */
  it('has somewhere to say what still works', () => {
    renderWithCrystal(<OfflineScreen>Your drafts are saved on this device.</OfflineScreen>);
    expect(screen.getByText('Your drafts are saved on this device.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <OfflineScreen onRetry={() => {}}>Your drafts are saved on this device.</OfflineScreen>,
    );
    await expectNoAxeViolations(container);
  });
});
