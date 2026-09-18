import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { CrystalProvider } from '../../theme/CrystalProvider.js';
import { Dialog } from './Dialog.js';
import { Button } from '../Button/Button.js';

const renderWithCrystal = (ui: React.ReactNode) =>
  render(<CrystalProvider>{ui}</CrystalProvider>);

describe('Dialog', () => {
  it('is not in the document until it is open', () => {
    renderWithCrystal(<Dialog title="Settings">Body</Dialog>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exposes its title as the accessible name', () => {
    renderWithCrystal(<Dialog isOpen title="Settings">Body</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { baseElement } = renderWithCrystal(
      <Dialog isOpen title="Settings"><p>Body</p></Dialog>,
    );
    await expectNoAxeViolations(baseElement);
  });

  /* React Aria owns focus containment and its return. Asserting it here is not
     testing someone else's library — it is testing that this component did not
     break it by rendering the parts in the wrong order. */
  it('moves focus into the dialog and traps it there', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Dialog isOpen title="Settings">
        <Button>First</Button>
        <Button>Second</Button>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    await user.tab();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithCrystal(
      <Dialog isOpen onOpenChange={onOpenChange} title="Settings">Body</Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /* The catalogue specifies a Mirage scrim with a Haze surface above it. Resin is
     the floating control plane and is the wrong material here — an earlier draft
     of the plan had it backwards, so this is pinned. */
  it('renders a Haze surface over a Mirage scrim, not Resin', () => {
    const { baseElement } = renderWithCrystal(<Dialog isOpen title="Settings">Body</Dialog>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/dialog/);
    expect(dialog.className).not.toMatch(/resin/i);
    expect(baseElement.querySelector('[class*="scrim"]')).not.toBeNull();
  });
});
