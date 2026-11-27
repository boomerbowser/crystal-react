import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { ReducedEffects } from './ReducedEffects.js';
import { usePrismataTheme } from '../../theme/PrismataProvider.js';

function Probe() {
  return <output data-testid="probe">{usePrismataTheme().effects}</output>;
}

describe('ReducedEffects', () => {
  it('switches its subtree to solid equivalents', () => {
    renderWithPrismata(<ReducedEffects><Probe /></ReducedEffects>);
    expect(screen.getByTestId('probe').textContent).toBe('opaque');
  });

  it('leaves the subtree alone when it is turned off', () => {
    renderWithPrismata(<ReducedEffects enabled={false}><Probe /></ReducedEffects>);
    expect(screen.getByTestId('probe').textContent).toBe('full');
  });
});
