import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Card } from './Card.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

const meta = {
  title: 'Data display/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          /* The figures come from the live tokens instead of being typed into the
             prose, so the documentation cannot drift from the material it describes. */
          `A Haze content fill: ${Number(crystalTokens['material.haze.fill']) * 100}% opaque with a `
          + `${crystalTokens['material.haze.feather']} feathered perimeter. The feather lives on an `
          + 'isolated paint layer, so the edge softens while text, icons and focus rings stay crisp. '
          + 'Card plays no motion. Crystal\'s catalogue assigns it none, and a library must not '
          + 'invent motion the design system did not specify.',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3 style={{ margin: 0 }}>Part of the same material world</h3>
        <p style={{ marginBlock: 'var(--cr-space) 0', color: 'var(--cr-muted)' }}>
          Colour carries through from the material beneath it.
        </p>
      </>
    ),
  },
};

/** Named, so it becomes a region. Unnamed it stays a plain div, because a
 *  landmark without a name is noise in a screen reader's landmark list. */
export const AsRegion: Story = {
  args: { 'aria-label': 'Account summary', children: 'A named region.' },
};

/** Haze inside a Resin frame is a content well, not a floating card. It recesses
 *  into the frame instead of sitting on it. */
export const InsideResin: Story = {
  render: (args) => (
    <div
      className="cr-resin"
      style={{ padding: 'var(--cr-space)' }}
    >
      <Card {...only(args)}>This card sits inside a Resin frame, and is recessed into it.</Card>
    </div>
  ),
};
