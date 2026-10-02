import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Watermark } from './Watermark.js';

describe('Watermark', () => {
  it('has no accessibility violations and does not announce the mark', async () => {
    const { container } = renderWithCrystal(
      <Watermark text="Confidential"><p>Body text</p></Watermark>,
    );
    /* The mark is a pseudo-element, so it is not in the accessibility tree at
       all. There is nothing to hide and nothing to read. */
    expect(screen.queryByText('Confidential')).toBeNull();
    await expectNoAxeViolations(container);
  });

  /* Past a few percent the mark competes with body text, and the contrast ratio
     of text read through a pattern is no longer accurate. The limit is enforced. */
  it('clamps the opacity rather than trusting the caller', () => {
    renderWithCrystal(<Watermark text="Draft" opacity={0.9} data-testid="w">x</Watermark>);
    const value = Number(screen.getByTestId('w').style.getPropertyValue('--cr-watermark-opacity'));
    expect(value).toBeLessThanOrEqual(0.12);
  });

  it('escapes the mark text rather than injecting it into the SVG', () => {
    renderWithCrystal(<Watermark text={'<script>x</script>'} data-testid="w">x</Watermark>);
    const image = screen.getByTestId('w').style.getPropertyValue('--cr-watermark-image');
    expect(decodeURIComponent(image)).not.toContain('<script>');
  });
});
