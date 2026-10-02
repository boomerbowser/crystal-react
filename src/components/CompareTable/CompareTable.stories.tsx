import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompareTable } from './CompareTable.js';

const meta = {
  title: 'Commerce/Compare table',
  component: CompareTable,
  parameters: {
    docs: {
      description: {
        component:
          '"A real table with row and column headers; differences are stated in text", and '
          + '"differences are marked, not only coloured". Both state one requirement. A reader '
          + 'comparing four products across twelve attributes is looking for the rows where '
          + 'they differ. A table that marks those only by tint works only for people who can '
          + 'see the tint.\n\n'
          + 'The difference is computed from the values. A flag passed in from outside cannot '
          + 'be checked, and it goes stale as soon as a product joins the comparison. The '
          + 'discount badge makes the same argument about being handed a percentage.',
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

/** With the matching rows saying so too. Off by default, because when every
 *  row carries a word the word no longer stands out. */
export const SayingBoth: Story = { args: { matchesLabel: 'the same' } };
