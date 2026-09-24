import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { MasterDetail } from './MasterDetail.js';

/* This environment implements no `matchMedia` at all — `window.matchMedia` is
   `undefined` — so `useMediaQuery` falls back to its server value and the
   component renders the wide layout and only ever the wide layout. A test of
   the collapsed behaviour written without noticing that would exercise the wide
   path twice and pass, which is a test that cannot fail.
 *
 * So the query is supplied here, explicitly, and both branches are driven. What
 * is still not asked in this file is whether the panes actually sit side by side
 * at one width and stack at the other; that is geometry, and it belongs in
 * `verify:behaviour` where there is a viewport. */
function atWidth(wide: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: wide,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

afterEach(() => { vi.unstubAllGlobals(); });

const list = <ul><li>One</li></ul>;

describe('MasterDetail', () => {
  it('names both panes, so a landmark list can tell them apart', () => {
    atWidth(true);
    renderWithCrystal(
      <MasterDetail list={list} listLabel="Messages" detailLabel="Message" selectedKey="a">
        The message.
      </MasterDetail>,
    );
    expect(screen.getByRole('region', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Message' })).toBeInTheDocument();
  });

  /* Wide, both panes are on screen. Moving focus to the detail when a row is
     chosen would take the reader out of the list they are still reading down:
     arrow to the next row, and focus is somewhere else. The detail changed and
     they can see it change. */
  it('leaves focus in the list when both panes are on screen', async () => {
    atWidth(true);
    const { rerenderWithCrystal } = renderWithCrystal(
      <MasterDetail list={list} detailLabel="Message" selectedKey="a">First.</MasterDetail>,
    );
    rerenderWithCrystal(
      <MasterDetail list={list} detailLabel="Message" selectedKey="b">Second.</MasterDetail>,
    );
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Message' })).not.toHaveFocus();
    });
  });

  /* Collapsed, the detail has replaced the list. A reader left with focus on a
     list that is no longer displayed is focused on nothing, and their next key
     press goes to a control that is not there. */
  it('moves focus to the detail once the layout has collapsed', async () => {
    atWidth(false);
    const { rerenderWithCrystal } = renderWithCrystal(
      <MasterDetail list={list} detailLabel="Message" selectedKey={null}>First.</MasterDetail>,
    );
    rerenderWithCrystal(
      <MasterDetail list={list} detailLabel="Message" selectedKey="b">Second.</MasterDetail>,
    );
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Message' })).toHaveFocus();
    });
  });

  /* Stacked, one pane is displayed at a time. Showing both would be the list
     and the detail in sequence, which is a page rather than a master–detail. */
  it('shows one pane at a time when stacked', () => {
    atWidth(false);
    renderWithCrystal(
      <MasterDetail list={list} listLabel="Messages" detailLabel="Message" selectedKey="a">
        The message.
      </MasterDetail>,
    );
    expect(screen.queryByRole('region', { name: 'Messages' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Message' })).toBeInTheDocument();
  });

  /* The state products forget: wide, with nothing chosen, the detail pane is a
     large empty rectangle beside a list. */
  it('says what to do when nothing is chosen', () => {
    atWidth(true);
    renderWithCrystal(
      <MasterDetail list={list} selectedKey={null} emptySelection="Choose a message to read.">
        Never shown.
      </MasterDetail>,
    );
    expect(screen.getByText('Choose a message to read.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    atWidth(true);
    const { container } = renderWithCrystal(
      <MasterDetail list={list} listLabel="Messages" detailLabel="Message" selectedKey="a">
        The message.
      </MasterDetail>,
    );
    await expectNoAxeViolations(container);
  });
});
