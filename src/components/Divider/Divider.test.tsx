import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Divider } from './Divider.js';

describe('Divider', () => {
  /* The split the catalogue states and that is easy to ship only half of: a rule
     between sections is decoration, and decoration announced as a separator is
     noise; a labelled one names the boundary and is content. */
  it('is decoration when unlabelled and a named separator when labelled', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Divider data-testid="d" />);
    expect(screen.getByTestId('d').getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('separator')).toBeNull();

    rerenderWithCrystal(<Divider label="Archive" data-testid="d" />);
    expect(screen.getByRole('separator', { name: 'Archive' })).toBe(screen.getByTestId('d'));
  });

  /* A screen reader that says "separator" without an orientation leaves the
     reader to assume horizontal. */
  it('declares its orientation when it is vertical', () => {
    renderWithCrystal(<Divider orientation="vertical" data-testid="d" />);
    expect(screen.getByTestId('d').tagName).toBe('HR');
  });

  it('has no accessibility violations either way', async () => {
    const { container } = renderWithCrystal(
      <div><Divider /><Divider label="Archive" /></div>,
    );
    await expectNoAxeViolations(container);
  });
});
