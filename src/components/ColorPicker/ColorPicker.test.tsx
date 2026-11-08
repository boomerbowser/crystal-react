import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };
import { parseColor } from 'react-aria-components';
import { ColorArea, ColorInput, ColorSwatch, ColorSwatchPicker, ColorSlider } from './ColorPicker.js';

/* Crystal's own seeds instead of typed hexes. A literal in a colour test is
   still a value that can drift from the palette it came from. */
const palettes = (crystalFlat as unknown as { palettes: Record<string, { seed: string }> }).palettes;
const PRISM = palettes['prism']!.seed;
const HARBOR = palettes['harbor']!.seed;
const css = (hex: string): string => parseColor(hex).toString('css');

/* Each swatch's colour is the `--cr-swatch` its chequerboard draws on top. */
const swatchColours = (root: ParentNode): string[] =>
  [...root.querySelectorAll<HTMLElement>('[style]')]
    .map((el) => el.style.getPropertyValue('--cr-swatch'))
    .filter(Boolean);

describe('ColorInput', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<ColorInput label="Brand" defaultValue={PRISM} />);
    await expectNoAxeViolations(container);
  });

  /* A picker that can only be pointed at is unusable without a pointer, and
     unusable for anybody who already knows the hex they want. */
  it('keeps the text value editable', () => {
    renderWithCrystal(<ColorInput label="Brand" defaultValue={PRISM} />);
    const field = screen.getByRole('textbox', { name: 'Brand' }) as HTMLInputElement;
    expect(field).not.toBeDisabled();
    expect(field.readOnly).toBe(false);
    expect(field.value).toBeTruthy();
  });

  /* A colour field gives its swatch no colour; the input hands it the value,
     so the swatch beside the hex is the colour the hex names. */
  it('shows its colour in the swatch', () => {
    const { container } = renderWithCrystal(<ColorInput label="Brand" defaultValue={PRISM} />);
    expect(swatchColours(container)).toEqual([css(PRISM)]);
  });
});

describe('ColorSwatch', () => {
  /* Colour cannot be the only carrier, so the name is content beside it, not a
     tooltip or a title. */
  it('carries the colour name as text', () => {
    renderWithCrystal(<ColorSwatch color={PRISM} name="Prism violet" />);
    expect(screen.getByText('Prism violet')).toBeInTheDocument();
  });
});

describe('ColorSwatchPicker', () => {
  /* The name, not the hex. Nobody recognises "#7338EF" as a colour. */
  it('announces each swatch by name', () => {
    renderWithCrystal(
      <ColorSwatchPicker
        label="Palette"
        colors={[{ value: PRISM, name: 'Prism' }, { value: HARBOR, name: 'Harbor' }]}
      />,
    );
    expect(screen.getByRole('option', { name: 'Prism' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Harbor' })).toBeInTheDocument();
  });

  /* Each option is filled with its colour. */
  it('fills each option with its colour', () => {
    const { container } = renderWithCrystal(
      <ColorSwatchPicker
        label="Palette"
        colors={[{ value: PRISM, name: 'Prism' }, { value: HARBOR, name: 'Harbor' }]}
      />,
    );
    expect(swatchColours(container)).toEqual([css(PRISM), css(HARBOR)]);
  });
});

describe('the Resin thumb (R-A10)', () => {
  /* The catalogue's "Resin thumb": the thumb wears `.cr-resin`, and the picked
     colour moves from its background to the disc inside it, so the Resin fill
     is not covered. */
  it('wears Resin and keeps the picked colour in its disc', () => {
    const { container } = renderWithCrystal(<ColorArea defaultValue={PRISM} />);
    const thumb = container.querySelector<HTMLElement>('.cr-resin')!;
    expect(thumb).not.toBeNull();
    expect(thumb.style.backgroundColor).toBe('');
    expect(thumb.style.getPropertyValue('--cr-picked')).toBeTruthy();
    expect(thumb.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('ColorSlider', () => {
  /* Standalone as well as inside a picker. The catalogue lists it as its own
     component, and React Aria throws without a value when there is no picker
     above to inherit one from. */
  /* `#7338EF` is RGB and has no hue channel, so a hue slider handed a hex would
     throw. Most colours are written as hex, so the conversion happens in the
     component and not at every call site. */
  it('takes a hex for a channel that hex does not have', () => {
    renderWithCrystal(<ColorSlider channel="hue" label="Hue" defaultValue={PRISM} />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuetext') ?? slider.getAttribute('aria-label') ?? '').toBeTruthy();
  });
});
