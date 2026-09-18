import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrystalProvider } from './CrystalProvider.js';
import { useTypography } from './typography.js';
import { crystalTokens } from './tokens.generated.js';

function Probe() {
  const typography = useTypography();
  return <output data-testid="t">{JSON.stringify(typography.steps)}</output>;
}
const read = () => JSON.parse(screen.getByTestId('t').textContent ?? '{}');

describe('useTypography', () => {
  it('sets body to Crystal reading size exactly', () => {
    render(<CrystalProvider><Probe /></CrystalProvider>);
    expect(read().body.fontSize).toBe(crystalTokens['typography.readingSize']);
  });

  /* The scale is derived from the reading size, so moving that token upstream
     moves every step. Six hard-coded sizes would be six values that can no
     longer be changed centrally. */
  it('derives every step from the reading size', () => {
    render(<CrystalProvider><Probe /></CrystalProvider>);
    const steps = read();
    const base = Number.parseFloat(crystalTokens['typography.readingSize']);
    expect(Number.parseFloat(steps.display.fontSize)).toBe(base * 2);
    expect(Number.parseFloat(steps.caption.fontSize)).toBeLessThan(base);
    expect(Number.parseFloat(steps.title.fontSize)).toBeGreaterThan(base);
  });

  /* Density tightens spacing, never size: shrinking text at higher density would
     trade legibility for space, which Crystal does not do. */
  it('tightens leading at compact density without changing any size', () => {
    const { rerender } = render(<CrystalProvider><Probe /></CrystalProvider>);
    const comfortable = read();
    rerender(<CrystalProvider density="compact"><Probe /></CrystalProvider>);
    const compact = read();

    expect(compact.body.fontSize).toBe(comfortable.body.fontSize);
    expect(compact.display.fontSize).toBe(comfortable.display.fontSize);
    expect(Number(compact.body.lineHeight)).toBeLessThan(Number(comfortable.body.lineHeight));
  });

  it('reports the family from the token rather than a literal', () => {
    function FamilyProbe() {
      const { family } = useTypography();
      return <output data-testid="f">{family}</output>;
    }
    render(<CrystalProvider><FamilyProbe /></CrystalProvider>);
    expect(screen.getByTestId('f').textContent).toBe(crystalTokens['typography.family']);
  });
});
