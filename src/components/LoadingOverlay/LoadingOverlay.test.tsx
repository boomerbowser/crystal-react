import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { LoadingOverlay } from './LoadingOverlay.js';

describe('LoadingOverlay', () => {
  /* "Blocked content is inert; focus does not enter it." A scrim hides a region
     and stops the mouse and does nothing at all about the tab key — a keyboard
     reader walks into a form they cannot see and fills in fields that are about
     to be replaced. This is the half that is usually faked. */
  it('makes the region it blocks inert', () => {
    const { container } = renderWithCrystal(
      <LoadingOverlay loading label="Saving changes">
        <button type="button">Save</button>
      </LoadingOverlay>,
    );
    const content = container.querySelector('[inert]');
    expect(content).not.toBeNull();
    expect(content!.querySelector('button')).not.toBeNull();
  });

  it('leaves the region alone when nothing is loading', () => {
    const { container } = renderWithCrystal(
      <LoadingOverlay loading={false} label="Saving changes">
        <button type="button">Save</button>
      </LoadingOverlay>,
    );
    expect(container.querySelector('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  /* "The reason is announced" — in words, not as a spinner and a guess. */
  it('says why the region is blocked', () => {
    renderWithCrystal(
      <LoadingOverlay loading label="Saving changes"><p>Form</p></LoadingOverlay>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <LoadingOverlay loading label="Saving changes"><p>Form</p></LoadingOverlay>,
    );
    await expectNoAxeViolations(container);
  });
});
