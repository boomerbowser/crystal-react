'use client';

/* ReducedEffects.
 *
 * The scope that replaces translucency and diffusion with solid equivalents. The
 * geometry never changes: shapes, silhouettes and spacing are identical with
 * effects on or off, and the hierarchy survives as tone and contour instead of
 * as depth. That is the guarantee, and it is the reason a reduced-effects page is
 * still recognisably Crystal rather than a flat approximation of it.
 *
 * The system's own preference is honoured without this component. `CrystalProvider`
 * reads `prefers-reduced-transparency` and `forced-colors` and switches on its
 * own, because a product that never thought about the setting still has to
 * respect it. This exists for the other half the catalogue names: **an explicit
 * product preference**, a toggle somebody can find in a settings page.
 *
 * It can only ever reduce. `enabled={false}` inside a system that is asking for
 * reduced transparency does not restore the diffusion — a product preference does
 * not get to overrule an accessibility setting.
 */
import type { ReactNode } from 'react';
import { CrystalProvider } from '../../theme/CrystalProvider.js';

export interface ReducedEffectsProps {
  /** Whether the subtree uses solid equivalents. Defaults to true. */
  enabled?: boolean;
  children?: ReactNode;
}

export function ReducedEffects({ enabled = true, children }: ReducedEffectsProps): React.JSX.Element {
  return (
    <CrystalProvider effects={enabled ? 'opaque' : 'full'}>
      {children}
    </CrystalProvider>
  );
}
