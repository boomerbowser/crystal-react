import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrismataProvider } from './PrismataProvider.js';
import { useTypography } from './typography.js';
import { prismataTokens } from './tokens.generated.js';

function Probe() {
  const typography = useTypography();
  return <output data-testid="t">{JSON.stringify(typography.steps)}</output>;
}
const read = () => JSON.parse(screen.getByTestId('t').textContent ?? '{}');

describe('useTypography', () => {
  it('sets body to Prismata reading size exactly', () => {
    render(<PrismataProvider><Probe /></PrismataProvider>);
    expect(read().body.fontSize).toBe(prismataTokens['typography.readingSize']);
  });

  /* The scale is derived from the reading size, so moving that token upstream
     moves every step. Six hard-coded sizes would be six values that can no
     longer be changed centrally. */
  it('derives every step from the reading size', () => {
    render(<PrismataProvider><Probe /></PrismataProvider>);
    const steps = read();
    const base = Number.parseFloat(prismataTokens['typography.readingSize']);
    expect(Number.parseFloat(steps.display.fontSize)).toBe(base * 2);
    expect(Number.parseFloat(steps.caption.fontSize)).toBeLessThan(base);
    expect(Number.parseFloat(steps.title.fontSize)).toBeGreaterThan(base);
  });

  /* Density tightens spacing, never size: shrinking text at higher density would
     trade legibility for space, which Prismata does not do. */
  it('tightens leading at compact density without changing any size', () => {
    const { rerender } = render(<PrismataProvider><Probe /></PrismataProvider>);
    const comfortable = read();
    rerender(<PrismataProvider density="compact"><Probe /></PrismataProvider>);
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
    render(<PrismataProvider><FamilyProbe /></PrismataProvider>);
    expect(screen.getByTestId('f').textContent).toBe(prismataTokens['typography.family']);
  });
});
