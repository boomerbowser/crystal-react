'use client';

/* ResizableTable — a table whose columns can be resized.
 *
 * It is `DataTable` with resizing on and every column resizable unless it says
 * otherwise, and that is the whole of it. The catalogue lists it separately and
 * says its material "inherits the table surface", so a second implementation
 * would be a second table that has to be kept in step with the first — which is
 * the drift this library spends most of its comments avoiding.
 *
 * What it is for is the distinction worth keeping: `DataTable` is the full
 * instrument — sorting, selection, sizing, paging — and a product that only
 * needs columns a reader can widen should not have to switch selection off and
 * sorting off to get one. The name is the API.
 *
 * The rule the catalogue attaches is geometric and is held in `DataTable`'s
 * stylesheet: the resizer is a 44px target that does not shift the column it
 * borders. It reaches the floor by filling the header cell's height, and it
 * sits inside the header's box rather than straddling the boundary — a resizer
 * that overhangs moves the edge it is supposed to report.
 */
import { forwardRef } from 'react';
import { DataTable, type DataTableProps } from '../DataTable/DataTable.js';

export interface ResizableTableProps
  extends Omit<DataTableProps, 'resizable' | 'columns'> {
  /** Columns. Each is resizable unless it sets `isResizable: false`. */
  columns: DataTableProps['columns'];
}

export const ResizableTable = forwardRef<HTMLDivElement, ResizableTableProps>(
  function ResizableTable({ columns, ...props }, ref) {
    /* Opt-out rather than opt-in, which is the difference between this and
       `DataTable`: here resizing is the point, so a column that must keep its
       width says so. */
    const resizable = columns.map((column) => ({
      ...column,
      isResizable: column.isResizable ?? true,
    }));

    return <DataTable {...props} ref={ref} columns={resizable} resizable />;
  },
);
