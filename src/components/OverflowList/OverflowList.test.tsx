import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { OverflowList } from './OverflowList.js';

describe('OverflowList', () => {
  /* jsdom lays nothing out, so every width is zero and the measuring pass can
     only conclude "nothing fits". These tests pin what happens around the
     measurement: nothing is lost, and the affordance names its count. The
     arithmetic needs a real layout engine. */
  it('keeps every item reachable, in the row or in the overflow', () => {
    renderWithCrystal(
      <OverflowList renderOverflow={(_hidden, count) => <button type="button">{count} more</button>}>
        <span>Alpha</span>
        <span>Beta</span>
        <span>Gamma</span>
      </OverflowList>,
    );
    /* During the measuring pass everything is rendered, laid out but invisible,
       so the widths exist to be read and no item has been dropped. */
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('hands the overflow affordance its count, so it can name itself', () => {
    let seen = -1;
    renderWithCrystal(
      <OverflowList
        renderOverflow={(_hidden, count) => { seen = count; return <button type="button">{count} more</button>; }}
      >
        <span>Alpha</span>
        <span>Beta</span>
      </OverflowList>,
    );
    expect(seen).toBeGreaterThanOrEqual(0);
  });

  /* A fragment is one child to `Children.toArray`, and JSX invites wrapping a
     row in one. Counted that way the row measures a single item, decides it
     does not fit, and moves everything into the overflow: seven commands
     render as the words "1 more" and nothing else. It typechecks and throws
     nothing, so the only symptom is a toolbar that looks empty.
   *
   * The test asserts the number of item cells, because that is the only part
   * of the count this environment can see: every element here is zero wide, so
   * nothing ever overflows and the visible items are the same either way. One
   * cell holding three spans and three cells holding one each look identical to
   * `getByText`, but they are different rows. */
  it('opens out a fragment rather than counting it as one item', () => {
    const { container } = renderWithCrystal(
      <OverflowList renderOverflow={(_hidden, count) => <button type="button">{count} more</button>}>
        <>
          <span>Alpha</span>
          <span>Beta</span>
          <span>Gamma</span>
        </>
      </OverflowList>,
    );
    const cells = container.querySelectorAll('[class*="item"]');
    expect(cells.length).toBeGreaterThanOrEqual(3);
  });
});
