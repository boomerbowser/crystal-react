import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { VariantSelector } from './VariantSelector.js';

const sizes = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large', unavailable: 'Out of stock' },
];

const colours = [
  { value: 'ink', label: 'Ink', swatch: '#171130' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
  { value: 'chalk', label: 'Chalk', swatch: '#ffffff' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
];

describe('VariantSelector', () => {
  /* An unavailable variant stays. A shopper who cannot find the large assumes
     the product does not come in large, and goes somewhere else. */
  it('keeps an unavailable variant and says why', () => {
    renderWithCrystal(<VariantSelector label="Size" variants={sizes} />);
    const large = screen.getByRole('radio', { name: /Large/ });
    expect(large).toBeInTheDocument();
    expect(large).toHaveAccessibleName(/Out of stock/);
    expect(large).toBeDisabled();
  });

  /* A swatch is a circle of colour. Its name is all that anybody who cannot
     separate two similar colours has, and all that a screen reader has. */
  it('names a swatch, because a colour is not a name', () => {
    renderWithCrystal(<VariantSelector label="Colour" variants={colours} shape="swatch" />);
    expect(screen.getByRole('radio', { name: 'Ink' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Chalk' })).toBeInTheDocument();
  });

  it('says why an unavailable swatch cannot be chosen', () => {
    renderWithCrystal(
      <VariantSelector
        label="Colour"
        shape="swatch"
        variants={[{ value: 'ink', label: 'Ink', swatch: '#171130', unavailable: 'Sold out' }]} /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      />,
    );
    expect(screen.getByRole('radio', { name: 'Ink, Sold out' })).toBeDisabled();
  });

  /* "Never a check mark." A check mark means validated or informational in
     Crystal, and never "selected". */
  it('marks the chosen variant with no glyph beside it', () => {
    const { container } = renderWithCrystal(
      <VariantSelector label="Size" variants={sizes} defaultValue="m" />,
    );
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(container.textContent).not.toMatch(/[✓✔√]/);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <>
        <VariantSelector label="Size" variants={sizes} />
        <VariantSelector label="Colour" variants={colours} shape="swatch" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
