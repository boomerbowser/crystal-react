'use client';

/* FilterPanel renders faceted filters and announces what is applied.
 *
 * "**Applied filters are announced and individually removable**; counts update
 * politely."
 *
 * The reader acts in the panel and the effect happens elsewhere on the page. A
 * list they are not looking at gets shorter. A checkbox says "checked" and
 * nothing about the four hundred products that just became eleven.
 *
 * Two things are announced: what is applied, as a set, and how many results
 * there are. The first is this panel's own state. The second belongs to the
 * product and arrives as a prop, because this component cannot know it.
 *
 * Individually removable means a control per applied filter as well as Clear
 * all, so a reader who has applied six filters and wants to keep five does not
 * have to start again. Each removal control carries the filter's name ("Remove
 * Blue", not six identical "Remove" buttons), as the wishlist button names its
 * product.
 *
 * Clear all appears only when there is something to clear. A disabled Clear all
 * would be a control with nothing to do.
 *
 * Counts update politely and the panel does not move while they do. A facet
 * whose count changes from 12 to 3 stays in the same place, and the list never
 * reorders itself by count under the reader's cursor.
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
  /** The facet groups, whether checkbox groups, sliders or something else. */
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
          {/* Rendered only when there is something to clear, never disabled. */}
          {onClearAll ? (
            <Button variant="quiet" onPress={onClearAll}>{clearAllLabel}</Button>
          ) : null}
        </div>
      ) : null}

      <div className={styles['facets']}>{children}</div>

      {/* One polite region. What is applied and how many results it leaves are
          one fact to the reader ("blue, large, 11 results"), and two regions
          would race to describe the same change. */}
      <span role="status" className={styles['announcement']}>{said}</span>
    </section>
  );
});
