import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortSelect } from './SortSelect.js';

const meta = {
  title: 'Commerce/Sort select',
  component: SortSelect,
  parameters: {
    docs: {
      description: {
        component:
          '"A select whose current ordering is **announced on change**." That sentence exists '
          + 'because of what a sort control does to the page around it: it silently rewrites a '
          + 'list the reader is not looking at. A sighted reader sees the list flip and knows '
          + 'it worked; a reader using a screen reader hears the select close and then nothing, '
          + 'and has to navigate back into the list to find out whether anything happened. The '
          + 'select announces its own value, but a select\'s value and "the list beneath you '
          + 'has been reordered" are not the same statement.\n\n'
          + 'Everything else is `Select`, deliberately: the materials, the trigger geometry, '
          + 'the listbox and the keyboard behaviour all exist, and a second select drawing its '
          + 'own would be a second select to keep in step.',
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
