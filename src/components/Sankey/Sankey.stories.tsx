import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sankey } from './Sankey.js';

const meta = {
  title: 'Charts/Sankey',
  component: Sankey,
  parameters: {
    docs: {
      description: {
        component:
          '"Each link states its endpoints and volume as text." A sankey is the chart whose '
          + 'picture is least recoverable in words — a reader who cannot see it cannot be told '
          + '"the shape of the flow" — so every link is a mark that names both ends and its '
          + 'size, and the table lists every one. Naming only the nodes would leave the entire '
          + 'content of the chart undescribed: the nodes are the labels, the links are the '
          + 'data.\n\n'
          + '"Link opacity keeps crossings readable" — Crystal\'s link opacity, higher than a '
          + 'fill\'s because a link *is* the mark rather than its backing, and low enough that '
          + 'a crossing reads as two links rather than as a third shape.',
      },
    },
  },
  args: {
    label: 'Where traffic goes',
    description: 'Sessions last week',
    nodes: [
      { name: 'Search' }, { name: 'Direct' }, { name: 'Referral' },
      { name: 'Browsed' }, { name: 'Signed up' }, { name: 'Left' }, { name: 'Paid' },
    ],
    links: [
      { source: 'Search', target: 'Browsed', value: 3200 },
      { source: 'Search', target: 'Left', value: 1800 },
      { source: 'Direct', target: 'Browsed', value: 1400 },
      { source: 'Direct', target: 'Signed up', value: 620 },
      { source: 'Referral', target: 'Browsed', value: 800 },
      { source: 'Referral', target: 'Left', value: 260 },
      { source: 'Browsed', target: 'Signed up', value: 1900 },
      { source: 'Browsed', target: 'Left', value: 3500 },
      { source: 'Signed up', target: 'Paid', value: 940 },
      { source: 'Signed up', target: 'Left', value: 1580 },
    ],
    format: (value: number) => value.toLocaleString('en-GB'),
  },
} satisfies Meta<typeof Sankey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Two stages, where the chart is simply a split. */
export const OneSplit: Story = {
  args: {
    label: 'Signups by source',
    nodes: [{ name: 'Search' }, { name: 'Direct' }, { name: 'Signed up' }, { name: 'Left' }],
    links: [
      { source: 'Search', target: 'Signed up', value: 420 },
      { source: 'Search', target: 'Left', value: 980 },
      { source: 'Direct', target: 'Signed up', value: 310 },
      { source: 'Direct', target: 'Left', value: 190 },
    ],
  },
};
