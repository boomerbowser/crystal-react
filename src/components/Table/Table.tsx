'use client';

/* Table.
 *
 * A real `table`, `thead`, `tbody`, `th` and `td`, with `scope` on every header.
 * That is not a preference: header association is what lets a screen reader say
 * "Revenue, column 3, £48,210" as you move across a row, and there is no ARIA
 * pattern that recovers it once the elements are divs. Crystal's catalogue says
 * "real table semantics with header associations" and this is the whole of what
 * that means in practice.
 *
 * Sorting is the other half of that sentence: "sort controls are buttons
 * carrying aria-sort". Two things are easy to get wrong and both are handled
 * here — `aria-sort` belongs on the `th`, not on the button inside it, and only
 * *one* column may carry it at a time, because `aria-sort` describes the table's
 * current order rather than each column's capability. A column that is sortable
 * and not currently sorted carries nothing.
 *
 * The shell scrolls, not the page. A wide table inside a reading column has to
 * scroll sideways somewhere, and a scroll container with nothing focusable in it
 * cannot be reached without a pointer — so the shell is a tab stop and a named
 * region, the same contract `Code`'s blocks and `CodeBlock` follow. Its
 * scrollbar is Resin, because a compact horizontal scroller is a control plane.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Table.module.scss';

/** Which way a column is ordered right now. */
export type TableSortDirection = 'ascending' | 'descending';

export interface TableSort {
  column: string;
  direction: TableSortDirection;
}

export interface TableColumn {
  /** Identifies the column and keys each row's cells. */
  id: string;
  header: ReactNode;
  /** Offer a sort control in this column's header. */
  sortable?: boolean;
  /** Numbers read right-aligned; everything else reads from the start. */
  align?: 'start' | 'end';
  /** A width for this column — any CSS length or fraction. */
  width?: string;
}

export interface TableRow {
  /** Stable across renders. */
  id: string;
  cells: Record<string, ReactNode>;
  /** Shown as chosen. Selection is label weight, here as everywhere. */
  isSelected?: boolean;
  /** Names the row for assistive technology when the first cell does not. */
  header?: string;
}

export interface TableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  /** What the table is. Also names the scroll region. */
  label: string;
  /** Shown above the table. A visible caption names it better than a label. */
  caption?: ReactNode;
  /** The current order. One column at a time — `aria-sort` describes the table. */
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  /** Shown instead of the rows when there are none. */
  empty?: ReactNode;
  /** No rows yet. The shell keeps its size so the page does not reflow. */
  loading?: boolean;
}

/** The next direction for a column: ascending first, then back and forth. */
export function nextSort(column: string, current: TableSort | undefined): TableSort {
  if (current?.column !== column) return { column, direction: 'ascending' };
  return { column, direction: current.direction === 'ascending' ? 'descending' : 'ascending' };
}

export const Table = forwardRef<HTMLDivElement, TableProps>(function Table(
  { columns, rows, label, caption, sort, onSortChange, empty, loading = false, className, ...props },
  ref,
) {
  const isEmpty = rows.length === 0 && !loading;

  return (
    <div
      {...props}
      ref={ref}
      /* A tab stop and a named region, because the shell scrolls. */
      tabIndex={0}
      role="region"
      aria-label={label}
      className={cx(styles['shell'], 'cr-table-scroll', className)}
    >
      <table className={styles['table']}>
        {caption === undefined ? null : <caption className={styles['caption']}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              /* Only the sorted column carries `aria-sort`: it describes the
                 table's current order, not each column's capability. */
              const sorted = sort?.column === column.id ? sort.direction : undefined;
              return (
                <th
                  key={column.id}
                  scope="col"
                  data-align={column.align ?? 'start'}
                  {...(sorted === undefined ? {} : { 'aria-sort': sorted })}
                  {...(column.width === undefined ? {} : { style: { inlineSize: column.width } })}
                >
                  {column.sortable && onSortChange !== undefined ? (
                    <button
                      type="button"
                      className={cx(styles['sort'], 'cr-bare')}
                      onClick={() => { onSortChange(nextSort(column.id, sort)); }}
                    >
                      {column.header}
                      {/* The arrow is decoration; `aria-sort` on the header is
                          what is announced, so reading both would say it twice. */}
                      <span aria-hidden="true" className={styles['arrow']} data-sorted={sorted}>
                        {sorted === 'descending' ? '↓' : '↑'}
                      </span>
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isEmpty || loading ? (
            <tr>
              <td colSpan={columns.length} className={styles['notice']}>
                {loading ? <span aria-hidden="true" className={styles['placeholder']} /> : empty}
              </td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.id} data-selected={row.isSelected ? '' : undefined}>
              {columns.map((column, index) => {
                const content = row.cells[column.id];
                /* The first cell names its row, which is what lets a reader
                   moving down a column hear which row they are in. */
                if (index === 0) {
                  return (
                    <th key={column.id} scope="row" data-align={column.align ?? 'start'}>
                      {row.header ?? content}
                    </th>
                  );
                }
                return <td key={column.id} data-align={column.align ?? 'start'}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
