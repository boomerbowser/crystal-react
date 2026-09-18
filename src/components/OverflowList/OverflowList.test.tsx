import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { OverflowList } from './OverflowList.js';

describe('OverflowList', () => {
  /* jsdom lays nothing out, so every width is zero and the measuring pass can
     only ever conclude "nothing fits". What is worth pinning here is what happens
     around the measurement — that nothing is lost, and that the affordance names
     its count — rather than the arithmetic, which needs a real layout engine. */
  it('keeps every item reachable, in the row or in the overflow', () => {
    renderWithCrystal(
      <OverflowList renderOverflow={(_hidden, count) => <button type="button">{count} more</button>}>
        <span>Alpha</span>
        <span>Beta</span>
        <span>Gamma</span>
      </OverflowList>,
    );
    /* During the measuring pass everything is rendered — laid out, invisible —
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
});
