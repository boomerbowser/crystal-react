import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Dialog } from './Dialog.js';
import { Button } from '../Button/Button.js';


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

  /* A dialog that overflows on a phone is the defect Meridian reported from the
     deployed preview. Its body scrolls, with Crystal's Frost scrollbar — a dialog
     is a reading surface, not a control plane — and the surface itself does not,
     because the surface is what carries the material. */
  it('scrolls its body with the Frost scrollbar, leaving the surface to the material', () => {
    renderWithCrystal(<Dialog isOpen title="Terms">Body</Dialog>);
    const body = screen.getByText('Body').closest('.cr-scroll-frost');
    expect(body).not.toBeNull();
    expect(body?.className).not.toMatch(/\bcr-scroll-resin\b/);

    /* The heading stays out of the scroller: context that scrolls away is lost. */
    expect(screen.getByRole('heading', { name: 'Terms' }).closest('.cr-scroll-frost')).toBeNull();
  });
});
