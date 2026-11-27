'use client';

/* DirectionProvider.
 *
 * A scope that declares text direction. It is a `PrismataProvider` underneath and
 * not a second mechanism, because two providers that both own direction would
 * disagree as soon as one was nested inside the other.
 *
 * It adds what CSS cannot do with a bare `dir` attribute. Prismata's own geometry
 * mirrors through logical properties, which need nothing. React Aria's
 * components calculate placement in JavaScript, and that calculation does not
 * read a `dir` attribute. This component passes the direction to both, so
 * products do not have to set `dir` themselves.
 *
 * The catalogue lists what mirrors: bubble corners, selection treatment, range
 * tracks, drawer edges, and everything else with a leading or trailing side.
 * Anything physical by nature, such as a clock face or a musical score, does not
 * mirror.
 */
import type { ReactNode } from 'react';
import { PrismataProvider } from '../../theme/PrismataProvider.js';
import type { PrismataDirection } from '../../theme/types.js';

export interface DirectionProviderProps {
  direction: PrismataDirection;
  /**
   * BCP-47 locale. When given, it also drives formatting and collation. Without
   * it, the direction alone is enough to lay out correctly.
   */
  locale?: string;
  children?: ReactNode;
}

export function DirectionProvider(
  { direction, locale, children }: DirectionProviderProps,
): React.JSX.Element {
  return (
    <PrismataProvider direction={direction} {...(locale ? { locale } : {})}>
      {children}
    </PrismataProvider>
  );
}
