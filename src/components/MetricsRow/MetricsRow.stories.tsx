import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricsRow } from './MetricsRow.js';
import { Statistic } from '../Statistic/Statistic.js';

const meta = {
  title: 'Blocks/MetricsRow',
  component: MetricsRow,
  parameters: {
    docs: {
      description: {
        component:
          '"A labelled list of figures." A screen reader saying "list, four items" before '
          + 'the first one tells the reader how much is coming, which is most of what they '
          + 'need from a dashboard\'s summary band; four sibling divs say nothing at all.\n\n'
          + 'Loading is announced once for the band rather than once per tile. Six tiles each '
          + 'saying they are loading is a screen reader saying the same sentence six times — '
          + 'the same shape as `LoadingScreen` rendering one skeleton over many shapes.\n\n'
          + 'Empty is a state rather than an absent row: a dashboard whose metrics have not '
          + 'been chosen yet renders nothing at all from a bare `map`, and the reader is left '
          + 'looking at a gap where a band should be.',
      },
    },
  },
  args: { label: 'This month' },
} satisfies Meta<typeof MetricsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Statistic label="Revenue" value="£41,200" trend={{ direction: 'up', label: '4.2% up on last month' }} />
        <Statistic label="Orders" value="1,204" trend={{ direction: 'up', label: '4.2% up on last month' }} />
        <Statistic label="Refunds" value="18" trend={{ direction: 'down', label: '6 fewer than last month' }} />
        <Statistic label="Average order" value="£34.22" />
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: (
      <>
        <Statistic label="Revenue" value="—" loading />
        <Statistic label="Orders" value="—" loading />
        <Statistic label="Refunds" value="—" loading />
      </>
    ),
  },
};

export const NothingChosen: Story = {
  args: { empty: <p>Choose the metrics you want to watch.</p> },
};
