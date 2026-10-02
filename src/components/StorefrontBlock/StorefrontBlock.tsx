'use client';

/* StorefrontBlock. A product grid with filters, sort and pages.
 *
 * "Result count is announced on filter change; **the grid is a labelled
 * list**." States: `at-rest`, `loading`, `empty`, `filtering`.
 *
 * The announcement is `FilterPanel`'s, and the block does not make a second
 * one. The panel says what is applied and how many results there are as the
 * filters change, from the count the block hands it. A second region would say
 * the count twice.
 *
 * The products are a `ul` named for what they are ("Products" by default), so a
 * screen reader says "list, 24 items" before the first card. That is how a
 * reader learns the size of what they are browsing without paging through it.
 * The count is also shown, in words, beside the sort, because sighted readers
 * need it as much.
 *
 * Loading replaces the list and filtering does not. While the first page loads
 * there is nothing to show, and a grid of empty cards would say "these are the
 * products". While a filter is being applied the previous results stay, marked
 * busy, so the page does not collapse and reflow under a reader who is still
 * looking at it. Empty is `no-results`, meaning the filters found nothing, and
 * it offers a way out. It does not use the words a shop with no products would
 * use.
 */
import type { ReactNode } from 'react';
import { FilterPanel, type AppliedFilter } from '../FilterPanel/FilterPanel.js';
import { SortSelect, type SortSelectProps } from '../SortSelect/SortSelect.js';
import { ProductCard, type ProductCardProps } from '../ProductCard/ProductCard.js';
import { Pagination } from '../Pagination/Pagination.js';
import { Loader } from '../Loader/Loader.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { Button } from '../Button/Button.js';
import { cx } from '../../styles/cx.js';
import styles from './StorefrontBlock.module.scss';

export type StorefrontState = 'at-rest' | 'loading' | 'empty' | 'filtering';

export interface StorefrontProduct extends Omit<ProductCardProps, 'className'> {
  id: string;
}

export interface StorefrontBlockProps {
  title: ReactNode;
  headingLevel?: 1 | 2 | 3;
  products: readonly StorefrontProduct[];
  /** How many products match, across every page. */
  resultCount: number;
  /** The facets, rendered as `FilterPanel`'s children. */
  filters: ReactNode;
  applied?: readonly AppliedFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearFilters?: () => void;
  /** The ordering control's options and handler. */
  sort: Omit<SortSelectProps, 'className'>;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  state?: StorefrontState;
  /** Names the list. "Products" by default. */
  listLabel?: string;
  /** The count, in words. */
  countLabel?: (count: number) => string;
  className?: string;
}

export function StorefrontBlock({
  title, headingLevel = 1, products, resultCount, filters, applied = [], onRemoveFilter, onClearFilters,
  sort, page, totalPages, onPageChange, state = 'at-rest', listLabel = 'Products',
  countLabel = (count) => `${String(count)} ${count === 1 ? 'product' : 'products'}`, className,
}: StorefrontBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h1';
  const paged = totalPages !== undefined && totalPages > 1 && page !== undefined && onPageChange !== undefined;
  const filtering = state === 'filtering';

  return (
    <div className={cx(styles['storefront'], className)} data-cr-state={state}>
      <Heading className={cx(styles['title'])}>{title}</Heading>
      <div className={cx(styles['layout'])}>
        <FilterPanel
          applied={applied}
          {...(onRemoveFilter ? { onRemove: onRemoveFilter } : {})}
          {...(onClearFilters ? { onClearAll: onClearFilters } : {})}
          resultCount={resultCount}
          isLoading={filtering}
          className={cx(styles['filters'])}
        >
          {filters}
        </FilterPanel>

        <div className={cx(styles['results'])} aria-busy={state === 'loading' || filtering || undefined}>
          <div className={cx(styles['bar'])}>
            <p className={cx(styles['count'])}>{state === 'loading' ? '' : countLabel(resultCount)}</p>
            <SortSelect {...sort} className={cx(styles['sort'])} />
          </div>

          {state === 'loading' ? (
            <Loader label="Loading products" />
          ) : state === 'empty' ? (
            <EmptyState
              state="no-results"
              title="No products match these filters"
              {...(onClearFilters ? { actions: <Button onPress={onClearFilters}>Clear filters</Button> } : {})}
            />
          ) : (
            <ul aria-label={listLabel} className={cx(styles['grid'])}>
              {products.map(({ id, ...card }) => (
                <li key={id} className={cx(styles['cell'])}>
                  <ProductCard headingLevel={Math.min(headingLevel + 1, 6) as 2} {...card} />
                </li>
              ))}
            </ul>
          )}

          {paged && state !== 'loading' && state !== 'empty' ? (
            <Pagination
              aria-label={`Pages of ${listLabel.toLowerCase()}`}
              total={totalPages}
              page={page}
              onPageChange={onPageChange}
              className={cx(styles['pages'])}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
