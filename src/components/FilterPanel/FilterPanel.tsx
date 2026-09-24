'use client';

/* FilterPanel — faceted filters, with what is applied said out loud.
 *
 * "**Applied filters are announced and individually removable**; counts update
 * politely."
 *
 * Both halves are about the same gap. Filtering is the one interaction on a
 * storefront where the reader's action happens *here* and its whole effect
 * happens somewhere else — a list they are not looking at gets shorter. A
 * checkbox going on says "checked" and nothing about the four hundred products
 * that just became eleven.
 *
 * So two things are announced, and they are different statements: **what is
 * applied**, as a set, and **how many results there are**. The first is this
 * panel's own state; the second is the product's, and it arrives as a prop
 * because this component cannot know it.
 *
 * **Individually removable, which means a control per applied filter and not
 * just Clear all.** A reader who has applied six filters and wants five of them
 * is otherwise made to start again. The removal controls carry the filter's own
 * name — "Remove Blue" rather than six identical "Remove" buttons — for the same
 * reason the wishlist button names its product.
 *
 * **Clear all only when there is something to clear.** A disabled Clear all on a
 * panel with nothing applied is a control that exists to be greyed out.
 *
 * **Counts update politely** and the panel does not move while they do: a facet
 * whose count changes from 12 to 3 is the same facet in the same place, and a
 * list that reorders itself by count under a reader's cursor is a list that
 * cannot be used.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { Chip } from '../Chip/Chip.js';
import { cx } from '../../styles/cx.js';
import styles from './FilterPanel.module.scss';

export interface AppliedFilter {
  /** Identifies it to `onRemove`. */
  id: string;
  /** What it is, in words. Part of the removal control's name. */
  label: string;
}

export interface FilterPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** What the panel filters. Its accessible name. */
  label?: string;
  /** The facet groups — checkbox groups, sliders, whatever the facets are. */
  children: ReactNode;
  /** What is currently applied. Announced as a set, and each one removable. */
  applied?: readonly AppliedFilter[];
  onRemove?: (id: string) => void;
  onClearAll?: () => void;
  /** How many results the applied filters leave. The product's number. */
  resultCount?: number;
  /** Results are being recounted. */
  isLoading?: boolean;
  removeLabel?: (filter: string) => string;
  clearAllLabel?: string;
  /** What the applied set says. Default English. */
  announceApplied?: (filters: readonly AppliedFilter[], results?: number) => string;
}

export const FilterPanel = forwardRef<HTMLElement, FilterPanelProps>(function FilterPanel({
  label = 'Filters', children, applied = [], onRemove, onClearAll,
  resultCount, isLoading = false,
  removeLabel = (one) => `Remove ${one}`, clearAllLabel = 'Clear all filters',
  announceApplied, className, ...props
}, ref): ReactNode {
  const said = applied.length === 0
    ? ''
    : (announceApplied ?? ((filters, results) => (
      `${filters.map((one) => one.label).join(', ')}`
        + (results === undefined ? '' : `. ${String(results)} ${results === 1 ? 'result' : 'results'}`)
    )))(applied, resultCount);

  return (
    <section
      {...props}
      ref={ref}
      aria-label={label}
      {...(isLoading ? { 'data-loading': '' } : {})}
      className={cx(styles['panel'], className)}
    >
      {applied.length > 0 ? (
        <div className={styles['applied']}>
          <ul className={styles['chips']} aria-label="Applied filters">
            {applied.map((filter) => (
              <li key={filter.id}>
                <Chip
                  {...(onRemove === undefined ? {} : { onRemove: () => onRemove(filter.id) })}
                  removeLabel={removeLabel(filter.label)}
                >
                  {filter.label}
                </Chip>
              </li>
            ))}
          </ul>
          {/* Only when there is something to clear: a disabled Clear all is a
              control that exists to be greyed out. */}
          {onClearAll ? (
            <Button variant="quiet" onPress={onClearAll}>{clearAllLabel}</Button>
          ) : null}
        </div>
      ) : null}

      <div className={styles['facets']}>{children}</div>

      {/* Polite, and one region: what is applied and how many results it leaves
          are one fact from the reader's side — "blue, large, 11 results". Two
          regions would race to describe the same change. */}
      <span role="status" className={styles['announcement']}>{said}</span>
    </section>
  );
});
