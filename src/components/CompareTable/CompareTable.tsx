'use client';

/* CompareTable: products side by side, with the differences said.
 *
 * "A real table with row and column headers; differences are stated in
 * text", and "differences are marked, not only coloured".
 *
 * Both sentences state one requirement. A reader comparing four products across
 * twelve attributes is looking for the rows where they differ. A table that
 * marks those rows only by tint works only for people who can see the tint, and
 * leaves a screen reader user holding forty-eight cells in their head.
 *
 * So a differing row says so, in text, in its own row header: "Weight, differs".
 * It is marked and coloured, in that order.
 *
 * The difference is computed from the values. A `differs` flag passed in from
 * outside cannot be checked, and it goes stale as soon as a product is added to
 * the comparison. `DiscountBadge` makes the same argument about being handed a
 * percentage. This component has every value, so it works the answer out.
 *
 * It is a real `<table>`, which `Table` already is, with row headers as well as
 * column headers. A `<div>` grid cannot provide row headers. In a comparison
 * table the row header is the attribute and the column header is the product,
 * and without both a cell reads as a bare value with no indication of what it
 * belongs to.
 */
import { forwardRef, type ReactNode } from 'react';
import { Table } from '../Table/Table.js';
import type { TableProps } from '../Table/Table.js';
import { cx } from '../../styles/cx.js';
import styles from './CompareTable.module.scss';

export interface CompareAttribute {
  id: string;
  /** What is being compared. The row's header. */
  label: string;
  /**
   * One value per product, in the products' order. The text of each is what is
   * compared, so two cells that read the same are the same.
   */
  values: readonly ReactNode[];
}

export interface CompareProduct {
  id: string;
  /** The column's header. */
  label: ReactNode;
}

export interface CompareTableProps
  extends Omit<TableProps, 'columns' | 'rows' | 'label'> {
  products: readonly CompareProduct[];
  attributes: readonly CompareAttribute[];
  label: string;
  /** What the mark on a differing row says. Default English. */
  differsLabel?: string;
  /** What a row where everything matches says. Nothing, by default. */
  matchesLabel?: string;
}

/* Two cells are the same when they read the same. The comparison uses rendered
   text, because a reader compares what is written, and two different elements
   that say "1.2 kg" are the same to them. */
function textOf(value: ReactNode): string {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join('');
  if (typeof value === 'object' && 'props' in value) {
    return textOf((value as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

export function differs(values: readonly ReactNode[]): boolean {
  if (values.length < 2) return false;
  const first = textOf(values[0]);
  return values.some((one) => textOf(one) !== first);
}

export const CompareTable = forwardRef<HTMLDivElement, CompareTableProps>(
  function CompareTable({
    products, attributes, label, differsLabel = 'differs', matchesLabel,
    className, ...props
  }, ref) {
    return (
      <Table
        {...props}
        ref={ref}
        label={label}
        className={cx(styles['compare'], className)}
        /* `Table` already makes the first column a `th scope="row"`, which a
           `div` grid cannot do. In a comparison the row header is the attribute
           and the column header is the product, and without both a cell reads
           as a bare value with no indication of what it belongs to. */
        columns={[
          { id: 'attribute', header: 'Attribute' },
          ...products.map((one) => ({ id: one.id, header: one.label })),
        ]}
        rows={attributes.map((attribute) => {
          const apart = differs(attribute.values);
          const note = apart ? differsLabel : matchesLabel;
          return {
            id: attribute.id,
            cells: {
              /* The mark is in the row header's own text, which a screen reader
                 reads on entering the row. A tint or a symbol in a separate
                 column would not be read. */
              attribute: (
                <>
                  {attribute.label}
                  {note ? (
                    <span className={cx(styles['note'], apart ? styles['differs'] : undefined)}>
                      , {note}
                    </span>
                  ) : null}
                </>
              ),
              ...Object.fromEntries(
                products.map((one, index) => [one.id, attribute.values[index] ?? '—']),
              ),
            },
          };
        })}
      />
    );
  },
);
