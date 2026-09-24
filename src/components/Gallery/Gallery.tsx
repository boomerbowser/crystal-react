'use client';

/* Gallery — a set of media with a full-screen viewer.
 *
 * "The viewer is a dialog: focus is contained, Escape closes, and **arrows move
 * between items with position announced**." The viewer is `Lightbox`, so the
 * first three are React Aria's and are not rebuilt here. What this adds is the
 * set: the thumbnails, moving through it, and saying where in it you are.
 *
 * **The thumbnails are one tab stop, not one per item.** Twelve photographs are
 * twelve stops between the control before the gallery and the control after it,
 * which is the same argument the charts make about marks — so this is a
 * `listbox` with a roving `tabindex`, arrows move along it and Enter opens what
 * is focused.
 *
 * **Arrows in the viewer move between items; arrows inside a zoomed item pan
 * it.** Those are two different focus positions rather than two meanings for one
 * key — `Lightbox` puts the pan on a scroll container the reader tabs to, which
 * is what leaves the arrows free here.
 *
 * **Closing returns focus to the thumbnail the reader opened** — and, if they
 * moved through the set while it was open, to the one they ended on. Returning
 * to where they started would be returning them to a picture they have since
 * left.
 */
import {
  forwardRef, useCallback, useEffect, useRef, useState,
  type HTMLAttributes, type KeyboardEvent, type ReactNode,
} from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Lightbox } from '../Lightbox/Lightbox.js';
import { cx } from '../../styles/cx.js';
import styles from './Gallery.module.scss';

export interface GalleryItem {
  /** Stable across renders. */
  id: string;
  /** What this item is. The thumbnail's accessible name and the viewer's. */
  label: string;
  /** The thumbnail. An `img`, usually. */
  thumbnail: ReactNode;
  /** The full-size item. Defaults to the thumbnail, which is rarely right. */
  full?: ReactNode;
  caption?: ReactNode;
}

export interface GalleryProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  items: readonly GalleryItem[];
  /** What the set is. The list's accessible name. */
  label: string;
  /** How the position reads. Given the numbers, in the reader's language. */
  formatPosition?: (at: number, total: number) => string;
  previousLabel?: string;
  nextLabel?: string;
}

const BackIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const ForwardIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Gallery = forwardRef<HTMLDivElement, GalleryProps>(function Gallery({
  items, label, formatPosition = (at, total) => `${at + 1} of ${total}`,
  previousLabel = 'Previous', nextLabel = 'Next', className, ...props
}, ref): ReactNode {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const thumbs = useRef(new Map<number, HTMLElement>());

  /* Focus follows the roving cursor, but only while the viewer is closed —
     moving through the set inside the dialog must not pull focus out of it. */
  useEffect(() => {
    if (open) return;
    const node = thumbs.current.get(active);
    if (node && thumbs.current.size > 0 && document.activeElement !== node
      && [...thumbs.current.values()].includes(document.activeElement as HTMLElement)) {
      node.focus();
    }
  }, [active, open]);

  const move = useCallback((to: number) => {
    if (items.length === 0) return;
    setActive(Math.min(items.length - 1, Math.max(0, to)));
  }, [items.length]);

  const onStripKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight': event.preventDefault(); move(active + 1); break;
      case 'ArrowLeft': event.preventDefault(); move(active - 1); break;
      case 'Home': event.preventDefault(); move(0); break;
      case 'End': event.preventDefault(); move(items.length - 1); break;
      case 'Enter':
      case ' ': event.preventDefault(); setOpen(true); break;
      default: break;
    }
  }, [active, items.length, move]);

  /* Answered by the viewer while focus is inside it but outside a control. The
     scroll container that pans a zoomed item is focusable, so an arrow key there
     is the browser's scrolling and never reaches this. */
  const onViewerKey = useCallback((key: string): boolean => {
    if (key === 'ArrowRight') { move(active + 1); return true; }
    if (key === 'ArrowLeft') { move(active - 1); return true; }
    return false;
  }, [active, move]);

  const current = items[active];
  const position = items.length > 1 ? formatPosition(active, items.length) : undefined;

  return (
    <div {...props} ref={ref} className={cx(styles['gallery'], className)}>
      {/* One tab stop. Twelve photographs are not twelve stops between the
          control before this and the control after it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a listbox is interactive; the lint rule does not know the role */}
      <div
        role="listbox"
        aria-label={label}
        aria-orientation="horizontal"
        className={styles['strip']}
        onKeyDown={onStripKeyDown}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(node) => {
              if (node) thumbs.current.set(index, node);
              else thumbs.current.delete(index);
            }}
            role="option"
            aria-selected={index === active}
            aria-label={item.label}
            tabIndex={index === Math.min(active, items.length - 1) ? 0 : -1}
            className={styles['thumb']}
            onFocus={() => setActive(index)}
            onClick={() => { setActive(index); setOpen(true); }}
          >
            {item.thumbnail}
          </div>
        ))}
      </div>

      {current ? (
        <Lightbox
          isOpen={open}
          onOpenChange={setOpen}
          isDismissable
          label={current.label}
          {...(position === undefined ? {} : { position })}
          {...(current.caption === undefined ? {} : { caption: current.caption })}
          onKeyShortcut={onViewerKey}
          actions={items.length > 1 ? (
            <>
              <IconButton
                label={previousLabel}
                icon={BackIcon}
                variant="resin"
                isDisabled={active === 0}
                onPress={() => move(active - 1)}
              />
              <IconButton
                label={nextLabel}
                icon={ForwardIcon}
                variant="resin"
                isDisabled={active === items.length - 1}
                onPress={() => move(active + 1)}
              />
            </>
          ) : null}
        >
          {current.full ?? current.thumbnail}
        </Lightbox>
      ) : null}
    </div>
  );
});
