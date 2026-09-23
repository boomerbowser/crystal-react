import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart } from './BarChart.js';

const meta = {
  title: 'Charts/Bar chart',
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Bars keep a small radius on the value end only." The base end stays square because '
          + 'it sits on the axis; rounding it would lift the bar off the line it is measured '
          + 'from.\n\n'
          + 'The value axis always includes zero. A bar is a *length*, and a length read from a '
          + 'baseline that is not zero exaggerates every difference in the data — so this chart '
          + 'does not offer the option. Charts whose marks are positions rather than lengths, '
          + 'like the line chart, fit their domain to the data instead.\n\n'
          + 'One tab stop for the plot, arrow keys between the bars, and every bar carries its '
          + 'own label: "February, Revenue, 18".',
      },
    },
  },
  args: {
    label: 'Revenue and costs by month',
    description: 'Half-year to June, in thousands of pounds',
    series: [
      { name: 'Revenue', values: [12, 18, 15, 22, 19, 26] },
      { name: 'Costs', values: [8, 9, 11, 10, 12, 13] },
    ],
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    format: (value: number) => `£${value}k`,
  },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {};

/** Stacked, where the question is the total as well as the parts. */
export const Stacked: Story = { args: { stacked: true } };

/** One series is the common case, and it is the one where colour carries
 *  nothing: there is nothing to tell apart. */
export const OneSeries: Story = {
  args: {
    label: 'Revenue by month',
    series: [{ name: 'Revenue', values: [12, 18, 15, 22, 19, 26] }],
  },
};

/** Values below zero stack away from the axis in their own direction rather
 *  than cancelling, and the radius follows the value end down. */
export const BelowZero: Story = {
  args: {
    label: 'Net movement by month',
    description: 'Cash in and out, in thousands of pounds',
    series: [{ name: 'Net', values: [12, -6, 15, -9, 4, 26] }],
  },
};

export const Empty: Story = {
  args: { label: 'Revenue by month', series: [], categories: [] },
};
