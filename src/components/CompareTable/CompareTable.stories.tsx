import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompareTable } from './CompareTable.js';

const meta = {
  title: 'Commerce/Compare table',
  component: CompareTable,
  parameters: {
    docs: {
      description: {
        component:
          '"A real table with row and column headers; **differences are stated in text**", and '
          + '"differences are marked, not only coloured". Those are the same requirement twice, '
          + 'and it is the whole point of a comparison: a reader comparing four products across '
          + 'twelve attributes is looking for the rows where they *differ*. A table that marks '
          + 'those by tinting them has answered the question for people who can see the tint '
          + 'and for nobody else.\n\n'
          + 'The difference is **computed**, not declared. A flag passed in from outside is a '
          + 'claim nobody can check, and it goes stale the moment a product joins the '
          + 'comparison — the same argument the discount badge makes about being handed a '
          + 'percentage.',
      },
    },
  },
  args: {
    label: 'Compare prints',
    products: [
      { id: 'harbour', label: 'Harbour' },
      { id: 'quay', label: 'Quay' },
      { id: 'bridge', label: 'Bridge' },
    ],
    attributes: [
      { id: 'size', label: 'Size', values: ['A2', 'A2', 'A2'] },
      { id: 'frame', label: 'Frame', values: ['Oak', 'Ash', 'Oak'] },
      { id: 'paper', label: 'Paper', values: ['Matte 240gsm', 'Matte 240gsm', 'Matte 240gsm'] },
      { id: 'edition', label: 'Edition', values: ['Open', 'Limited, 50', 'Open'] },
      { id: 'price', label: 'Price', values: ['£39.99', '£64.00', '£39.99'] },
    ],
  },
} satisfies Meta<typeof CompareTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With the matching rows saying so too. Off by default: a table where every
 *  row carries a word is a table where the word has stopped meaning anything. */
export const SayingBoth: Story = { args: { matchesLabel: 'the same' } };
