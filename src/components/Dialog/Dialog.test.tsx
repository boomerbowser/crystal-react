import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen, userEvent } from '../../test/render.js';
import { Dialog } from './Dialog.js';
import { Button } from '../Button/Button.js';


describe('Dialog', () => {
  it('is not in the document until it is open', () => {
    renderWithPrismata(<Dialog title="Settings">Body</Dialog>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exposes its title as the accessible name', () => {
    renderWithPrismata(<Dialog isOpen title="Settings">Body</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { baseElement } = renderWithPrismata(
      <Dialog isOpen title="Settings"><p>Body</p></Dialog>,
    );
    await expectNoAxeViolations(baseElement);
  });

  /* React Aria owns focus containment and its return. This checks that the
     component does not break it by rendering the parts in the wrong order. */
  it('moves focus into the dialog and traps it there', async () => {
    const user = userEvent.setup();
    renderWithPrismata(
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
    renderWithPrismata(
      <Dialog isOpen onOpenChange={onOpenChange} title="Settings">Body</Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /* The catalogue specifies a Mirage scrim with a Haze surface above it. Resin is
     the floating control plane and is the wrong material here. An earlier draft
     of the plan had it backwards, so this test pins it. */
  it('renders a Haze surface over a Mirage scrim, not Resin', () => {
    const { baseElement } = renderWithPrismata(<Dialog isOpen title="Settings">Body</Dialog>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/dialog/);
    expect(dialog.className).not.toMatch(/resin/i);
    expect(baseElement.querySelector('[class*="scrim"]')).not.toBeNull();
  });

  /* A dialog can overflow on a phone. Its body scrolls, with Prismata's Frost
     scrollbar because a dialog is a reading surface. The surface itself does not
     scroll, because it carries the material. */
  it('scrolls its body with the Frost scrollbar, leaving the surface to the material', () => {
    renderWithPrismata(<Dialog isOpen title="Terms">Body</Dialog>);
    const body = screen.getByText('Body').closest('.pr-scroll-frost');
    expect(body).not.toBeNull();
    expect(body?.className).not.toMatch(/\bpr-scroll-resin\b/);

    /* The heading stays out of the scroller, so it remains visible. */
    expect(screen.getByRole('heading', { name: 'Terms' }).closest('.pr-scroll-frost')).toBeNull();
  });
});
