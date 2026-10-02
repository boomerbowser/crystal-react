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
import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
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

export function Spoiler({
  /* A height in lines of the reader's own text. Eight ems is about five lines at
     Crystal's reading rhythm, and it follows the font if that changes. */
  children, maxHeight = '8em', showLabel = 'Show more', hideLabel = 'Show less', // crystal-allow-literal: relative to the text, not a design value
  defaultExpanded = false, className, ...props
}: SpoilerProps): ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId();
  /* `accordion-in` plays as the rest of the content is revealed, never on the
     render that shows it already expanded. Collapsing cuts the content back to
     its preview without hiding it. `accordion-out` ends with the content gone,
     so it does not fit collapsing and is not played. */
  const reveal = useChangeMotion(expanded, entered('accordion-in'));

  return (
    <div {...props} className={cx(styles['spoiler'], className)}>
      <div
        ref={reveal as never}
        id={id}
        className={styles['content']}
        data-expanded={expanded ? '' : undefined}
        style={expanded ? undefined : { maxBlockSize: maxHeight }}
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
