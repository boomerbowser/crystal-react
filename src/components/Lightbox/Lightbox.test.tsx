import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
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

  /* "Zoom and pan are keyboard reachable." The zoom is buttons first, because a
     shortcut nobody can see only serves people who already know it is there.
     The shortcut works as well. */
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
    expect(status).toHaveTextContent('Fit to the frame');

    /* The keyboard half. The shortcut is ignored over a control, because `+`
       on the zoom button would fire twice, so the key goes to the picture. */
    const picture = screen.getByRole('dialog').querySelector('img');
    fireEvent.keyDown(picture!, { key: '+' });
    expect(status).toHaveTextContent('Zoomed to 150 per cent');
    fireEvent.keyDown(picture!, { key: '-' });
    expect(status).toHaveTextContent('Fit to the frame');
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
    /* `screen`, not the render container. The overlay is portalled to `body`,
       so a query scoped to the container finds nothing whatever the component
       does, and the test would pass with the pan region always present. */
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

  /* "Closing returns focus to the thumbnail." React Aria's restoration does
     this. The component still makes the claim, so the test asserts it. */
  it('returns focus to whatever opened it', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open the photograph</button>
          <Lightbox isOpen={open} onOpenChange={setOpen} label="Harbour at dusk">
            <img alt="" src="/1.jpg" />
          </Lightbox>
        </>
      );
    }
    renderWithCrystal(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open the photograph' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => { expect(trigger).toHaveFocus(); });
  });

  /* "Position announced." A dialog's name is read when the reader arrives in
     it; changing that name while they are already inside announces nothing, so
     the position has to be said as well as named. */
  it('says the item out loud when it changes under the reader', () => {
    const { rerender } = renderWithCrystal(
      <Lightbox isOpen label="Harbour at dusk" position="1 of 3">
        <img alt="" src="/1.jpg" />
      </Lightbox>,
    );
    /* Nothing on arrival: the name has just been read. */
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(
      <Lightbox isOpen label="The long bridge" position="2 of 3">
        <img alt="" src="/2.jpg" />
      </Lightbox>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('The long bridge, 2 of 3');
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
