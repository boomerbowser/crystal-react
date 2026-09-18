import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ReducedEffects } from './ReducedEffects.js';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';

function Probe() {
  return <output data-testid="probe">{useCrystalTheme().effects}</output>;
}

describe('ReducedEffects', () => {
  it('switches its subtree to solid equivalents', () => {
    renderWithCrystal(<ReducedEffects><Probe /></ReducedEffects>);
    expect(screen.getByTestId('probe').textContent).toBe('opaque');
  });

  it('leaves the subtree alone when it is turned off', () => {
    renderWithCrystal(<ReducedEffects enabled={false}><Probe /></ReducedEffects>);
    expect(screen.getByTestId('probe').textContent).toBe('full');
  });
});
