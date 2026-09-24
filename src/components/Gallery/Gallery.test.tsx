import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Gallery } from './Gallery.js';

const items = [
  { id: 'a', label: 'Harbour at dusk', thumbnail: <img alt="" src="/a.jpg" /> },
  { id: 'b', label: 'The long bridge', thumbnail: <img alt="" src="/b.jpg" /> },
  { id: 'c', label: 'Rain on the quay', thumbnail: <img alt="" src="/c.jpg" /> },
];

describe('Gallery', () => {
  /* Twelve photographs are not twelve tab stops between the control before the
     gallery and the control after it — the same argument the charts make about
     marks. */
  it('is one tab stop, not one per thumbnail', () => {
    const { container } = renderWithCrystal(<Gallery items={items} label="Photographs" />);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(container.querySelectorAll('[tabindex="-1"]')).toHaveLength(2);
  });

  it('moves along the strip with the arrow keys', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    expect(screen.getByRole('option', { name: 'Harbour at dusk' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('option', { name: 'The long bridge' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'Rain on the quay' })).toHaveFocus();
  });

  it('opens the viewer on Enter', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Harbour at dusk/ })).toBeInTheDocument();
  });

  /* "Arrows move between items with position announced." The position is part
     of the viewer's accessible name, not small text beside it: a reader who
     cannot see the strip has no other way to know where in the set they are. */
  it('says where in the set the viewer is', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Harbour at dusk\s*1 of 3/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: /The long bridge\s*2 of 3/ })).toBeInTheDocument();
  });

  /* The name is read on arrival; it is not read again when it changes under a
     reader whose focus is sitting on the Next button. So the position has to be
     announced as well as named — the first version of this suite asserted only
     the name, and passed with nothing announced at all. */
  it('announces the item it moved to', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('status')).toHaveTextContent('The long bridge, 2 of 3');
  });

  /* "Closing returns focus to the thumbnail the reader opened — and, if they
     moved through the set while it was open, to the one they ended on."
     Returning them to a picture they have since left would be returning them to
     the wrong place. */
  it('returns focus to the item the reader ended on', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'The long bridge' })).toHaveFocus();
    });
  });

  /* The viewer is mounted while it is closed, so moving along the strip changes
     the item it is pointed at before the reader has arrived in it. Arriving to
     find an announcement already waiting is being told what changed while you
     were not there. */
  it('arrives silent, however the reader got to the item', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Rain on the quay/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  /* A zoom is something the reader did to one picture, in one sitting. Coming
     back to the set later and finding it still at 400 per cent is the viewer
     remembering something on their behalf that they did not ask it to. */
  it('opens fit to the frame however it was left', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByRole('status')).toHaveTextContent('Zoomed to 150 per cent');
    await user.keyboard('{Escape}');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not offer a way past either end of the set', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  /* A set of one needs no position and no way through it. */
  it('leaves the position and the arrows out of a set of one', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={[items[0]!]} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Harbour at dusk' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await expectNoAxeViolations(container);
  });
});
