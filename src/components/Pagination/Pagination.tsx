'use client';

/* Pagination: moving through a paged result set.
 *
 * Every control is named for what it does. A row of bare numbers is a row of
 * unlabelled buttons: "3" announced alone tells a reader nothing about what
 * pressing it does. Each page control is named "Page 3", the arrows are named
 * in words, and the current page is also marked `aria-current="page"`. That
 * mark tells "where you are" from "where you could go" for someone who cannot
 * see that one pill is heavier than the others.
 *
 * The ellipsis is not a control. It stands for pages that were elided, and it
 * is neither focusable nor announced as an option, so a reader tabbing through
 * meets only pages and arrows. It is `aria-hidden`, and the page numbers on
 * either side of it carry the count of elided pages.
 *
 * Previous and next are disabled at the bounds and stay visible. A control
 * that disappears at the edge changes the shape of the row and moves every
 * other target. A disabled one keeps the geometry and says why it cannot be
 * used.
 *
 * Elision is computed from a window. The first and last page are always shown,
 * because they are the two destinations anyone asks for by name, and a window
 * of neighbours around the current page is shown so the row's width does not
 * change as you move through it.
 */
import { Button, type ButtonProps } from 'react-aria-components';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  /** How many pages there are. */
  total: number;
  /** Which page is showing, 1-based. */
  page: number;
  onPageChange: (page: number) => void;
  /**
   * How many pages to show either side of the current one. The first and last
   * are always shown on top of this.
   */
  siblings?: number;
  /** Names the landmark, so two paginated regions are distinguishable. */
  'aria-label'?: string;
  /** The arrows' names. Announced; never left to the glyph. */
  previousLabel?: string;
  nextLabel?: string;
  /** Builds each page control's name. */
  pageLabel?: (page: number) => string;
  className?: string;
}

/* A gap of exactly one page is rendered as that page. "1 … 3 4 5" spends the
   same width as "1 2 3 4 5" and hides a destination behind a decoration. */
function pagesToShow(total: number, page: number, siblings: number): (number | 'gap')[] {
  const shown = new Set<number>([1, total]);
  for (let offset = -siblings; offset <= siblings; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= total) shown.add(candidate);
  }
  const ordered = [...shown].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  let previous = 0;
  for (const value of ordered) {
    if (previous && value - previous === 2) out.push(previous + 1);
    else if (previous && value - previous > 2) out.push('gap');
    out.push(value);
    previous = value;
  }
  return out;
}

export function Pagination({
  total, page, onPageChange, siblings = 1,
  previousLabel = 'Previous page', nextLabel = 'Next page',
  pageLabel = (value) => `Page ${value}`,
  className, ...props
}: PaginationProps): React.JSX.Element {
  const entries = pagesToShow(Math.max(total, 1), page, siblings);

  return (
    <nav aria-label={props['aria-label'] ?? 'Pagination'} className={cx(styles['pagination'], className)}>
      <Button
        aria-label={previousLabel}
        isDisabled={page <= 1}
        onPress={() => onPageChange(page - 1)}
        className={cx(styles['arrow'])}
      >
        <span aria-hidden="true">‹</span>
      </Button>

      <ul className={cx(styles['pages'])}>
        {entries.map((entry, index) => (
          <li key={entry === 'gap' ? `gap-${String(index)}` : entry}>
            {entry === 'gap' ? (
              /* Not focusable and not announced. It stands for pages that were
                 elided, and a reader tabbing through should meet only pages
                 and arrows. */
              <span className={cx(styles['gap'])} aria-hidden="true">…</span>
            ) : (
              <PageButton
                isCurrent={entry === page}
                aria-label={pageLabel(entry)}
                {...(entry === page ? { 'aria-current': 'page' as const } : {})}
                onPress={() => onPageChange(entry)}
                className={cx(styles['page'])}
              >
                {entry}
              </PageButton>
            )}
          </li>
        ))}
      </ul>

      <Button
        aria-label={nextLabel}
        isDisabled={page >= total}
        onPress={() => onPageChange(page + 1)}
        className={cx(styles['arrow'])}
      >
        <span aria-hidden="true">›</span>
      </Button>
    </nav>
  );
}

/* A page that plays `selection` when it becomes the current one, whether by
   its own press, an arrow, or a page set from outside. It does not play on the
   render that first shows it current. */
function PageButton({ isCurrent, ...props }: ButtonProps & { isCurrent: boolean; 'aria-current'?: 'page' }): React.JSX.Element {
  const scope = useChangeMotion(isCurrent, entered('selection'));
  return <Button ref={scope as never} {...props} />;
}
