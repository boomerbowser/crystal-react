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
          '"Toggles are buttons with a pressed state; hidden series are announced." The second '
          + 'half is the one that gets left out: turning a series off changes the picture, and a '
          + 'reader who cannot see the picture is told nothing unless somebody says it.\n\n'
          + 'Selection is **weight**. A shown entry is heavier than a hidden one; the swatch '
          + 'beside it says which series the entry is for, never whether it is showing. That '
          + "matters more here than usual, because a legend entry's one distinguishing feature "
          + 'is already a colour.\n\n'
          + 'The swatch carries the series\' second channel too — the dash for a line, the shape '
          + 'for a point — so a reader matching the legend to the chart is matching the same two '
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

/** A key: it names the series and does nothing else, so it is text rather than
 *  buttons. A button that does nothing is worse than a label. */
export const AKey: Story = {};

/** Toggling. The swatch stays at full strength on a hidden series — it says
 *  which series the entry is for, and fading it would leave a reader working out
 *  whether they are looking at a pale series or a hidden one. */
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

/** Named for the marks it names: a line chart's legend draws lines, with each
 *  series' own dash. */
export const ForLines: Story = { args: { mark: 'line' } };

/** And a scatter's draws its shapes. */
export const ForPoints: Story = { args: { mark: 'point' } };
