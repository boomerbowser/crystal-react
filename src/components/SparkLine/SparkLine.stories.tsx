import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparkLine } from './SparkLine.js';

const meta = {
  title: 'Charts/Spark line',
  component: SparkLine,
  parameters: {
    docs: {
      description: {
        component:
          '"Needs a text summary beside it; it is never the only carrier of the value." The API '
          + 'enforces this: `summary` is required and it is rendered. A spark line has no axes, '
          + 'no labels and no scale. It shows only a shape, and a shape means nothing without a '
          + 'number beside it. Implementations that make the summary optional end up shipping '
          + 'the chart without it.\n\n'
          + 'It is the one chart in the slice that is not a `ChartSurface`: no caption, no '
          + 'legend, no plot fill, no disclosure. A spark line is a word in somebody else\'s '
          + 'sentence, and giving it a figure and a table would turn a table row holding six of '
          + 'them into six figures and six tables. The summary is the text equivalent.\n\n'
          + '"Stroke weight at small size" is Crystal\'s chart stroke, unchanged. The line is '
          + 'already twenty pixels tall, and a thinner one disappears on a low-contrast surface.',
      },
    },
  },
  args: {
    values: [12, 18, 15, 22, 19, 26, 24, 31],
    summary: '+42% this week',
  },
} satisfies Meta<typeof SparkLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** In a sentence, which is what it is for. */
export const InASentence: Story = {
  render: (args) => (
    <p style={{ maxWidth: '38em' }}>{/* crystal-allow-literal: a measure in the reader's own text */}
      {'Sessions have grown steadily since the pricing change '}
      <SparkLine {...args} />
      {' and the trend has held through two releases.'}
    </p>
  ),
};

/** Several in a column, sharing one fixed range so their shapes can be compared.
 *  Without `domain` each is scaled to its own extremes and two flat lines with
 *  very different values look identical. */
export const Comparable: Story = {
  render: () => (
    <table>
      <tbody>
        {[
          ['Direct', [40, 44, 42, 48, 51, 55], '+38%'],
          ['Referral', [8, 9, 7, 11, 10, 12], '+50%'],
          ['Search', [22, 21, 24, 23, 26, 25], '+14%'],
        ].map(([name, values, change]) => (
          <tr key={name as string}>
            <th scope="row" style={{ textAlign: 'start', paddingInlineEnd: '1em' }}>{name as string}</th>{/* crystal-allow-literal: story scaffolding, relative to the text */}
            <td>
              <SparkLine
                values={values as number[]}
                domain={[0, 60]}
                summary={change as string}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** Flat. There is no range to scale into, so it draws down the middle. */
export const Flat: Story = {
  args: { values: [5, 5, 5, 5, 5], summary: 'No change' },
};
