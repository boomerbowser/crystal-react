import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DirectionProvider } from './DirectionProvider.js';

describe('DirectionProvider', () => {
  /* A `dir` attribute is what CSS logical properties read. React Aria calculates
     placement in JavaScript and reads a locale instead, which is why this is a
     component rather than a note telling products to set `dir` themselves. */
  it('sets a real dir attribute on its scope', () => {
    renderWithCrystal(
      <DirectionProvider direction="rtl"><span data-testid="child">x</span></DirectionProvider>,
    );
    expect(screen.getByTestId('child').closest('[dir]')?.getAttribute('dir')).toBe('rtl');
  });
});
