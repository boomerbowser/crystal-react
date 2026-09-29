import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ProductDetailBlock } from './ProductDetailBlock.js';
import { DeliveryEstimate } from '../DeliveryEstimate/DeliveryEstimate.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const tile = (label: string, colour: string) => (
  <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', background: colour, borderRadius: 'inherit' }}>{label}</div>
);

const meta = {
  title: 'Blocks/ProductDetailBlock',
  component: ProductDetailBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Variant changes update price and stock together, and say so."\n\n'
          + 'A variant carries its own price and availability, so choosing one changes both in the '
          + 'same render, and the change is said as one sentence — "Rust: £26.00, low stock". Not on '
          + 'load: the first variant was shown, not chosen. A variant that is out of stock makes the '
          + 'purchase control say so and refuse, from the variant itself.',
      },
    },
  },
  args: {
    name: 'Enamel mug',
    nameText: 'Enamel mug',
    description: 'A steel mug with a glass enamel coat, fired twice. Holds 350ml.',
    media: [
      { id: 'front', alt: 'The mug from the front', thumbnail: tile('Front', 'var(--cr-primary-soft)') },
      { id: 'side', alt: 'The mug from the side', thumbnail: tile('Side', 'var(--cr-surface-alt)') },
    ],
    variantLabel: 'Colour',
    variants: [
      { value: 'slate', label: 'Slate', price: gbp(24), availability: 'in-stock' },
      { value: 'rust', label: 'Rust', price: gbp(26), availability: 'low' },
      { value: 'sand', label: 'Sand', price: gbp(24), availability: 'out-of-stock' },
    ],
    onAddToCart: fn(),
  },
} satisfies Meta<typeof ProductDetailBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Unavailable: Story = { args: { defaultValue: 'sand' } };
export const Adding: Story = { args: { isAdding: true } };
/** With what a product page usually adds under the action. */
export const WithDelivery: Story = {
  args: { children: <DeliveryEstimate on={new Date(2026, 9, 1)} /> },
};
