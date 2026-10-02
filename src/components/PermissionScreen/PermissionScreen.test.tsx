import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { PermissionScreen } from './PermissionScreen.js';

describe('PermissionScreen', () => {
  /* "Says which permission and why." Both are required props, because "you do
     not have access" names neither. The reader cannot tell whether to ask an
     administrator, switch account or stop trying, and the person who could
     grant it does not know what to grant. */
  it('names the permission and why it is needed', () => {
    renderWithCrystal(
      <PermissionScreen permission="Billing access is required">
        Only account owners can see invoices.
      </PermissionScreen>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Billing access is required' }))
      .toBeInTheDocument();
    expect(screen.getByText('Only account owners can see invoices.')).toBeInTheDocument();
  });

  it('asks for it with a real button', async () => {
    const onRequest = vi.fn();
    const user = userEvent.setup();
    renderWithCrystal(
      <PermissionScreen permission="Billing access" onRequest={onRequest}>Why.</PermissionScreen>,
    );
    await user.click(screen.getByRole('button', { name: 'Request access' }));
    expect(onRequest).toHaveBeenCalledOnce();
  });

  /* `requesting` is a busy state of the same screen. */
  it('reports the request in flight as busy', () => {
    renderWithCrystal(
      <PermissionScreen permission="Billing access" onRequest={() => {}} isRequesting data-testid="screen">
        Why.
      </PermissionScreen>,
    );
    expect(screen.getByTestId('screen')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Requesting…' })).toBeDisabled();
  });

  /* Where the reader cannot grant it themselves there is no button to offer,
     and the screen shows none rather than a dead one. */
  it('offers no request where there is nothing the reader can do', () => {
    renderWithCrystal(<PermissionScreen permission="Billing access">Ask an owner.</PermissionScreen>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <PermissionScreen permission="Billing access" onRequest={() => {}}>Why.</PermissionScreen>,
    );
    await expectNoAxeViolations(container);
  });
});
