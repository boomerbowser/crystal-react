import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { MetricsRow } from './MetricsRow.js';
import { Statistic } from '../Statistic/Statistic.js';

describe('MetricsRow', () => {
  /* "A labelled list of figures." A screen reader saying "list, four items"
     before the first one tells the reader how much is coming, which is most of
     what they need from a dashboard's summary band. Four sibling divs say
     nothing at all. */
  it('is a named list whose items are the figures', () => {
    renderWithCrystal(
      <MetricsRow label="This month">
        <Statistic label="Revenue" value="£41,200" />
        <Statistic label="Orders" value="1,204" />
      </MetricsRow>,
    );
    const list = screen.getByRole('list', { name: 'This month' });
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  /* One announcement for the band, not one per tile. Six tiles each saying they
     are loading is a screen reader saying the same sentence six times — the
     same shape as `LoadingScreen`'s one skeleton over many shapes. */
  it('announces the wait once, however many figures are coming', () => {
    renderWithCrystal(
      <MetricsRow label="This month" loading>
        {Array.from({ length: 6 }, (_, i) => <Statistic key={i} label="Revenue" value="—" loading />)}
      </MetricsRow>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
  });

  /* A dashboard whose metrics have not been chosen yet renders nothing at all
     if this is a bare map, and the reader is left looking at a gap. */
  it('shows the empty state rather than an empty band', () => {
    renderWithCrystal(<MetricsRow label="This month" empty={<p>Choose the metrics to watch.</p>} />);
    expect(screen.getByText('Choose the metrics to watch.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  /* Both states, because the violation that shipped was only in one of them: a
     `ul` may contain only `li`, and the live region was a direct child of it.
     An axe assertion against the at-rest render passes in a world where the
     loading render is malformed. */
  it.each([false, true])('has no axe violations while loading is %s', async (loading) => {
    const { container } = renderWithCrystal(
      <MetricsRow label="This month" loading={loading}>
        <Statistic label="Revenue" value="£41,200" loading={loading} />
      </MetricsRow>,
    );
    await expectNoAxeViolations(container);
  });
});
