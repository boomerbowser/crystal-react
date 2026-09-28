'use client';

/* DataTableBlock — a table with its toolbar, bulk actions and pagination.
 *
 * "Selection count is **announced**; bulk actions **describe what they will
 * affect**." States: `at-rest`, `loading`, `empty`, `selecting`, `error`.
 *
 * The opinion is in the second half of that sentence, and it is enforced by the
 * shape of the prop rather than asked of the caller. A bulk action here is not a
 * button a product passes in; it is a verb and a function from the count to the
 * sentence the button says. So a button cannot read "Archive" while three rows
 * are selected — it reads "Archive 3 orders", because the only way to name one
 * is to be handed the number. A bare verb over a selection is the most common
 * way a bulk action deletes more than somebody meant.
 *
 * **`selecting` is not a prop.** It is what the block is in whenever anything is
 * selected, derived from the selection rather than declared beside it, so the
 * two cannot disagree. Entering it swaps the toolbar's filters for the count,
 * the actions and a way out; leaving it puts them back.
 *
 * **The count is announced, once per change.** `DataTable` makes the selection
 * and says nothing about its size — a table cannot know whether "3" is news.
 * The block can, so it owns a polite status region that says the count as it
 * changes and is silent at rest.
 *
 * **The block is not a landmark, and the table is.** `DataTable` renders its
 * scroll container as a focusable region named by `label`, because a region
 * that scrolls has to be reachable and has to say what it is. Wrapping that in a
 * second region, named by a heading that is usually the same word, gave a
 * landmark list reading "Orders, Orders" — axe calls it `landmark-unique`, and a
 * screen-reader user calls it two stops for one table. The heading gives the
 * block its structure; the table keeps the one region.
 *
 * **Loading and failure replace the rows; empty does not.** A table that is
 * loading or failed and still draws its headers over no rows says "there are
 * none", which is a fact the data did not state — the `AnalyticsPanel`
 * reasoning. An empty table is the opposite case: there really are none, and the
 * headers are what tell the reader what there would be.
 */
import { useState, type ReactNode } from 'react';
import type { Selection, SortDescriptor } from 'react-aria-components';
import { DataTable, type DataTableColumn, type DataTableRow } from '../DataTable/DataTable.js';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { Button } from '../Button/Button.js';
import { Pagination } from '../Pagination/Pagination.js';
import { Loader } from '../Loader/Loader.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { Result } from '../Result/Result.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './DataTableBlock.module.scss';

export type DataTableBlockState = 'at-rest' | 'loading' | 'empty' | 'error';

export interface DataTableBulkAction {
  id: string;
  /** What the button says for this many rows. "Archive 3 orders", never "Archive". */
  label: (count: number) => string;
  /** Receives exactly the rows the label counted. */
  onAction: (keys: Selection) => void;
  /** Destructive: Crystal's danger boundary on the control. */
  danger?: boolean;
}

export interface DataTableBlockProps {
  /** The block's heading. */
  title: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Names the table itself, for the grid's own announcement. */
  label: string;
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  /** Filters and search, shown while nothing is selected. */
  filters?: ReactNode;
  /** Offered while rows are selected. Without any, the table is not selectable. */
  bulkActions?: readonly DataTableBulkAction[];
  selectedKeys?: Selection;
  defaultSelectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  state?: DataTableBlockState;
  /** The announced count. Plain words, so "3 orders selected" rather than a number. */
  selectedLabel?: (count: number) => string;
  clearSelectionLabel?: string;
  emptyLabel?: ReactNode;
  errorLabel?: ReactNode;
  errorActions?: ReactNode;
  className?: string;
}

const countOf = (keys: Selection, rows: number): number => (keys === 'all' ? rows : keys.size);

export function DataTableBlock({
  title, headingLevel = 2, label, columns, rows, filters, bulkActions = [],
  selectedKeys, defaultSelectedKeys, onSelectionChange, sortDescriptor, onSortChange,
  page, totalPages, onPageChange, state = 'at-rest',
  selectedLabel = (count) => `${count} selected`,
  clearSelectionLabel = 'Clear selection',
  emptyLabel = 'Nothing here yet', errorLabel = 'The table could not be loaded', errorActions,
  className,
}: DataTableBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const [own, setOwn] = useState<Selection>(defaultSelectedKeys ?? new Set());
  const selection = selectedKeys ?? own;
  const select = (keys: Selection): void => {
    if (selectedKeys === undefined) setOwn(keys);
    onSelectionChange?.(keys);
  };

  const selectable = bulkActions.length > 0;
  const count = selectable ? countOf(selection, rows.length) : 0;
  const selecting = count > 0 && state === 'at-rest';
  const paged = totalPages !== undefined && totalPages > 1 && page !== undefined && onPageChange !== undefined;

  return (
    <div
      aria-busy={state === 'loading' || undefined}
      data-cr-state={selecting ? 'selecting' : state}
      className={cx(styles['block'], className)}
    >
      <div className={cx(styles['top'])}>
        <Heading className={cx(styles['heading'])}>{title}</Heading>
        {selecting ? (
          <Toolbar aria-label={`Actions for ${selectedLabel(count)}`} className={cx(styles['toolbar'])}>
            <span className={cx(styles['count'])}>{selectedLabel(count)}</span>
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.danger ? 'danger' : 'resin'}
                onPress={() => { action.onAction(selection); }}
              >
                {action.label(count)}
              </Button>
            ))}
            <Button variant="quiet" onPress={() => { select(new Set()); }}>{clearSelectionLabel}</Button>
          </Toolbar>
        ) : filters ? (
          <div className={cx(styles['filters'])}>{filters}</div>
        ) : null}
      </div>

      {/* Said as it changes and silent at rest. Outside the toolbar, because a live
          region has to exist before its text changes for the change to be
          announced, and the toolbar only exists once something is selected — the
          first selection would otherwise be the one that goes unsaid. */}
      <VisuallyHidden role="status">{selecting ? selectedLabel(count) : ''}</VisuallyHidden>

      {state === 'loading' ? <Loader label="Loading the table" /> : null}
      {state === 'error' ? (
        <div role="alert">
          <Result
            outcome="error"
            title={errorLabel}
            headingLevel={Math.min(headingLevel + 1, 6) as 3}
            {...(errorActions === undefined ? {} : { actions: errorActions })}
          />
        </div>
      ) : null}
      {state === 'at-rest' || state === 'empty' ? (
        <DataTable
          label={label}
          columns={columns}
          rows={state === 'empty' ? [] : rows}
          selectionMode={selectable ? 'multiple' : 'none'}
          selectedKeys={selection}
          onSelectionChange={select}
          {...(sortDescriptor === undefined ? {} : { sortDescriptor })}
          {...(onSortChange === undefined ? {} : { onSortChange })}
          empty={<EmptyState state="empty" title={emptyLabel} />}
        />
      ) : null}

      {paged && state === 'at-rest' ? (
        <Pagination
          aria-label={`Pages of ${label}`}
          total={totalPages}
          page={page}
          onPageChange={onPageChange}
          className={cx(styles['pages'])}
        />
      ) : null}
    </div>
  );
}
