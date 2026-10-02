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
     gallery and the control after it. The charts make the same argument about
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
     of the viewer's accessible name and not small text beside it, because a
     reader who cannot see the strip has no other way to know where in the set
     they are. */
  it('says where in the set the viewer is', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Harbour at dusk\s*1 of 3/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: /The long bridge\s*2 of 3/ })).toBeInTheDocument();
  });

  /* The name is read on arrival and not again when it changes under a reader
     whose focus is on the Next button, so the position has to be announced as
     well as named. Asserting the name alone passes with nothing announced. */
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
     A picture they have since left is the wrong place to return them to. */
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
     its item before the reader arrives in it. The reader must not arrive to an
     announcement of changes made while they were not there. */
  it('arrives silent, however the reader got to the item', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Rain on the quay/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  /* A zoom applies to one picture in one sitting. Reopening the viewer must not
     find it still at 400 per cent, because the reader did not ask the viewer to
     remember it. */
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
