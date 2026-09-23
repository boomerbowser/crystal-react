import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import type { ChartFrame } from '../../charts/types.js';
import { ChartSurface } from './ChartSurface.js';

const table = {
  columns: ['Month', 'Revenue'],
  rows: [['January', 12], ['February', 18], ['March', null]] as const,
};

describe('ChartSurface', () => {
  /* The clause the whole component exists for: "every chart owes a text
     equivalent of its data — a chart is a second representation, never the only
     one." `table` is required, and this is what makes that mean something. */
  it('renders the data as a table beside the picture', () => {
    renderWithCrystal(<ChartSurface label="Revenue" table={table} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'February' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '18' })).toBeInTheDocument();
  });

  /* A gap is not a zero. A table that printed `0` for a month nobody measured
     would be a chart telling a reader something nobody knows. */
  it('shows a gap as a gap, not as zero', () => {
    renderWithCrystal(<ChartSurface label="Revenue" table={table} />);
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('names the figure from its caption', () => {
    renderWithCrystal(<ChartSurface label="Revenue by month" table={table} />);
    expect(screen.getByRole('figure', { name: 'Revenue by month' })).toBeInTheDocument();
  });

  /* `group`, not `img`. An `img` is a leaf and everything inside it — including
     the marks a keyboard moves between — stops being reachable. */
  it('gives the plot a group role so its marks stay reachable', () => {
    renderWithCrystal(
      <ChartSurface label="Revenue" table={table}>
        {() => <g data-testid="mark" tabIndex={0} />}
      </ChartSurface>,
    );
    expect(screen.getByRole('group', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByTestId('mark')).toBeInTheDocument();
  });

  it('draws nothing, and names nothing, when there is nothing to draw', () => {
    const { container } = renderWithCrystal(
      <ChartSurface label="Revenue" table={table} empty emptyLabel="No revenue recorded">
        {() => <g data-testid="mark" />}
      </ChartSurface>,
    );
    expect(screen.queryByTestId('mark')).toBeNull();
    expect(screen.getByText('No revenue recorded')).toBeInTheDocument();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  /* The child is given a frame even where nothing can be measured — a server, or
     a test environment with no layout. A chart that waited for a measurement
     would render nothing at all in both. */
  it('draws at a declared size before it has been measured', () => {
    let seen: ChartFrame | null = null;
    renderWithCrystal(
      <ChartSurface label="Revenue" table={table} height={180}>
        {(frame) => { seen = frame; return null; }}
      </ChartSurface>,
    );
    expect(seen).not.toBeNull();
    expect(seen!.height).toBe(180);
    expect(seen!.width).toBeGreaterThan(0);
    expect(seen!.inner.width).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<ChartSurface label="Revenue" table={table} />);
    await expectNoAxeViolations(container);
  });
});
