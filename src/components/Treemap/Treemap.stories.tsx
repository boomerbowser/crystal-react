import type { Meta, StoryObj } from '@storybook/react-vite';
import { Treemap } from './Treemap.js';

const meta = {
  title: 'Charts/Treemap',
  component: Treemap,
  parameters: {
    docs: {
      description: {
        component:
          '"Navigable as a tree, with each node stating its share." Navigable as a tree is the '
          + 'demanding half: the map shows one level at a time, `Enter` descends into a node '
          + 'with children, `Escape` comes back up, and a breadcrumb says where you are. '
          + 'Drawing every depth at once is the usual implementation and it is not navigation — '
          + 'it is a picture of a tree, and a reader who cannot see it is given a flat list of '
          + 'leaves with no idea which branch they are on.\n\n'
          + '"Each node states its share" of its parent *and* of the whole, because in a nested '
          + 'structure those are different numbers: a node deep in a branch can be most of its '
          + 'parent and almost none of the total.\n\n'
          + '"Labels drop out rather than overflow" — a label that does not fit is not drawn, '
          + 'never truncated to an ellipsis and never allowed to spill over the rectangle '
          + 'beside it. The name is on the mark and in the table either way.',
      },
    },
  },
  args: {
    label: 'Spend by team',
    description: 'Last quarter, in thousands',
    rootLabel: 'All spend',
    root: {
      name: 'Spend',
      children: [
        {
          name: 'Engineering',
          children: [
            { name: 'Salaries', value: 620 },
            { name: 'Hosting', value: 180 },
            { name: 'Tooling', value: 74 },
          ],
        },
        {
          name: 'Sales',
          children: [
            { name: 'Salaries', value: 310 },
            { name: 'Commission', value: 140 },
            { name: 'Travel', value: 62 },
          ],
        },
        {
          name: 'Operations',
          children: [
            { name: 'Office', value: 96 },
            { name: 'Legal', value: 54 },
            { name: 'Insurance', value: 28 },
          ],
        },
      ],
    },
    format: (value: number) => `£${value}k`,
  },
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The top level. Click or press Enter on a branch to descend. */
export const Default: Story = {};

/** One level deep, where every node is a leaf and there is nothing to descend
 *  into — the breadcrumb is then the only way the level is stated. */
export const Flat: Story = {
  args: {
    label: 'Spend by category',
    root: {
      name: 'Spend',
      children: [
        { name: 'Salaries', value: 930 }, { name: 'Hosting', value: 180 },
        { name: 'Commission', value: 140 }, { name: 'Office', value: 96 },
        { name: 'Tooling', value: 74 }, { name: 'Travel', value: 62 },
        { name: 'Legal', value: 54 },
      ],
    },
  },
};
