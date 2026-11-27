import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { VisuallyHidden } from './VisuallyHidden.js';

describe('VisuallyHidden', () => {
  /* Available to assistive technology, absent from sight. `display: none` would
     remove it from the accessibility tree too. */
  it('stays in the accessibility tree', () => {
    renderWithPrismata(<VisuallyHidden>Loading complete</VisuallyHidden>);
    const hidden = screen.getByText('Loading complete');
    expect(hidden).toBeInTheDocument();
    expect(hidden.style.display).not.toBe('none');
    expect(hidden.getAttribute('aria-hidden')).toBeNull();
  });

  it('renders the element it is asked for', () => {
    renderWithPrismata(<VisuallyHidden as="div" data-testid="v">x</VisuallyHidden>);
    expect(screen.getByTestId('v').tagName).toBe('DIV');
  });
});
