import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLegend } from './ChartLegend.js';

const meta = {
  title: 'Charts/Chart legend',
  component: ChartLegend,
  parameters: {
    docs: {
      description: {
        component:
          '"Toggles are buttons with a pressed state; hidden series are announced." Turning a '
          + 'series off changes the picture, and a reader who cannot see the picture is told '
          + 'nothing unless the change is announced.\n\n'
          + 'Selection is weight. A shown entry is heavier than a hidden one. The swatch '
          + 'beside it says which series the entry is for, never whether it is showing. This '
          + "matters more here than usual, because a legend entry's one distinguishing feature "
          + 'is already a colour.\n\n'
          + 'The swatch also carries the series\' second channel (the dash for a line, the shape '
          + 'for a point), so a reader matching the legend to the chart matches the same two '
          + 'things in both places.',
      },
    },
  },
  args: {
    entries: [
      { name: 'Revenue', index: 0 },
      { name: 'Costs', index: 1 },
      { name: 'Margin', index: 2 },
    ],
  },
} satisfies Meta<typeof ChartLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A key names the series and does nothing else, so it renders as text and
 *  not as buttons. A button that does nothing is worse than a label. */
export const AKey: Story = {};

/** Toggling. The swatch stays at full strength on a hidden series. It says
 *  which series the entry is for, and fading it would leave a reader unable to
 *  tell a pale series from a hidden one. */
export const Toggling: Story = {
  render: function Toggling(args) {
    const [hidden, setHidden] = useState<string[]>(['Costs']);
    return (
      <ChartLegend
        entries={args.entries.map((entry) => ({ ...entry, shown: !hidden.includes(entry.name) }))}
        onToggle={(name, shown) => setHidden((was) => (
          shown ? was.filter((one) => one !== name) : [...was, name]
        ))}
      />
    );
  },
};

/** The swatch matches the marks it names. A line chart's legend draws lines,
 *  with each series' own dash. */
export const ForLines: Story = { args: { mark: 'line' } };

/** A scatter chart's legend draws its point shapes. */
export const ForPoints: Story = { args: { mark: 'point' } };
