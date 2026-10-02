import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { VisuallyHidden } from './VisuallyHidden.js';

describe('VisuallyHidden', () => {
  /* Available to assistive technology, absent from sight. `display: none` would
     remove it from the accessibility tree too. */
  it('stays in the accessibility tree', () => {
    renderWithCrystal(<VisuallyHidden>Loading complete</VisuallyHidden>);
    const hidden = screen.getByText('Loading complete');
    expect(hidden).toBeInTheDocument();
    expect(hidden.style.display).not.toBe('none');
    expect(hidden.getAttribute('aria-hidden')).toBeNull();
  });

  it('renders the element it is asked for', () => {
    renderWithCrystal(<VisuallyHidden as="div" data-testid="v">x</VisuallyHidden>);
    expect(screen.getByTestId('v').tagName).toBe('DIV');
  });
});
