import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Divider } from './Divider.js';

describe('Divider', () => {
  /* The catalogue states both halves of the split. A rule between sections is
     decoration, and decoration announced as a separator is noise. A labelled one
     names the boundary and is content. */
  it('is decoration when unlabelled and a named separator when labelled', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Divider data-testid="d" />);
    expect(screen.getByTestId('d').getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('separator')).toBeNull();

    rerenderWithCrystal(<Divider label="Archive" data-testid="d" />);
    expect(screen.getByRole('separator', { name: 'Archive' })).toBe(screen.getByTestId('d'));
  });

  /* An unlabelled divider is decoration in either orientation, so it stays an
     `hr` and is hidden. There is no separator role to declare an orientation on,
     and a vertical rule is not announced. */
  it('stays decoration when it is vertical and unlabelled', () => {
    renderWithCrystal(<Divider orientation="vertical" data-testid="d" />);
    const rule = screen.getByTestId('d');
    expect(rule.tagName).toBe('HR');
    expect(rule.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('separator')).toBeNull();
  });

  /* A labelled one is content, and a screen reader that says "separator" without
     an orientation leaves the reader to assume horizontal. */
  it('declares its orientation when it announces itself', () => {
    renderWithCrystal(<Divider label="Archive" data-testid="d" />);
    expect(screen.getByTestId('d').getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('has no accessibility violations either way', async () => {
    const { container } = renderWithCrystal(
      <div><Divider /><Divider label="Archive" /></div>,
    );
    await expectNoAxeViolations(container);
  });
});
