import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Truncate } from './Truncate.js';

describe('Truncate', () => {
  /* Clamping hides text visually and leaves it in the DOM. Cutting the string
     would remove the text for everyone, including assistive technology. */
  it('keeps the full text in the document', () => {
    renderWithPrismata(<Truncate lines={2}>A long paragraph that will be clamped</Truncate>);
    expect(screen.getByText('A long paragraph that will be clamped')).toBeInTheDocument();
  });

  it('takes its line count as a custom property', () => {
    renderWithPrismata(<Truncate lines={5} data-testid="t">Text</Truncate>);
    const clamp = screen.getByText('Text');
    expect(clamp.style.getPropertyValue('--pr-clamp-lines')).toBe('5');
  });

  /* A control that does nothing still costs a keyboard user a tab stop. jsdom
     lays nothing out, so nothing overflows and no control appears, which matches
     what the component does in a browser when the text fits. */
  it('offers no control when there is nothing to reveal', () => {
    renderWithPrismata(<Truncate>Short</Truncate>);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
