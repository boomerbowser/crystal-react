import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortSelect } from './SortSelect.js';

const meta = {
  title: 'Commerce/Sort select',
  component: SortSelect,
  parameters: {
    docs: {
      description: {
        component:
          '"A select whose current ordering is announced on change." A sort control '
          + 'silently rewrites a list the reader is not looking at. A sighted reader sees the '
          + 'list flip and knows it worked. A screen reader user hears the select close and then '
          + 'nothing, and has to navigate back into the list to find out whether anything '
          + 'happened. The select announces its own value, which does not tell the reader that '
          + 'the list beneath them has been reordered.\n\n'
          + 'Everything else is `Select`. The materials, the trigger geometry, the listbox and '
          + 'the keyboard behaviour already exist there, and a second select drawing its own '
          + 'would have to be kept in step.',
      },
    },
  },
  args: {
    options: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price-asc', label: 'Price, lowest first' },
      { value: 'price-desc', label: 'Price, highest first' },
      { value: 'newest', label: 'Newest' },
    ],
    defaultSelectedKey: 'relevance',
  },
} satisfies Meta<typeof SortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The label is what is being ordered, and it is a prop because "Sort by" is not
 *  right on every page. */
export const NamedForWhatItOrders: Story = {
  args: {
    label: 'Order the photographs by',
    options: [
      { value: 'taken', label: 'When it was taken' },
      { value: 'added', label: 'When it was added' },
    ],
    defaultSelectedKey: 'taken',
  },
};
