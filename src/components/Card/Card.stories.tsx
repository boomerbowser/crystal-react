import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.js';

const meta = {
  title: 'Data display/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'A Haze content fill: 80% opaque with a 1.95px feathered perimeter. The feather lives '
          + 'on an isolated paint layer, so the edge softens while text, icons and focus rings stay '
          + 'crisp. Card plays no motion — Crystal\'s catalogue assigns it none, and a library must '
          + 'not invent motion the design system did not specify.',
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
        <p style={{ margin: '8px 0 0', color: 'var(--cr-muted)' }}>
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

/** Haze inside a Resin frame is a content well, not a floating card: it recesses
 *  into the frame rather than sitting on it. */
export const InsideResin: Story = {
  render: () => (
    <div
      className="cr-resin"
      style={{ padding: 'var(--cr-space)', borderRadius: 'calc(var(--cr-radius) + 6px)' }}
    >
      <Card>This card sits inside a Resin frame, and is recessed into it.</Card>
    </div>
  ),
};
