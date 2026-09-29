'use client';

/* Spoiler — content truncated to a height, with a reveal control.
 *
 * Unlike `Collapse`, the hidden part stays in the document, and that is the
 * point: "truncated text remains in the accessibility tree". A spoiler is a
 * *visual* economy — six paragraphs shown as two so the page stays scannable —
 * and a reader who is not looking at the page has no reason to be given less of
 * it. Cutting it from the accessibility tree would turn a layout convenience
 * into missing content.
 *
 * So the truncation is a height and an edge fade, and the control is a real
 * button carrying `aria-expanded` — which, for a reader, is then the whole
 * story: "Show more, button, collapsed", and pressing it changes nothing they
 * could not already read. That asymmetry is correct and worth stating, because
 * it is the opposite of a disclosure.
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
  /* Lines of the reader's own text, not a design length — eight ems is about five
     lines at Crystal's reading rhythm, and it follows the font if that changes. */
  children, maxHeight = '8em', showLabel = 'Show more', hideLabel = 'Show less', // crystal-allow-literal: relative to the text, not a design value
  defaultExpanded = false, className, ...props
}: SpoilerProps): ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId();
  /* `accordion-in` as the rest of the content is revealed — never on the render
     that shows it already expanded. Collapsing does not hide the content, it
     cuts it back to its preview, so `accordion-out` — which ends with the
     content gone — has nothing it could honestly end on, and is not played. */
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
