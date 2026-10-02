import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Loader } from './Loader.js';

describe('Loader', () => {
  /* "Accompanied by text saying what is loading." A bare spinner tells a
     sighted reader that something is happening and everyone else nothing. Even
     for a sighted reader, "is this stuck, and on what" is the real question. */
  it('says what is loading', () => {
    renderWithCrystal(<Loader label="Loading invoices" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading invoices');
  });

  /* Announced even when it is not drawn. Words hidden from the screen are
     still read to a screen reader user. */
  it('keeps the words when they are hidden', () => {
    renderWithCrystal(<Loader label="Loading invoices" hideLabel />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading invoices');
  });

  /* There is no range and no position, so it is not a progressbar. A
     progressbar without either has to be explained. */
  it('is a status, not a progressbar', () => {
    renderWithCrystal(<Loader label="Loading" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  /* Sizes on Crystal's 4px rhythm, drawn as the same object a ring progress
     is. */
  it('draws the mark at the size it was asked for', () => {
    const { container, rerender } = renderWithCrystal(<Loader label="Loading" size="small" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '16');
    rerender(<Loader label="Loading" size="large" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '40');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Loader label="Loading invoices" />);
    await expectNoAxeViolations(container);
  });
});
