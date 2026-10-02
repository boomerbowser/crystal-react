import type { Meta, StoryObj } from '@storybook/react-vite';
import { MeterGroup } from './MeterGroup.js';

const meta = {
  title: 'Feedback/Meter group',
  component: MeterGroup,
  parameters: {
    docs: {
      description: {
        component:
          'Several proportions on one bar. **Each segment is its own `role="meter"`.** "63% '
          + 'disk, 22% cache" is two measurements, and an element reporting a single number '
          + 'would have to pick which one it meant.\n\n'
          + '"Meaning never rests on colour alone", so the legend is on by default: it is where '
          + "each segment's name is written beside its swatch, and the same name is the "
          + "segment's own accessible name. The tints are Crystal's chart series scale, not a "
          + 'second scale invented here.\n\n'
          + '"Segments meet without gaps": one track with `overflow: hidden`, so the radius '
          + 'belongs to the track and each segment ends where the next begins.',
      },
    },
  },
  args: {
    label: 'Storage',
    segments: [
      { name: 'Documents', value: 40 },
      { name: 'Media', value: 25 },
      { name: 'Cache', value: 10 },
    ],
  },
} satisfies Meta<typeof MeterGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* With a total, the part the segments do not account for is left empty, which
   is what a total is for. */
export const AgainstAKnownWhole: Story = { args: { total: 100 } };

export const WithStatuses: Story = {
  args: {
    label: 'Build results',
    segments: [
      { name: 'Passed', value: 128, status: 'success' },
      { name: 'Flaky', value: 9, status: 'attention' },
      { name: 'Failed', value: 3, status: 'danger' },
    ],
  },
};

export const WithoutTheLegend: Story = { args: { legend: false } };
