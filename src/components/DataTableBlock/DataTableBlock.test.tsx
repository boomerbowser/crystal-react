import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { DataTableBlock, type DataTableBlockProps } from './DataTableBlock.js';

const noun = (count: number): string => (count === 1 ? 'order' : 'orders');
const props: DataTableBlockProps = {
  title: 'Orders',
  label: 'Orders',
  columns: [{ id: 'order', header: 'Order' }, { id: 'total', header: 'Total', align: 'end' }],
  rows: [
    { id: 'a', name: '1042', cells: { order: '1042', total: '£120.00' } },
    { id: 'b', name: '1043', cells: { order: '1043', total: '£48.50' } },
    { id: 'c', name: '1044', cells: { order: '1044', total: '£310.20' } },
  ],
  bulkActions: [{ id: 'archive', label: (count) => `Archive ${count} ${noun(count)}`, onAction: () => {} }],
  selectedLabel: (count) => `${count} ${noun(count)} selected`,
  filters: <button type="button">Filter</button>,
};

describe('DataTableBlock', () => {
  /* One landmark, the table's. A block region around a table region named the
     same word would be two stops for one table, which axe reports as
     landmark-unique. */
  it('has a heading and exactly one region, the table\'s own', () => {
    renderWithCrystal(<DataTableBlock {...props} />);
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(1);
    expect(within(regions[0]!).getByRole('grid', { name: 'Orders' })).toBeInTheDocument();
  });

  /* A bulk action is handed the count, so its button says what it will affect.
     The rows it acts on are exactly the ones it counted. */
  it('names every bulk action after what it will affect, and acts on exactly that', async () => {
    const onAction = vi.fn();
    renderWithCrystal(
      <DataTableBlock {...props} bulkActions={[{ id: 'archive', label: (n) => `Archive ${n} ${noun(n)}`, onAction }]} />,
    );
    expect(screen.queryByRole('button', { name: /Archive/ })).toBeNull();

    await userEvent.click(screen.getByRole('checkbox', { name: /1042/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /1044/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Archive 2 orders' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect([...(onAction.mock.calls[0]?.[0] as Set<string>)].sort()).toEqual(['a', 'c']);
  });

  /* A table cannot know whether "3" is news, so it says nothing. The block owns
     the announcement, says it as the count changes, and is silent at rest. */
  it('announces the count as it changes and is silent at rest', async () => {
    renderWithCrystal(<DataTableBlock {...props} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    await userEvent.click(screen.getByRole('checkbox', { name: /1043/ }));
    expect(status).toHaveTextContent('1 order selected');
  });

  it('swaps the filters for the bulk toolbar while selecting, and back on clear', async () => {
    renderWithCrystal(<DataTableBlock {...props} defaultSelectedKeys={new Set(['a'])} />);
    expect(screen.queryByRole('button', { name: 'Filter' })).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Actions for 1 order selected' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('offers no selection at all when there is nothing to do with one', () => {
    renderWithCrystal(<DataTableBlock {...props} bulkActions={[]} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  /* Headers over no rows say "there are none". While loading or failed, the data
     did not state that. When empty, it is true. */
  it('replaces the rows while loading or failed, and keeps the headers when empty', () => {
    const { unmount } = renderWithCrystal(<DataTableBlock {...props} state="loading" />);
    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Orders' }).closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
    unmount();

    const failed = renderWithCrystal(<DataTableBlock {...props} state="error" />);
    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('The table could not be loaded');
    failed.unmount();

    renderWithCrystal(<DataTableBlock {...props} state="empty" />);
    expect(screen.getByRole('columnheader', { name: 'Order' })).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers pages only when there is more than one', () => {
    const { unmount } = renderWithCrystal(<DataTableBlock {...props} page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pages of Orders' })).toBeInTheDocument();
    unmount();
    renderWithCrystal(<DataTableBlock {...props} page={1} totalPages={1} onPageChange={() => {}} />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  /* Every state is checked, because a defect can live in a render other than
     the first, as MetricsRow's malformed live region did in its loading
     render. */
  it.each([
    ['at rest', {}],
    ['selecting', { defaultSelectedKeys: new Set(['a', 'b']) }],
    ['loading', { state: 'loading' as const }],
    ['empty', { state: 'empty' as const }],
    ['failed', { state: 'error' as const }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<DataTableBlock {...props} {...extra} />);
    await expectNoAxeViolations(container);
  });
});
