'use client';

/* Stack and Group.
 *
 * Crystal's catalogue treats these as two components (a vertical arrangement
 * with one spacing value, and a horizontal one with wrapping and alignment). They
 * are two exports here because that is the vocabulary a product reads. They
 * share an implementation because they are the same box turned ninety degrees,
 * and two copies of it would drift the first time either grew a feature.
 *
 * Both are presentational, as the catalogue states. A layout component that
 * introduces a landmark or a list role tells assistive technology about a
 * grouping that exists only visually. `as` lets a product render the right
 * element when the grouping is real, such as a `ul` or a `nav`, rather than
 * nesting a meaningful element inside a meaningless div.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';
import styles from './Stack.module.scss';

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

const ALIGN: Record<Align, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline',
};
const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around',
};

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** Space between children, from Crystal's scale. Defaults to `md`. */
  gap?: CrystalSpacing;
  align?: Align;
  justify?: Justify;
  /** The element to render. Presentational by default; pass a real one when the grouping is real. */
  as?: ElementType;
  children?: ReactNode;
}

export interface GroupProps extends StackProps {
  /** Whether children wrap onto another line. Defaults to true, because a horizontal row that cannot wrap overflows. */
  wrap?: boolean;
}

function arrange(
  { gap, align, justify, as: Element = 'div', className, style, children, ...props }: StackProps,
  direction: 'vertical' | 'horizontal',
  wrap: boolean,
  ref: React.Ref<HTMLElement>,
): React.JSX.Element {
  const layout: CSSProperties = {
    ...(gap !== undefined ? { '--cr-stack-gap': spacingValue(gap) } as CSSProperties : {}),
    ...(align ? { alignItems: ALIGN[align] } : {}),
    ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
    ...style,
  };

  return (
    <Element
      {...props}
      ref={ref}
      className={cx(styles['stack'], styles[direction], wrap ? styles['wrap'] : undefined, className)}
      style={layout}
    >
      {children}
    </Element>
  );
}

/** A vertical arrangement with one spacing value between children. */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(props, ref) {
  return arrange(props, 'vertical', false, ref);
});

/** A horizontal arrangement that wraps, with alignment control. */
export const Group = forwardRef<HTMLElement, GroupProps>(function Group({ wrap = true, ...props }, ref) {
  return arrange(props, 'horizontal', wrap, ref);
});
