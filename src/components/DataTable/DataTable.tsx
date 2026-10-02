'use client';

/* DataTable: table anatomy with sorting, selection, column sizing and paging.
 *
 * This is React Aria's `Table`. `Table` in this library is a plain table. The
 * split follows the catalogue, which has three entries: `table`, `data-table`
 * and `resizable-table`.
 *
 * A static table is a document. A reader moves through it with their screen
 * reader's own table commands, and a plain `<table>` is what those commands are
 * for. An interactive table is a grid widget, with a roving focus, arrow keys
 * that move a cursor between cells, selection, and controls inside cells.
 * `role="grid"` tells assistive technology to switch from reading mode to
 * interaction mode. Rendered as a plain table, none of those keys would work.
 *
 * What Crystal owns, and what is easy to get wrong:
 *
 *   - Selection is shown by label weight, with no check badge on the row. The
 *     checkbox is the control that makes the selection. The row shows that it
 *     is selected by being heavier, as every other selected thing in Crystal
 *     does. The state belongs in the row, not only in the ticked box.
 *   - Real checkboxes with names, not a clickable cell or a row press. Each
 *     checkbox says which row it selects. React Aria composes that name itself:
 *     `aria-labelledby` is the checkbox's own label plus the row's text value,
 *     so the label here is the verb alone. Passing "Select Gather" produces
 *     "Select Gather Gather".
 *   - `aria-sort` on sorted headers, which React Aria supplies from the sort
 *     descriptor. It is on one column at a time, because it describes the
 *     table's order.
 */
import { forwardRef, useEffect, useRef, type Key, type ReactNode } from 'react';
import type { ColumnSize, ColumnStaticSize } from 'react-stately';
import {
  Table as AriaTable, TableHeader, TableBody, Column, Row, Cell,
  Checkbox, ResizableTableContainer, ColumnResizer,
  type SortDescriptor, type Selection,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { ChangeHighlight } from '../../feedback/ChangeHighlight.js';
import styles from './DataTable.module.scss';

export interface DataTableColumn {
  /** Identifies the column and keys each row's cells. */
  id: string;
  header: ReactNode;
  /** Offer a sort control in this column's header. */
  isSortable?: boolean;
  /** Numbers read right-aligned. Everything else reads from the start. */
  align?: 'start' | 'end';
  /** Let this column be resized by pointer and keyboard. */
  isResizable?: boolean;
  /** A starting width. React Aria's own `ColumnSize`: pixels, a percentage or
   *  a fraction, so a resized table can still divide what is left. */
  width?: ColumnSize;
  /** A floor. Static, because a fraction of what is left is not a minimum. */
  minWidth?: ColumnStaticSize;
}

export interface DataTableRow {
  /** Stable across renders. */
  id: string;
  cells: Record<string, ReactNode>;
  /** What this row is called, for the checkbox that selects it. */
  name: string;
}

export interface DataTableProps {
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  /** What the table is. */
  label: string;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Selection;
  defaultSelectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  /** Turn on column resizing. Columns opt in with `isResizable`. */
  resizable?: boolean;
  /**
   * What the resizer's own label says. The verb alone: React Aria appends the
   * column it borders, so "Resize" becomes "Resize Workspace".
   */
  resizerLabel?: string;
  /** Shown instead of the rows when there are none. */
  empty?: ReactNode;
  /** Whatever belongs under the table: sorting summaries, filters, paging. */
  footer?: ReactNode;
  className?: string;
}

const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Some, not all. A select-all box drawn with a check mark while one row of four
   is selected reads as "all of them", so the indeterminate state draws a dash. */
const DashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M6 12h12" strokeLinecap="round" />
  </svg>
);

