'use client';

/* Title, Display and Lead.
 *
 * The rule the catalogue states twice, for `title` and again for `heading`: **the
 * level is the document outline, and the size is a step of the scale, and the two
 * are chosen separately.** A component where `level={2}` also means "medium" is a
 * component that forces a choice between a correct outline and a correct
 * appearance, and products reliably choose appearance.
 *
 * So `level` picks the element and `step` picks the size, and they default to
 * each other only because a sensible default is not the same as a constraint.
 *
 * `Display` is the largest step and the catalogue is firm about it: **exactly one
 * per view, and it is the `h1` unless the page says otherwise**. That cannot be
 * enforced from inside a component — nothing here can see the rest of the view —
 * so it is said, and `Display` defaults to `h1` rather than making it a choice.
 *
 * `Lead` is the standfirst beneath a title, and is a paragraph. It reads like a
 * heading and is not one; making it an `h2` would put a sentence of marketing
 * copy into the document outline.
 *
 * Gradient text is here rather than as its own component, because it is a
 * treatment of a heading and never of body copy. The contrast floor is what makes
 * it safe: the gradient runs between palette colours that already clear the
 * ratio against the surface, and the solid colour beneath the clip is one of
 * them — so where the clip is unsupported, or forced colours suppress it, the
 * text is still legible rather than transparent.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import type { TypographyStep } from '../../theme/typography.js';
import styles from './Title.module.scss';

/** The steps a heading uses. Body steps belong to `Text`. */
export type TitleStep = Extract<TypographyStep, 'display' | 'title' | 'heading' | 'subheading'>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/* The step a level takes when nothing says otherwise. A default, not a rule: any
   level may take any step, which is the whole point of separating them. */
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
   * Even out the line lengths. On by default — a heading that wraps to a
   * one-word second line is the defect this prevents. Turn it off for a heading
   * whose line breaks are deliberate.
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
