import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Truncate } from './Truncate.js';

describe('Truncate', () => {
  /* Clamping hides text visually and leaves it in the DOM, which is exactly why
     it is used rather than cutting the string: a cut string is gone for everyone. */
  it('keeps the full text in the document', () => {
    renderWithCrystal(<Truncate lines={2}>A long paragraph that will be clamped</Truncate>);
    expect(screen.getByText('A long paragraph that will be clamped')).toBeInTheDocument();
  });

  it('takes its line count as a custom property', () => {
    renderWithCrystal(<Truncate lines={5} data-testid="t">Text</Truncate>);
    const clamp = screen.getByText('Text');
    expect(clamp.style.getPropertyValue('--cr-clamp-lines')).toBe('5');
  });

  /* A control that does nothing still costs a keyboard user a tab stop to find
     that out. jsdom lays nothing out, so nothing overflows and none appears —
     which is the same decision the component makes in a browser. */
  it('offers no control when there is nothing to reveal', () => {
    renderWithCrystal(<Truncate>Short</Truncate>);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
