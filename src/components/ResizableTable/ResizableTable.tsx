'use client';

/* ResizableTable: a table whose columns can be resized.
 *
 * It is `DataTable` with resizing on and every column resizable unless it says
 * otherwise. The catalogue lists it separately and says its material "inherits
 * the table surface", so it reuses `DataTable` rather than being a second table
 * that has to be kept in step with the first.
 *
 * `DataTable` is the full instrument (sorting, selection, sizing, paging). A
 * product that only needs columns a reader can widen should not have to switch
 * selection and sorting off to get one, so the separate name is the API.
 *
 * The catalogue's rule is geometric and is held in `DataTable`'s stylesheet: the
 * resizer is a 44px target that does not shift the column it borders. It reaches
 * the floor by filling the header cell's height, and it sits inside the header's
 * box rather than straddling the boundary, because a resizer that overhangs
 * moves the edge it reports.
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
    /* Opt-out rather than opt-in, which is the difference from `DataTable`. A
       column that must keep its width sets `isResizable: false`. */
    const resizable = columns.map((column) => ({
      ...column,
      isResizable: column.isResizable ?? true,
    }));

    return <DataTable {...props} ref={ref} columns={resizable} resizable />;
  },
);