export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(function DataTable(
  { columns, rows, label, selectionMode = 'none', selectedKeys, defaultSelectedKeys,
    onSelectionChange, sortDescriptor, onSortChange, resizable = false,
    resizerLabel, empty, footer, className },
  ref,
) {
  const selectable = selectionMode !== 'none';

  const settlers = useRef(new Map<HTMLElement, (name: string) => Promise<void>>());
  /* A row that was not in the table before (added, not scrolled to or
     re-sorted) arrives with `list-in`. The rows the table loads with do not.
     This is decided by the rows already seen, since React Aria may render any
     row afresh. A removed row leaves React Aria's collection at once, so there
     is nothing to play `list-out` on. */
  const seen = useRef<Set<string> | null>(null);
  const isNew = (id: string): boolean => seen.current !== null && !seen.current.has(id);
  useEffect(() => { seen.current = new Set(rows.map((row) => row.id)); });
  const resizing = useRef<HTMLElement | null>(null);

  const table = (
    <AriaTable
      aria-label={label}
      className={cx(styles['table'])}
      selectionMode={selectionMode}
      {...(selectedKeys === undefined ? {} : { selectedKeys })}
      {...(defaultSelectedKeys === undefined ? {} : { defaultSelectedKeys })}
      {...(onSelectionChange === undefined ? {} : { onSelectionChange })}
      {...(sortDescriptor === undefined ? {} : { sortDescriptor })}
      {...(onSortChange === undefined ? {} : { onSortChange })}
    >
      <TableHeader className={cx(styles['header'])}>
        {selectable ? (
          <Column className={cx(styles['selectColumn'])}>
            {/* Multiple selection gets a "select all". Single selection has
                nothing to select all of, so the cell holds only the column's
                name. */}
            {selectionMode === 'multiple'
              ? <SelectionBox slot="selection" label="Select all rows" />
              : <span className={styles['selectHeading']}>Selected</span>}
          </Column>
        ) : null}
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            isRowHeader={column.id === columns[0]?.id}
            allowsSorting={column.isSortable ?? false}
            {...(column.width === undefined ? {} : { defaultWidth: column.width })}
            {...(column.minWidth === undefined ? {} : { minWidth: column.minWidth })}
            className={cx(styles['column'])}
          >
            <ColumnLabel settlers={settlers} align={column.align ?? 'start'}>
              {column.header}
            </ColumnLabel>
            {/* A slider, so arrow keys resize and the new width is announced.
                It reaches the target floor by being the full height of the
                header with its own padding. It sits inside the header's own
                box, so it does not shift the column it borders. */}
            {resizable && (column.isResizable ?? false) ? (
              <ColumnResizer aria-label={resizerLabel ?? 'Resize'} className={cx(styles['resizer'])} />
            ) : null}
          </Column>
        ))}
      </TableHeader>

      <TableBody
        items={rows}
        className={cx(styles['body'])}
        {...(empty === undefined ? {} : { renderEmptyState: () => <div className={styles['empty']}>{empty}</div> })}
      >
        {/* `textValue` is what React Aria appends to the selection checkbox's
            name, so a row whose first cell is an avatar still announces as
            "Select Gather" and not just "Select". */}
        {(row: DataTableRow) => (
          <Row id={row.id} textValue={row.name} className={cx(styles['row'])}>
            {selectable ? (
              <Cell className={cx(styles['selectCell'])}>
                {/* The verb alone. React Aria appends the row, so this reads
                    "Select Gather". Passing the row name here would make it
                    "Select Gather Gather". */}
                <SelectionBox slot="selection" label="Select" />
              </Cell>
            ) : null}
            {columns.map((column) => (
              <Cell key={column.id} className={cx(styles['cell'])}>
                <CellInner align={column.align ?? 'start'} arriving={isNew(row.id)}>
                  {row.cells[column.id]}
                </CellInner>
              </Cell>
            ))}
          </Row>
        )}
      </TableBody>
    </AriaTable>
  );

  return (
    <div ref={ref} className={cx(styles['shell'], className)}>
      {/* The resizing container has to wrap the table, and it is also the scroll
          container, because a resized column can make the table wider than its
          frame. */}
      {resizable ? (
        <ResizableTableContainer
          className={cx(styles['scroller'], 'cr-table-scroll')}
          /* `resize-settle` plays on the column that was resized, once the
             resize ends: "after measured layout size changes". The resizer holds
             focus while it resizes, by pointer or by key, so its header is noted
             then. By the time a keyboard resize ends, focus has moved on. */
          onResize={() => {
            resizing.current = (document.activeElement as HTMLElement | null)
              ?.closest('[role=columnheader]')?.querySelector<HTMLElement>('[data-column-label]') ?? resizing.current;
          }}
          onResizeEnd={() => {
            const label = resizing.current;
            resizing.current = null;
            if (label) void settlers.current.get(label)?.('resize-settle');
          }}
        >
          {table}
        </ResizableTableContainer>
      ) : (
        <div tabIndex={0} role="region" aria-label={label} className={cx(styles['scroller'], 'cr-table-scroll')}>
          {table}
        </div>
      )}
      {footer === undefined ? null : <div className={styles['footer']}>{footer}</div>}
    </div>
  );
});

/** Crystal's checkbox glyph on React Aria's checkbox. A check mark here is
 *  information ("this row is in the selection"), which is a permitted use of
 *  the glyph. The row itself shows selection by weight. */
function SelectionBox({ slot, label }: { slot: 'selection'; label: string }): ReactNode {
  return (
    <Checkbox slot={slot} aria-label={label} className={cx(styles['checkbox'])}>
      {({ isIndeterminate }) => (
        <span aria-hidden="true" className={styles['box']}>
          {isIndeterminate ? DashIcon : CheckIcon}
        </span>
      )}
    </Checkbox>
  );
}

export type { Key as DataTableKey, Selection as DataTableSelection, SortDescriptor as DataTableSort };

/* A column's label, the element `resize-settle` plays on. It is registered by
   its element, so the table can reach the one whose resizer was used. */
function ColumnLabel({ settlers, align, children }: {
  settlers: React.RefObject<Map<HTMLElement, (name: string) => Promise<void>>>;
  align: string;
  children: ReactNode;
}): React.JSX.Element {
  const [scope, play] = useMotion();
  useEffect(() => {
    const map = settlers.current;
    const element = scope.current as HTMLElement | null;
    if (!element) return undefined;
    map.set(element, play);
    return () => { map.delete(element); };
  }, [play, settlers, scope]);
  return (
    <span ref={scope as never} data-column-label="" className={styles['columnLabel']} data-align={align}>
      {children}
    </span>
  );
}

/* A cell's content: `list-in` once if its row has just been added, and the
   `highlight` layer that washes under the value when it changes. On the content,
   because React Aria owns the row and the cell elements. */
function CellInner({ align, arriving, children }: { align: string; arriving: boolean; children: ReactNode }): React.JSX.Element {
  const [scope, play] = useMotion();
  return (
    <span ref={scope as never} data-align={align} className={styles['cellInner']}>
      {arriving ? <Arrival play={play} recipe="list-in" /> : null}
      {children}
      <ChangeHighlight />
    </span>
  );
}
