'use client';

/* ReducedEffects.
 *
 * The scope that replaces translucency and diffusion with solid equivalents. The
 * geometry never changes: shapes, silhouettes and spacing are identical with
 * effects on or off, and the hierarchy survives as tone and contour instead of
 * as depth. This keeps a reduced-effects page recognisably Crystal.
 *
 * The system's own preference is honoured without this component. `CrystalProvider`
 * reads `prefers-reduced-transparency` and `forced-colors` and switches on its
 * own, because a product that never thought about the setting still has to
 * respect it. This component is for the other case the catalogue names: an
 * explicit product preference, such as a toggle in a settings page.
 *
 * It can only reduce. `enabled={false}` inside a system that is asking for
 * reduced transparency does not restore the diffusion, because a product
 * preference does not overrule an accessibility setting.
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
