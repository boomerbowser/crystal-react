'use client';

/* DirectionProvider.
 *
 * A scope that declares text direction, and it is a `CrystalProvider` underneath
 * rather than a second mechanism — two providers that both claim to own direction
 * would disagree the first time one of them was nested inside the other.
 *
 * What it adds over a bare `dir` attribute is the half that CSS cannot do.
 * Crystal's own geometry mirrors through logical properties, which need nothing;
 * React Aria's components calculate placement in JavaScript, and a calculation
 * does not read a `dir` attribute. So the direction reaches both, which is why
 * this exists as a component instead of a documentation note telling products to
 * set `dir` themselves.
 *
 * What mirrors, from the catalogue: bubble corners, selection treatment, range
 * tracks, drawer edges — everything with a leading or trailing side. What does
 * not: anything physical by nature, such as a clock face or a musical score.
 */
import type { ReactNode } from 'react';
import { CrystalProvider } from '../../theme/CrystalProvider.js';
import type { CrystalDirection } from '../../theme/types.js';

export interface DirectionProviderProps {
  direction: CrystalDirection;
  /**
   * BCP-47 locale. Given one it also drives formatting and collation; without
   * one, the direction alone is enough to lay out correctly.
   */
  locale?: string;
  children?: ReactNode;
}

export function DirectionProvider(
  { direction, locale, children }: DirectionProviderProps,
): React.JSX.Element {
  return (
    <CrystalProvider direction={direction} {...(locale ? { locale } : {})}>
      {children}
    </CrystalProvider>
  );
}
