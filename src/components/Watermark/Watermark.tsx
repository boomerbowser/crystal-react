'use client';

/* Watermark.
 *
 * A repeating mark laid over content, drawn as a tiled SVG data URI on a
 * pseudo-element. It is decoration in the strict sense: `aria-hidden` by
 * construction, because a pseudo-element is not in the accessibility tree at all,
 * and `pointer-events: none`, because a wash that eats clicks makes the content
 * under it unusable.
 *
 * The opacity is the part that needs care and is why it has a ceiling rather than
 * being a free number. A watermark exists to be noticed and ignored; past a few
 * percent it starts competing with body text, and text that has to be read
 * through a pattern is text whose contrast ratio no longer means what it says.
 * The default is 6% and the prop is clamped.
 *
 * The mark is rotated because an axis-aligned repeat reads as a background
 * texture rather than as a mark, and a rotated one is also harder to crop out of
 * a screenshot — which is usually why a watermark is there.
 *
 * The tile is a **mask**, not a background image. A data URI is its own document,
 * so `currentColor` inside one resolves to black no matter what the page around
 * it is doing — a black mark on a dark surface. Masking a `currentColor` fill
 * makes the mark take the surface's own ink in every palette and both modes.
 */
import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Watermark.module.scss';

/* Past this the mark competes with body text. It is a contrast decision, not a
   taste one, so it is a ceiling rather than a suggestion. */
const MAX_OPACITY = 0.12;

export interface WatermarkProps extends HTMLAttributes<HTMLDivElement> {
  /** The text to repeat. */
  text: string;
  /** How faint. Defaults to 0.06 and is clamped to 0.12. */
  opacity?: number;
  /** Size of one tile in px. Larger is sparser. */
  tile?: number;
  /** Degrees the mark is rotated within its tile. */
  angle?: number;
  children?: ReactNode;
}

export const Watermark = function Watermark({
  text, opacity = 0.06, tile = 180, angle = -24, className, style, children, ...props
}: WatermarkProps): React.JSX.Element {
  const image = useMemo(() => {
    /* Built as an SVG data URI rather than a repeated DOM node: one tiled
       background paints at any size without adding hundreds of elements to the
       tree for a screen reader to skip past. */
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}">`
      + `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" `
      + `transform="rotate(${angle} ${tile / 2} ${tile / 2})" `
      /* Solid black in the mask's own document; the mask turns it into coverage,
         and the surface's ink is what actually paints. */
      /* Opaque in the mask's own document, which is coverage rather than colour:
         the mask turns it into where the ink paints, and the ink is the
         surface's. */
      + `font-family="system-ui, sans-serif" font-size="16" fill="#000">`  // crystal-allow-literal: mask coverage, not a colour
      + text.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`)
      + '</text></svg>';
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [text, tile, angle]);

  const mark: CSSProperties = {
    '--cr-watermark-image': image,
    '--cr-watermark-size': `${tile}px`,
    '--cr-watermark-opacity': Math.min(MAX_OPACITY, Math.max(0, opacity)),
    ...style,
  } as CSSProperties;

  return (
    <div {...props} className={cx(styles['watermark'], className)} style={mark}>
      {children}
    </div>
  );
};
