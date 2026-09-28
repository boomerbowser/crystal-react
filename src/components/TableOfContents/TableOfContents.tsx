'use client';

/* TableOfContents.
 *
 * The catalogue splits this one cleanly, and the split is the design: **Crystal
 * supplies "active marking by label weight, spacing"; the product supplies
 * "which headings are collected, scroll spy thresholds".** So the component is
 * controlled — it is told which entry is active and marks it — and the scroll
 * spy ships beside it as `useHeadingInView`, which a product uses, replaces or
 * ignores.
 *
 * That is not a smaller component. It is the difference between a table of
 * contents that works in a virtualised document, a paginated one, a router-driven
 * one and a plain one, and a table of contents that only works in the last.
 *
 * **`aria-current="location"`, not `"page"`.** The catalogue names it, and the
 * distinction is real: `page` means this link points at the document you are
 * reading, which is true of *every* entry here. `location` means this is where
 * in it you are.
 *
 * **The active entry is label weight.** Not a mark beside the label — the
 * indentation in this list already carries meaning, so anything in the leading
 * space would be read as depth.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { CurrentLink } from '../NavLink/CurrentLink.js';
import styles from './TableOfContents.module.scss';

export interface TocEntry {
  /** The id of the heading in the document. Also the fragment the entry links to. */
  id: string;
  label: ReactNode;
  /** Heading depth, 1 for the top level. Drives the indentation. */
  level: number;
}

export interface TableOfContentsProps {
  entries: readonly TocEntry[];
  /** The entry the reader is at. Nothing is marked when this is undefined. */
  activeId?: string;
  /** Names the landmark, so it can be told apart from the page's other navigation. */
  label?: string;
  /**
   * Called instead of following the fragment. A product with its own scrolling —
   * smooth, offset for a sticky header, inside a virtualised container — takes
   * over here. Returning nothing lets the browser do its own thing.
   */
  onNavigate?: (id: string) => void;
  className?: string;
}

export function TableOfContents({
  entries, activeId, label = 'On this page', onNavigate, className,
}: TableOfContentsProps): React.JSX.Element {
  /* The shallowest level present becomes the zero point, so a document whose
     headings start at h2 is not indented by a level that is not there. */
  const base = entries.length ? Math.min(...entries.map((entry) => entry.level)) : 1;

  return (
    <nav aria-label={label} className={cx(styles['toc'], className)}>
      <ol className={cx(styles['list'])}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <CurrentLink
              isCurrent={entry.id === activeId}
              href={`#${entry.id}`}
              className={cx(styles['entry'])}
              style={{ '--cr-toc-level': entry.level - base } as React.CSSProperties}
              {...(entry.id === activeId ? { 'aria-current': 'location' as const } : {})}
              {...(onNavigate
                ? {
                  onClick: (event: React.MouseEvent) => {
                    /* Only a plain left click. A modified click is the reader
                       asking the browser for a new tab or window, and taking
                       that over is taking a choice away from them. */
                    if (event.defaultPrevented || event.metaKey || event.ctrlKey
                      || event.shiftKey || event.altKey || event.button !== 0) return;
                    event.preventDefault();
                    onNavigate(entry.id);
                  },
                }
                : {})}
            >
              {entry.label}
            </CurrentLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface UseHeadingInViewOptions {
  /**
   * Where in the scrolling box a heading counts as "reached", as a fraction from
   * the top. The default puts the line a fifth of the way down, which is where a
   * reader's eye is rather than at the very top edge — a heading exactly at the
   * top is one you have just scrolled past.
   */
  readonly line?: number;
  /** The scrolling element. Defaults to the document. */
  readonly root?: Element | null;
}

/**
 * The default scroll spy: the id of the last heading above the reading line.
 *
 * Offered rather than built in, because the catalogue puts the thresholds with
 * the product. A document in a virtualised list, a paginated one, or one whose
 * headings are not in the DOM yet needs a different answer, and a component that
 * assumed this one would be wrong in all three.
 *
 * ## Why a scroll listener and not an IntersectionObserver
 *
 * The observer is the more elegant instrument and it was the first
 * implementation. It was wrong three times over, each found by driving a real
 * Chromium and none of them visible to a unit test:
 *
 *   1. `rootMargin: '-20% 0px -80% 0px'` — the usual spelling of "a line a fifth
 *      of the way down" — describes a band of exactly **zero height**, and
 *      nothing can intersect a rectangle with no area. It fired three times
 *      across six scroll positions and the marking skipped two headings: right
 *      at the top, right at the bottom, stale in between.
 *   2. Giving the band real height fixed that and left the last entry
 *      unreachable. A short final section cannot push itself to the reading
 *      line — there is nothing below it to scroll — so it never crossed, so it
 *      was never marked.
 *   3. Detecting "the scroll has reached the end" inside the observer's callback
 *      does not help, because **reaching the end is not a crossing** and the
 *      callback never runs.
 *
 * A passive scroll listener, coalesced to one read per frame, has none of those
 * edge cases: it is told about every scroll, and the answer is recomputed from
 * geometry each time. It is also the instrument `AppBar` already settled on here,
 * and unlike the observer it works in the in-app preview browser, which delivers
 * no IntersectionObserver callbacks at all (D-5).
 */
export function useHeadingInView(
  ids: readonly string[],
  options: UseHeadingInViewOptions = {},
): string | undefined {
  const { line = 0.2, root = null } = options;
  const [active, setActive] = useState<string | undefined>(undefined);
  /* The ids as one string, so an inline array literal at the call site does not
     restart the listener on every render. */
  const key = ids.join(' ');
  const latest = useRef(ids);
  latest.current = ids;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const headings = latest.current
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (!headings.length) return undefined;

    const target: Element | Window = root ?? window;
    let frame = 0;

    const measure = (): void => {
      frame = 0;
      const box = root ?? document.documentElement;
      const boxTop = root ? root.getBoundingClientRect().top : 0;
      const boundary = boxTop + box.clientHeight * line;

      let current: string | undefined;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= boundary) current = heading.id;
      }

      /* At the end of the scroll the last heading is the answer whether or not
         it ever reached the line. Without this the final entry in a table of
         contents is one no amount of scrolling can mark. */
      if (box.scrollHeight - box.scrollTop - box.clientHeight <= 1) {
        current = headings[headings.length - 1]?.id;
      }

      /* Above the first heading, the first entry is still the one you are
         heading for — marking nothing leaves the list looking inert. */
      setActive(current ?? headings[0]?.id);
    };

    /* One read per frame. A scroll event can fire many times between paints, and
       every one of these handlers reads layout. */
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [key, line, root]);

  return active;
}
