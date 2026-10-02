import type { Meta, StoryObj } from '@storybook/react-vite';
import { VariantSelector } from './VariantSelector.js';

const meta = {
  title: 'Commerce/Variant selector',
  component: VariantSelector,
  parameters: {
    docs: {
      description: {
        component:
          '"**Unavailable options stay perceivable and say why**; selection is label weight, '
          + 'never a check mark." An unavailable variant stays in the list. A shopper who '
          + 'cannot find the large assumes the product does not come in large, and goes '
          + 'somewhere else. One who sees "Large — out of stock" knows the product is right '
          + 'and the timing is not.\n\n'
          + 'Two shapes carry selection differently. A pill has a label, so selection is its '
          + 'weight, which is Crystal\'s rule. Weight is typographic instead of chromatic, so '
          + 'selection never rests on colour alone. A swatch has no label to weight, so its '
          + 'pad tints and the colour draws back into it. It never takes an outline, because '
          + 'an outline at an offset is how Crystal draws focus.',
      },
    },
  },
  args: {
    label: 'Size',
    variants: [
      { value: 's', label: 'Small' },
      { value: 'm', label: 'Medium' },
      { value: 'l', label: 'Large', unavailable: 'Out of stock' },
      { value: 'xl', label: 'Extra large' },
    ],
    defaultValue: 'm',
  },
} satisfies Meta<typeof VariantSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Swatches. Each carries its variant's name, which a screen reader reads and
 *  which anybody who cannot separate two similar colours relies on. */
export const Swatches: Story = {
  args: {
    label: 'Colour',
    shape: 'swatch',
    variants: [
      { value: 'ink', label: 'Ink', swatch: '#171130' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      { value: 'chalk', label: 'Chalk', swatch: '#ffffff' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      { value: 'moss', label: 'Moss', swatch: '#3f6d4e' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      { value: 'clay', label: 'Clay', swatch: '#b46a4a' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      { value: 'dusk', label: 'Dusk', swatch: '#5b5f8a', unavailable: 'Sold out' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
    ],
    defaultValue: 'moss',
  },
};

/** The two cases a tinted pad has to survive: a swatch the same colour as the
 *  palette's primary, which the pad is painted in, and a white one on a light
 *  surface. Both keep an edge because the colour carries a hairline inside
 *  itself. Inside, so it stays a colour with an edge and does not become a ring,
 *  which is the shape focus uses. Select each and look. */
export const SwatchesThatFightTheirPad: Story = {
  args: {
    label: 'Colour',
    shape: 'swatch',
    variants: [
      { value: 'primary', label: 'Exactly the palette primary', swatch: 'var(--cr-primary)' },
      { value: 'white', label: 'White', swatch: '#ffffff' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
      { value: 'near', label: 'Nearly the primary', swatch: '#7f4bf2' }, /* crystal-allow-literal: a product's own colour, which is data rather than a design value */
    ],
    defaultValue: 'primary',
  },
};
