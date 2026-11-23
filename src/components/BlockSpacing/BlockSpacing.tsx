'use client';

/* BlockSpacing: sets the padding and the gap of every block and commerce card
 * inside it, from Crystal's spacing scale.
 *
 * Blocks and the commerce cards read their padding from `--cr-block-padding`
 * and the space between their parts from `--cr-block-gap`, each falling back
 * to the block's own default. This component sets the two properties, so a
 * product can open a page's blocks up or pack them tight without overriding
 * their stylesheets. It draws nothing: it is `display: contents`, so it adds no
 * box to the layout and the blocks inside it lay out as if it were not there.
 *
 * A card that wears an inset Haze fill (`ProductCard`, `CartItem`, the
 * summaries) adds the fill's 8px inset to the padding, so the space between
 * the words and the visible edge of the fill is the step that was asked for.
 *
 * The properties can also be set directly, on any element:
 * `style={{ '--cr-block-padding': 'var(--cr-spacing-lg)' }}`.
 */
import type { CSSProperties, ReactNode } from 'react';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';

export interface BlockSpacingProps {
  /** The padding inside each block and card. */
  padding?: CrystalSpacing;
  /** The space between the parts of each block and card. */
  gap?: CrystalSpacing;
  children?: ReactNode;
}

export function BlockSpacing({ padding, gap, children }: BlockSpacingProps): React.JSX.Element {
  const style = {
    display: 'contents',
    ...(padding !== undefined ? { '--cr-block-padding': spacingValue(padding) } : {}),
    ...(gap !== undefined ? { '--cr-block-gap': spacingValue(gap) } : {}),
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}
