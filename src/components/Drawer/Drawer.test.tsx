import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { Drawer, reorientationFor } from './Drawer.js';
import { Button } from '../Button/Button.js';

function Harness({ isModal }: { isModal: boolean }): React.JSX.Element {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => { setOpen(true); }}>Open</Button>
      <Button onPress={() => { /* a control on the page behind */ }}>Behind</Button>
      <Drawer title="Filters" isModal={isModal} isOpen={isOpen} onOpenChange={setOpen}>
        <Button>Apply</Button>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('has no accessibility violations when modal', async () => {
    const { container } = renderWithCrystal(
      <Drawer title="Filters" isOpen>
        <p>Body</p>
      </Drawer>,
    );
    await expectNoAxeViolations(container);
  });

  it('has no accessibility violations when not modal', async () => {
    const { container } = renderWithCrystal(
      <main>
        <Drawer title="Filters" isModal={false} isOpen>
          <p>Body</p>
        </Drawer>
      </main>,
    );
    await expectNoAxeViolations(container);
  });

  it('renders nothing when closed', () => {
    renderWithCrystal(<Drawer title="Filters"><p>Body</p></Drawer>);
    expect(screen.queryByText('Body')).toBeNull();
  });

  /* ------------------------------------------------ modality must be real */

  /* The defect this component exists to make impossible: a wash over the page
     that *looks* like the page is unavailable, with nothing behind the look.
     
     Not `aria-modal`, which React Aria deliberately does not set — it marks the
     rest of the page `inert` instead, which removes it from the accessibility
     tree *and* from the tab order rather than only claiming to. That attribute
     is not applied in jsdom, so the half of modality it carries is asserted in a
     browser by `scripts/verify-behaviour.mjs`; what is checked here is the half
     jsdom can see. */
  it('is a real dialog when modal, named by its heading', () => {
    renderWithCrystal(<Drawer title="Filters" isOpen><p>Body</p></Drawer>);
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('contains focus inside a modal drawer', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');

    /* Tab all the way round. Every stop has to be inside the drawer: the page
       behind is supposed to be unavailable, and "unavailable" has to mean the
       keyboard too. */
    for (let step = 0; step < 6; step += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  /* Waited for, not asserted straight away. `AnimatePresence` holds the panel
     mounted until its dismissal finishes — that is the whole reason it is there,
     and an assertion that the drawer is gone the instant it is asked to close is
     an assertion that the exit animation does not happen. */
  it('closes a modal drawer on Escape', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
  });

  /* The other half of the rule, and the one usually missed. A non-modal drawer
     must not merely *look* open-and-non-blocking; the page beside it has to
     actually still work. */
  it('is a complementary landmark when not modal, and no dialog at all', () => {
    renderWithCrystal(
      <main>
        <Drawer title="Filters" isModal={false} isOpen><p>Body</p></Drawer>
      </main>,
    );
    expect(screen.getByRole('complementary', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('leaves the page reachable beside a non-modal drawer', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal={false} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('complementary', { name: 'Filters' })).toBeInTheDocument();

    /* The control behind is not inside the drawer and is still usable. Under a
       real modal this element would be inert and this click would do nothing. */
    const behind = screen.getByRole('button', { name: 'Behind' });
    expect(screen.getByRole('complementary').contains(behind)).toBe(false);
    await user.click(behind);
    expect(behind).toHaveFocus();
  });

  /* A scrim is the *appearance* of modality. It appears with the behaviour or
     not at all, which is the whole of "must be real, not implied". */
  it('draws a scrim only when the page behind is genuinely blocked', () => {
    const { container: modal } = renderWithCrystal(
      <Drawer title="Filters" isOpen><p>Body</p></Drawer>,
    );
    const { container: inline } = renderWithCrystal(
      <main><Drawer title="Filters" isModal={false} isOpen><p>Body</p></Drawer></main>,
    );
    const hasScrim = (root: HTMLElement) => [...root.ownerDocument.querySelectorAll('[class]')]
      .some((el) => /_scrim_/.test(el.className));
    void inline;
    expect(hasScrim(modal)).toBe(true);
  });

  it('does not take focus when it opens without modality', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal={false} />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    /* A non-modal region is somewhere you can go, not somewhere you are sent. */
    expect(opener).toHaveFocus();
  });

  /* ------------------------------------------------------------- the rest */

  it('closes from its close control', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Close/ }));
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
  });

  it('names its close control after what it closes', () => {
    renderWithCrystal(<Drawer title="Filters" isOpen><p>Body</p></Drawer>);
    expect(screen.getByRole('button', { name: 'Close Filters' })).toBeInTheDocument();
  });

  it('can be built without a close control', () => {
    renderWithCrystal(<Drawer title="Filters" isOpen hideCloseButton><p>Body</p></Drawer>);
    expect(screen.queryByRole('button', { name: /Close/ })).toBeNull();
  });

  it('returns focus to the opener when a modal drawer closes', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness isModal />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => { expect(opener).toHaveFocus(); });
  });

  it('calls onOpenChange when it closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithCrystal(
      <Drawer title="Filters" isOpen onOpenChange={onOpenChange}><p>Body</p></Drawer>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

/* The authored recipe arrives from the right. Every other edge, and every
   right-to-left page, is that movement pointed somewhere else — so the mapping
   is the whole of "Crystal supplies the entrance direction" and is worth
   checking directly rather than through four rendered drawers. */
describe('reorientationFor', () => {
  it('plays the authored movement unchanged for the inline end of a left-to-right page', () => {
    expect(reorientationFor('end', false)).toEqual({ mirrorInline: false, toBlockAxis: false });
  });

  it('mirrors for the inline start of a left-to-right page', () => {
    expect(reorientationFor('start', false)).toEqual({ mirrorInline: true, toBlockAxis: false });
  });

  /* The two conditions cancel: the inline end is the left in a right-to-left
     page, which is the same movement the start needs in a left-to-right one. */
  it('mirrors for the inline end of a right-to-left page', () => {
    expect(reorientationFor('end', true)).toEqual({ mirrorInline: true, toBlockAxis: false });
  });

  it('plays the authored movement unchanged for the inline start of a right-to-left page', () => {
    expect(reorientationFor('start', true)).toEqual({ mirrorInline: false, toBlockAxis: false });
  });

  /* The block axis does not mirror with the reading direction: top is top in
     every locale Crystal supports. */
  it('turns onto the block axis for top and bottom, whatever the direction', () => {
    for (const rtl of [false, true]) {
      expect(reorientationFor('top', rtl)).toEqual({ mirrorInline: true, toBlockAxis: true });
      expect(reorientationFor('bottom', rtl)).toEqual({ mirrorInline: false, toBlockAxis: true });
    }
  });
});
