import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnalyticsPanel } from './AnalyticsPanel.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Blocks/AnalyticsPanel',
  component: AnalyticsPanel,
  parameters: {
    docs: {
      description: {
        component:
          '"The chart carries a table equivalent; controls are real controls."\n\n'
          + 'The table equivalent is not this component\'s to add. '
          + '`ChartSurface` takes `table` as a required prop, so a chart in this library '
          + 'cannot exist without the same data as text. A panel that accepted a bare `<svg>` '
          + 'would be a way around that requirement.\n\n'
          + 'Three of its four states are where panels go wrong. A chart that is loading, '
          + 'empty or failed is usually drawn as an empty plot with axes. It says "zero" '
          + 'to anyone reading it, and zero is a number the data did not say. Each state '
          + 'replaces the chart and says which it is in words, while the heading and controls '
          + 'stay, because they are how the reader changes the range that might fix it.',
      },
    },
  },
  args: { title: 'Revenue by month', controls: <Button variant="quiet">Last 30 days</Button> },
} satisfies Meta<typeof AnalyticsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const plot = (
  <div style={{ blockSize: 160, display: 'grid', placeItems: 'center' }}>A chart surface</div>
);

export const Default: Story = { args: { children: plot } };
export const Loading: Story = { args: { state: 'loading', children: plot } };
export const NothingToChart: Story = { args: { state: 'empty', children: plot } };
export const Failed: Story = {
  args: { state: 'error', children: plot, errorActions: <Button>Try again</Button> },
};
