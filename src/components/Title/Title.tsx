'use client';

/* Title, Display and Lead.
 *
 * The catalogue states this rule twice, for `title` and again for `heading`: the
 * level is the document outline, the size is a step of the scale, and the two are
 * chosen separately. If `level={2}` also meant "medium", products would have to
 * choose between a correct outline and a correct appearance, and they reliably
 * choose appearance.
 *
 * So `level` picks the element and `step` picks the size. Each level has a
 * default step, but any level may take any step.
 *
 * `Display` is the largest step. The catalogue requires exactly one per view, as
 * the `h1` unless the page says otherwise. A component cannot see the rest of the
 * view to enforce that, so it is documented here and `Display` defaults to `h1`.
 *
 * `Lead` is the standfirst beneath a title, and is a paragraph. It reads like a
 * heading, but making it an `h2` would put a sentence of marketing copy into the
 * document outline.
 *
 * Gradient text lives here instead of in its own component, because it is a
 * treatment of a heading and never of body copy. The gradient runs between
 * palette colours that already clear the contrast ratio against the surface, and
 * the solid colour beneath the clip is one of them. Where the clip is unsupported,
 * or forced colours suppress it, the text stays legible.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import type { TypographyStep } from '../../theme/typography.js';
import styles from './Title.module.scss';

/** The steps a heading uses. Body steps belong to `Text`. */
export type TitleStep = Extract<TypographyStep, 'display' | 'title' | 'heading' | 'subheading'>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/* The step a level takes when nothing says otherwise. Any level may take any
   step. */
const STEP_FOR_LEVEL: Record<HeadingLevel, TitleStep> = {
  1: 'display', 2: 'title', 3: 'heading', 4: 'subheading', 5: 'subheading', 6: 'subheading',
};

export interface TitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The document outline position. Chosen from the structure, never from the size. */
  level?: HeadingLevel;
  /** The size. Chosen from the design, never from the structure. */
  step?: TitleStep;
  /** Fill the glyphs with a palette gradient. For a heading, never for body copy. */
  gradient?: boolean;
  /**
   * Even out the line lengths. On by default, so a heading does not wrap to a
   * one-word second line. Turn it off for a heading whose line breaks are
   * deliberate.
   */
  balance?: boolean;
  children?: ReactNode;
}

export const Title = forwardRef<HTMLHeadingElement, TitleProps>(function Title(
  { level = 2, step, gradient = false, balance = true, className, style, children, ...props },
  ref,
) {
  const Heading = `h${level}` as 'h1';
  const resolved = step ?? STEP_FOR_LEVEL[level];
  const scale: CSSProperties = {
    '--cr-title-size': `var(--cr-text-${resolved}-size)`,
    '--cr-title-leading': `var(--cr-text-${resolved}-leading)`,
    '--cr-title-tracking': `var(--cr-text-${resolved}-tracking)`,
  } as CSSProperties;

  return (
    <Heading
      {...props}
      ref={ref}
      className={cx(
        styles['title'],
        gradient ? styles['gradient'] : undefined,
        balance ? undefined : styles['unbalanced'],
        className,
      )}
      style={{ ...scale, ...style }}
    >
      {children}
    </Heading>
  );
});

export type DisplayProps = Omit<TitleProps, 'step'>;

/** The largest step, for the one statement a view makes. One per view. */
export const Display = forwardRef<HTMLHeadingElement, DisplayProps>(function Display(
  { level = 1, ...props },
  ref,
) {
  return <Title {...props} ref={ref} level={level} step="display" />;
});

export interface LeadProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

/** The standfirst beneath a title. A paragraph, never a heading. */
export const Lead = forwardRef<HTMLParagraphElement, LeadProps>(function Lead(
  { className, children, ...props },
  ref,
) {
  return (
    <p {...props} ref={ref} className={cx(styles['lead'], className)}>
      {children}
    </p>
  );
});
