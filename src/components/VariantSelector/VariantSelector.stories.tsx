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
          + 'never a check mark." Removing an unavailable variant is the obvious thing and it '
          + 'is wrong: a shopper who cannot find the large sees a product that does not come '
          + 'in large, and goes somewhere else. One who sees "Large — out of stock" knows the '
          + 'product is right and the timing is not. Same information, and only one of them '
          + 'tells the reader anything.\n\n'
          + 'Two shapes carry selection differently. A pill has a label, so selection is its '
          + 'weight — Crystal\'s rule, and the reason it is weight is that weight is '
          + 'typographic rather than chromatic and so never rests on colour alone. A swatch '
          + 'has no label to weight, so it takes the one thing a labelless option has: its '
          + 'pad tints and the colour draws back into it. Never an outline — an outline at an '
          + 'offset is how Crystal draws focus.',
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

/** Swatches. Each carries its variant's name, which is what a screen reader
 *  reads and what anybody who cannot separate two similar colours has instead. */
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
 *  surface. Both keep an edge because the colour carries a hairline *inside*
 *  itself — inside, so it stays a colour with an edge rather than becoming a
 *  ring, which is the shape focus owns. Select each and look. */
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
