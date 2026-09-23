import type { Meta, StoryObj } from '@storybook/react-vite';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { LineChart } from './LineChart.js';

const meta = {
  title: 'Charts/Line chart',
  component: LineChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Series are distinguishable without colour alone." Here that is the dash pattern: '
          + 'solid first, then five patterns in multiples of the stroke. It is the one second '
          + 'channel that survives all three ways colour fails — dichromatic vision, a '
          + 'monochrome print, and forced colours replacing every hue with one.\n\n'
          + 'The domain is fitted to the data rather than forced through zero, which is the '
          + "opposite of the bar chart's rule for the opposite reason. A line's marks are "
          + '*positions*: a share price between 412 and 418 drawn from zero is a flat line that '
          + "hides the whole story. A bar's marks are *lengths*, and a length from a false "
          + 'baseline lies. Same data, different mark, different rule.\n\n'
          + 'Every point is reachable whether or not one is drawn, and each carries a hit area '
          + `of Crystal's action minimum (${crystalTokens['action.minTarget']}) regardless of how small the marker is.`,
      },
    },
  },
  args: {
    label: 'Sessions and signups by day',
    series: [
      { name: 'Sessions', values: [412, 418, 415, 430, 427, 441, 438] },
      { name: 'Signups', values: [12, 18, 15, 22, 19, 26, 24] },
    ],
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Eased through the points rather than straight between them. The curve is
 *  monotone, so it never invents a peak between two measurements. */
export const Smooth: Story = { args: { curve: 'smooth' } };

/** A gap breaks the line. Joining across a day nobody measured would draw a
 *  measurement nobody made. */
export const WithAGap: Story = {
  args: {
    label: 'Signups by day',
    series: [{ name: 'Signups', values: [12, 18, null, 22, 19, 26, 24] }],
  },
};

/** Dense, where drawing a marker at every point would draw a caterpillar. The
 *  points are still all reachable by keyboard. */
export const Dense: Story = {
  args: {
    label: 'Latency by minute',
    description: 'p95, milliseconds',
    points: false,
    series: [{
      name: 'p95',
      values: Array.from({ length: 40 }, (_, i) => 120 + Math.round(Math.sin(i / 3) * 18 + i * 0.6)),
    }],
    categories: Array.from({ length: 40 }, (_, i) => `${i}m`),
  },
};
