import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { BlockSpacing } from './BlockSpacing.js';
import { PricingBlock } from '../PricingBlock/PricingBlock.js';
import { ProductCard } from '../ProductCard/ProductCard.js';
import PricingStories from '../PricingBlock/PricingBlock.stories.js';
import CardStories from '../ProductCard/ProductCard.stories.js';

const meta = {
  title: 'Blocks/Spacing',
  component: BlockSpacing,
  parameters: {
    docs: {
      description: {
        component:
          'Every block and commerce card reads its padding from `--pr-block-padding` and the space '
          + 'between its parts from `--pr-block-gap`, falling back to its own defaults. '
          + '`BlockSpacing` sets both from Prismata\'s spacing scale for everything inside it, and '
          + 'adds no box of its own. Cards with an inset Haze fill add the inset of the fill, so the space '
          + 'between the words and the visible fill is the step asked for.',
      },
    },
  },
  args: { padding: 'lg', gap: 'md' },
  argTypes: {
    padding: { control: 'select', options: ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    gap: { control: 'select', options: ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
} satisfies Meta<typeof BlockSpacing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A pricing block and a product card, with the controls setting both. */
export const Controlled: Story = {
  render: (args) => (
    <BlockSpacing {...only(args)}>
      <div style={{ display: 'grid', gap: 'var(--pr-spacing-xl)' }}>
        <PricingBlock {...(PricingStories.args as unknown as Parameters<typeof PricingBlock>[0])} />
        <div style={{ maxInlineSize: 320 }}>
          <ProductCard {...(CardStories.args as unknown as React.ComponentProps<typeof ProductCard>)} />
        </div>
      </div>
    </BlockSpacing>
  ),
};

/** Packed tight, for a dense dashboard. */
export const Compact: Story = { ...Controlled, args: { padding: 'sm', gap: 'xs' } };

/** Opened up, for a marketing page. */
export const Spacious: Story = { ...Controlled, args: { padding: 'xl', gap: 'lg' } };
