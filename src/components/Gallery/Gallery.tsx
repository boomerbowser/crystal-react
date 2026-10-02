'use client';

/* Gallery is a set of media with a full-screen viewer.
 *
 * "The viewer is a dialog: focus is contained, Escape closes, and **arrows move
 * between items with position announced**." The viewer is `Lightbox`, so the
 * first three are React Aria's and are not rebuilt here. This component adds
 * the set: the thumbnails, moving through them, and saying where in the set
 * the reader is.
 *
 * The thumbnails are one tab stop, not one per item. Otherwise twelve
 * photographs would be twelve stops between the control before the gallery
 * and the control after it, which is the argument the charts make about marks.
 * This is a `listbox` with a roving `tabindex`. Arrows move along it and Enter
 * opens what is focused.
 *
 * Arrows in the viewer move between items, and arrows inside a zoomed item pan
 * it. These are two different focus positions. `Lightbox` puts the pan on a
 * scroll container the reader tabs to, which leaves the arrows free here.
 *
 * Closing returns focus to the thumbnail the reader opened or, if they moved
 * through the set while it was open, to the one they ended on, and not to a
 * picture they have since left.
 */
import {
  forwardRef, useCallback, useEffect, useRef, useState,
  type HTMLAttributes, type KeyboardEvent, type ReactNode,
} from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Lightbox } from '../Lightbox/Lightbox.js';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
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

  /* Focus follows the roving cursor only while the viewer is closed. Moving
     through the set inside the dialog must not pull focus out of it. */
  useEffect(() => {
    if (open) return;
    const node = thumbs.current.get(active);
    if (node && thumbs.current.size > 0 && document.activeElement !== node
      && [...thumbs.current.values()].includes(document.activeElement as HTMLElement)) {
      node.focus();
    }
  }, [active, open]);

  /* Closing returns focus to the thumbnail the reader ended on.
   *
   * React Aria restores focus to the thumbnail they opened, which is the right
   * default but wrong here. After moving through the set, that thumbnail is no
   * longer the selected one, so focus would sit on one picture while the
   * strip's roving cursor sat on another, and the next arrow key would jump
   * from somewhere the reader is not.
   *
   * Moving focus synchronously does not race the restoration. React Aria
   * restores inside a `requestAnimationFrame` and only if focus is still on
   * the body by then, because anything else means focus "has been purposefully
   * moved elsewhere". This effect is that move. React Aria still guarantees
   * that focus never lands on the body; this component only chooses the
   * destination. */
  const wasOpen = useRef(false);
  useEffect(() => {
    const closing = wasOpen.current && !open;
    wasOpen.current = open;
    if (closing) thumbs.current.get(active)?.focus();
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
          <Thumb
            key={item.id}
            isSelected={index === active}
            register={(node) => {
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
          </Thumb>
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

/* A thumbnail. It plays `selection` when it becomes the active picture, by an
   arrow key, a press or the viewer moving on, and not on the render that shows
   the first picture active. */
function Thumb({ isSelected, register, ...props }: React.HTMLAttributes<HTMLDivElement> & {
  isSelected: boolean;
  register: (node: HTMLDivElement | null) => void;
}): React.JSX.Element {
  const scope = useChangeMotion(isSelected, entered('selection'));
  return <div ref={mergeRefs<HTMLDivElement>(register, scope as never)} {...props} />;
}
