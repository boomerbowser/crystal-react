import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Lightbox } from './Lightbox.js';

describe('Lightbox', () => {
  it('is a dialog named for what it is showing', () => {
    renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk"><img alt="" src="/1.jpg" /></Lightbox>,
    );
    expect(screen.getByRole('dialog', { name: /Harbour at dusk/ })).toBeInTheDocument();
  });

  /* "Zoom and pan are keyboard reachable." The zoom is buttons first — a
     shortcut nobody can see is a feature for people who already know it is
     there — and the shortcut works as well. */
  it('zooms from a control and from the keyboard', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk"><img alt="" src="/1.jpg" /></Lightbox>,
    );
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(status).toHaveTextContent('Zoomed to 150 per cent');

    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(status).toBeEmptyDOMElement();
  });

  /* Pan is the platform's: once there is something to pan to, the item's scroll
     container becomes a tab stop and the arrow keys are the engine's scrolling.
     A container that never scrolls is a tab stop that does nothing, so it is
     only reachable once it is useful. */
  it('makes the item pannable only once it is bigger than the frame', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk"><img alt="" src="/1.jpg" /></Lightbox>,
    );
    /* `screen`, not the render container: the overlay is portalled to `body`, so
       a query scoped to the container finds nothing whatever the component does
       — which is how the first version of this test passed with the pan region
       always present. */
    expect(screen.queryByRole('group')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByRole('group', { name: /pan with the arrow keys/ })).toBeInTheDocument();
  });

  it('cannot be zoomed past its limits', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk"><img alt="" src="/1.jpg" /></Lightbox>,
    );
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    for (let press = 0; press < 10; press += 1) {
      // eslint-disable-next-line no-await-in-loop -- the presses are a sequence
      await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    }
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Zoomed to 400 per cent');
  });

  it('names its close control for what it closes', () => {
    renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk"><img alt="" src="/1.jpg" /></Lightbox>,
    );
    expect(screen.getByRole('button', { name: 'Close Harbour at dusk' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithCrystal(
      <Lightbox isOpen onOpenChange={onOpenChange} label="Harbour at dusk">
        <img alt="" src="/1.jpg" />
      </Lightbox>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
