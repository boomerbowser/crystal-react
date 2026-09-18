'use client';

/* Text.
 *
 * Body copy and the small runs of text around it, at a step of Crystal's scale.
 *
 * Two things it will not do, both from the catalogue:
 *
 *   - **It is never a heading.** `as` renders `p`, `span`, `div` and the like; a
 *     heading is `Title`, where the level is part of the document outline rather
 *     than a size. The catalogue is explicit that the visual level must not be
 *     chosen independently of the outline, and the way to enforce that is to make
 *     the two separate components.
 *   - **Truncated text keeps its full value.** Clipping with an ellipsis removes
 *     the text from sight and not from the DOM, so a screen reader still reads it
 *     — but a sighted reader loses it, and `title` is what gives them a way back.
 *     It is set from the children when they are a plain string, because that is
 *     the case where it can be done correctly without the caller repeating
 *     themselves.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import type { TypographyStep } from '../../theme/typography.js';
import styles from './Text.module.scss';

/** The steps body text uses. `display`, `title` and `heading` belong to `Title`. */
export type TextStep = Extract<TypographyStep, 'subheading' | 'body' | 'caption'>;

export type TextTone = 'default' | 'muted' | 'on-surface';

/** What `Text` may render as. Deliberately without a heading. */
export type TextElement =
  'p' | 'span' | 'div' | 'small' | 'strong' | 'em' | 'label' | 'dd' | 'dt' | 'figcaption';

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** A step of Crystal's scale. Defaults to `body`, the reading size exactly. */
  step?: TextStep;
  /** Colour role, not a colour. Defaults to the surface's ink. */
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'strong';
  /** Constrain to a comfortable measure — around 68 characters. */
  measure?: boolean;
  /** Clip to one line. The full value stays reachable through `title`. */
  truncate?: boolean;
  /** Line up figures in a column. For tables and numeric lists, not for sentences. */
  tabular?: boolean;
  /**
   * The element. The list is closed on purpose and holds no heading: a heading's
   * level is part of the document outline rather than a size, so it is `Title`.
   */
  as?: TextElement;
  children?: ReactNode;
}

const TONE: Record<TextTone, string | undefined> = {
  default: undefined,
  muted: 'muted',
  'on-surface': 'onSurface',
};

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    step = 'body', tone = 'default', weight = 'regular', measure = false,
    truncate = false, tabular = false, as = 'p',
    className, style, children, title, ...props
  },
  ref,
) {
  /* Widened once, here. Each member of the union types its own ref differently,
     and an intersection of ten ref types accepts nothing. */
  const Element = as as ElementType;
  const toneClass = TONE[tone];
  const scale: CSSProperties = step === 'body' ? {} : {
    '--cr-text-size': `var(--cr-text-${step}-size)`,
    '--cr-text-leading': `var(--cr-text-${step}-leading)`,
    '--cr-text-tracking': `var(--cr-text-${step}-tracking)`,
  } as CSSProperties;

  /* Only when the children are a string: anything else cannot be turned into a
     tooltip without inventing a summary of it. */
  const fullValue = truncate && typeof children === 'string' ? children : undefined;

  return (
    <Element
      {...props}
      ref={ref}
      {...(title ?? fullValue ? { title: title ?? fullValue } : {})}
      className={cx(
        styles['text'],
        toneClass ? styles[toneClass] : undefined,
        styles[`weight${weight[0]!.toUpperCase()}${weight.slice(1)}`],
        measure ? styles['measure'] : undefined,
        truncate ? styles['truncate'] : undefined,
        tabular ? styles['tabular'] : undefined,
        className,
      )}
      style={{ ...scale, ...style }}
    >
      {children}
    </Element>
  );
});
