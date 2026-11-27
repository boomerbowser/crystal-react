'use client';

/* Spoiler. Content truncated to a height, with a reveal control.
 *
 * Unlike `Collapse`, the hidden part stays in the document: "truncated text
 * remains in the accessibility tree". A spoiler is a visual economy that shows
 * six paragraphs as two so the page stays scannable, and a reader who is not
 * looking at the page has no reason to be given less of it. Cutting it from the
 * accessibility tree would turn a layout convenience into missing content.
 *
 * The truncation is a height and an edge fade, and the control is a real button
 * carrying `aria-expanded`. A screen reader announces "Show more, button,
 * collapsed", and pressing it reveals nothing the reader could not already
 * read. This is the reverse of a disclosure, and it is correct.
 */
import {
  useId, useLayoutEffect, useRef, useState,
  type HTMLAttributes, type ReactNode, type TransitionEvent,
} from 'react';
import { Button } from '../Button/Button.js';
import { cx } from '../../styles/cx.js';
import { usePrismataTheme } from '../../theme/PrismataProvider.js';
import { prismataTokens } from '../../theme/tokens.generated.js';
import styles from './Spoiler.module.scss';

export interface SpoilerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  /** How tall the collapsed state is. Any CSS length. */
  maxHeight?: string;
  /** What the control says when there is more to show. */
  showLabel?: string;
  /** What it says when everything is shown. */
  hideLabel?: string;
  /** Start open. */
  defaultExpanded?: boolean;
}

/** Prismata's duration for a spatial change, in milliseconds. */
const REVEAL_MS = Number.parseFloat(prismataTokens['motion.duration.spatial']);

export function Spoiler({
  /* A height in lines of the reader's own text. Eight ems is about five lines at
     Prismata's reading rhythm, and it follows the font if that changes. */
  children, maxHeight = '8em', showLabel = 'Show more', hideLabel = 'Show less', // prismata-allow-literal: relative to the text, not a design value
  defaultExpanded = false, className, ...props
}: SpoilerProps): ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId();
  /* Opening grows the cut edge down until the rest of the text is showing,
     and closing draws it back up. Nothing already visible moves or repaints:
     the text that was showing stays put, and only the edge travels. (It used to
     play `accordion-in`, a clip-and-fade over the whole block, which wiped the
     visible text away and back in and testers found disorienting.)
     The travel runs between two measured heights, because `max-block-size`
     cannot transition to `none`. When it ends the limit is removed, so content
     that changes size afterwards is never cut. */
  const { resolveDuration } = usePrismataTheme();
  const content = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState<string | undefined>(defaultExpanded ? undefined : maxHeight);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const element = content.current;
    if (!element) return undefined;
    if (expanded) {
      setLimit(`${element.scrollHeight}px`);
      /* With motion off there is no transition to end, so the limit is removed
         on a timer as well, one travel later. */
      const timer = setTimeout(() => { setLimit(undefined); }, resolveDuration(REVEAL_MS) + 50);
      return () => { clearTimeout(timer); };
    } else {
      /* From the open height to the preview: pin the current height first, so
         there is a start for the transition, then set the end next frame. */
      setLimit(`${element.scrollHeight}px`);
      const frame = requestAnimationFrame(() => { setLimit(maxHeight); });
      return () => { cancelAnimationFrame(frame); };
    }
    return undefined;
  }, [expanded, maxHeight, resolveDuration]);

  const settle = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && expanded) setLimit(undefined);
  };

  return (
    <div {...props} className={cx(styles['spoiler'], className)}>
      <div
        ref={content}
        id={id}
        className={styles['content']}
        data-expanded={expanded ? '' : undefined}
        data-settled={expanded && limit === undefined ? '' : undefined}
        style={limit === undefined ? undefined : { maxBlockSize: limit }}
        onTransitionEnd={settle}
      >
        {children}
      </div>
      <Button
        variant="quiet"
        aria-expanded={expanded}
        aria-controls={id}
        onPress={() => { setExpanded((open) => !open); }}
      >
        {expanded ? hideLabel : showLabel}
      </Button>
    </div>
  );
}
