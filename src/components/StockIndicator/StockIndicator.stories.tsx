import type { Meta, StoryObj } from '@storybook/react-vite';
import { StockIndicator } from './StockIndicator.js';

const meta = {
  title: 'Commerce/Stock indicator',
  component: StockIndicator,
  parameters: {
    docs: {
      description: {
        component:
          '"**Words carry the state**; status colour reinforces it" — which is `StatusBadge`\'s '
          + 'contract exactly, so this is a `StatusBadge` with the availability vocabulary in '
          + 'front of it rather than a second badge drawing the same well slightly differently. '
          + 'Backorder is `info` rather than `attention`: the item can be bought, it simply '
          + 'arrives later, and the attention colour would report a problem where there is an '
          + 'ordinary outcome. The wording is the product\'s — "Only 2 left" is a merchandising '
          + 'decision, not a design-system one.',
      },
    },
  },
  args: { availability: 'in-stock' },
} satisfies Meta<typeof StockIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All four states. The word is what a reader is told; the ink is the second
 *  signal, and it is never the only one. */
export const EveryState: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <StockIndicator availability="in-stock" />
      <StockIndicator availability="low" />
      <StockIndicator availability="out-of-stock" />
      <StockIndicator availability="backorder" />
    </div>
  ),
};

/** The product's own wording, which is where thresholds live. */
export const TheProductsWords: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <StockIndicator availability="low">Only 2 left</StockIndicator>
      <StockIndicator availability="backorder">Ships in 3 weeks</StockIndicator>
    </div>
  ),
};
