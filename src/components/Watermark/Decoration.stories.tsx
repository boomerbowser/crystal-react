import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Watermark } from './Watermark.js';
import { QRCode } from '../QRCode/QRCode.js';
import { Masonry } from '../Masonry/Masonry.js';
import { OverflowList } from '../OverflowList/OverflowList.js';
import { AnimateOnScroll } from '../AnimateOnScroll/AnimateOnScroll.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Utility/Marks and lists',
  component: Watermark,
  parameters: {
    docs: {
      description: {
        component:
          'Watermark is a mask rather than a background image, so the mark takes the surface\'s '
          + 'own ink — a data URI is its own document, and `currentColor` inside one resolves to '
          + 'black regardless of the page around it. Switch to dark mode in the toolbar: the mark '
          + 'follows. Its opacity is clamped, because past a few percent it competes with body '
          + 'text.\n\n'
          + 'QRCode is the one place in this library where a colour is deliberately not a token. '
          + 'A scanner reads luminance, so a palette-tinted code is a decoration that scans in '
          + 'good light and fails in bad. The encoded value is always available as text.\n\n'
          + 'OverflowList measures itself and moves what does not fit into an affordance that '
          + 'names its count. Narrow the window and widen it again — it grows back, which needs '
          + 'the widths to have been recorded while everything was laid out rather than read from '
          + 'a DOM that no longer holds the hidden items.',
      },
    },
  },
  /* Watermark needs a mark; the stories that are about the other components
     simply never render one. */
  args: { text: 'Confidential' },
} satisfies Meta<typeof Watermark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Marked: Story = {
  render: (args) => (
    <Watermark {...only(args)}>
      <Card aria-label="Marked">
        <p>
          The mark repeats across this surface without intercepting a single pointer event, and
          without appearing in the accessibility tree at all.
        </p>
      </Card>
    </Watermark>
  ),
};

export const Code: Story = {
  render: () => (
    <Stack gap="lg">
      <QRCode value="https://example.com/crystal" caption="Scan to open" />
      <QRCode value="00A1FF93B2" alt="Ticket for row F, seat 12" isExpired caption="Expired" />
    </Stack>
  ),
};

export const Packed: Story = {
  render: () => (
    <Masonry columns={3} gap="md">
      {[120, 200, 80, 160, 100, 220, 140].map((height, i) => (
        <Card key={height} aria-label={`Item ${i + 1}`} style={{ minHeight: `${height}px` /* crystal-allow-literal: story heights, so the packing is visible */ }}>
          {height}px
        </Card>
      ))}
    </Masonry>
  ),
};

/** Narrow the window until items drop into the menu, then widen it again. */
export const Overflowing: Story = {
  render: () => (
    <OverflowList
      gap="sm"
      renderOverflow={(_hidden, count) => (
        count > 0 ? <Button variant="quiet">{count} more</Button> : null
      )}
    >
      {['Overview', 'Materials', 'Components', 'Catalogue', 'Icons', 'Tokens', 'Motion'].map((label) => (
        <Button key={label} variant="quiet">{label}</Button>
      ))}
    </OverflowList>
  ),
};

export const OnScroll: Story = {
  render: () => (
    <Stack gap="lg">
      <p>Scroll down. Each card is readable before it animates, never revealed by animating.</p>
      <div style={{ height: '80vh' /* crystal-allow-literal: story spacer, to make scrolling possible */ }} />
      {[1, 2, 3].map((n) => (
        <AnimateOnScroll key={n}>
          <Card aria-label={`Card ${n}`}>Card {n}</Card>
        </AnimateOnScroll>
      ))}
    </Stack>
  ),
};
