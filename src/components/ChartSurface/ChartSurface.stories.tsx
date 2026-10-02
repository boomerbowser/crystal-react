import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { seriesColour } from '../../charts/channel.js';
import { ChartSurface } from './ChartSurface.js';

const table = {
  columns: ['Month', 'Revenue (£k)'],
  rows: [
    ['January', 12], ['February', 18], ['March', 15],
    ['April', 22], ['May', 19], ['June', 26],
  ],
};

const meta = {
  title: 'Charts/Chart surface',
  component: ChartSurface,
  parameters: {
    docs: {
      description: {
        component:
          'The frame every chart draws into. It provides the Haze plot fill, the measured box, '
          + 'the axis gutters, the legend and tooltip slots, and the empty and loading states.\n\n'
          + '`table` is a required prop. Crystal\'s catalogue says "every chart owes a text '
          + 'equivalent of its data, so the chart is never the only representation". '
          + 'If a chart could be drawn without one, eventually one would be. No chart in this '
          + 'library renders a table of its own; they all pass their data through here.\n\n'
          + 'The plot is drawn in CSS pixels at the measured width, not in a scaled `viewBox`, '
          + 'so the stroke and point scales stay at the sizes Crystal published and do not '
          + 'stretch with the window.',
      },
    },
  },
  args: {
    label: 'Revenue by month',
    description: 'Half-year to June, in thousands of pounds',
    table,
  },
} satisfies Meta<typeof ChartSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The frame with a trivial mark in it, to show what the child is given. */
export const Default: Story = {
  render: (args) => (
    <ChartSurface {...only(args)}>
      {(frame) => (
        <rect
          x={frame.inner.x}
          y={frame.inner.y}
          width={frame.inner.width}
          height={frame.inner.height}
          fill={seriesColour(0)}
          opacity={0.25}
        />
      )}
    </ChartSurface>
  ),
};

/** Nothing to draw, and nothing coming. The caption, the frame and the table
 *  control all stay, because an empty chart still has a subject. */
export const Empty: Story = {
  render: (args) => <ChartSurface {...only(args)} empty table={{ columns: table.columns, rows: [] }} />,
};

/** Waiting. Nothing moves, because Crystal's rule is that nothing moves at rest
 *  and a chart waiting for data is at rest. The plot holds its size so the page
 *  does not jump when the numbers arrive. */
export const Loading: Story = {
  render: (args) => <ChartSurface {...only(args)} loading />,
};
