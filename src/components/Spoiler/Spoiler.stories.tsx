import type { Meta, StoryObj } from '@storybook/react-vite';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Spoiler } from './Spoiler.js';

const passage = `Crystal's materials are ordered back to front: Plastic is the foundation, `
  + `Frost the diffused intermediate surface, and Resin the floating optical control plane. `
  + `Haze is the protective content fill a control paints under its label, at eighty per cent `
  + `with a ${crystalTokens['material.haze.feather']} feather on an isolated paint layer, so the edge softens while the text above `
  + `it stays crisp. Stone is the label backing used over artwork, where contrast cannot be `
  + `argued from the palette because the palette is whatever the photograph happens to be. `
  + `Mirage is the modal scrim. Nothing in this list moves at rest.`;

const meta = {
  title: 'Data display/Spoiler',
  component: Spoiler,
  parameters: {
    docs: {
      description: {
        component:
          'Content truncated to a height, with an edge fade and a reveal control. Unlike a '
          + 'disclosure, the hidden part stays in the accessibility tree: a spoiler is a *visual* '
          + 'economy — six paragraphs shown as two so the page stays scannable — and a reader who '
          + 'is not looking at the page has no reason to be given less of it. The fade is a mask on '
          + 'the content rather than a gradient painted over it, so what shows through is whatever '
          + 'material the spoiler is sitting on, in all six palettes.',
      },
    },
  },
  args: { children: passage, defaultExpanded: false },
} satisfies Meta<typeof Spoiler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpenToStart: Story = {
  args: { defaultExpanded: true },
};

/** A taller cut, and wording that says what is being revealed rather than
 *  "more" — which is the one thing a reader out of context cannot use. */
export const NamedControl: Story = {
  args: { maxHeight: '4em', showLabel: 'Read the material hierarchy', hideLabel: 'Collapse the material hierarchy' }, // crystal-allow-literal: lines of the reader's own text, not a design value
};
