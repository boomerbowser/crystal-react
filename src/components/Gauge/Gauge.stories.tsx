import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge } from './Gauge.js';

const meta = {
  title: 'Charts/Gauge',
  component: Gauge,
  parameters: {
    docs: {
      description: {
        component:
          '`role="meter"` with a text value, so this is not a progress bar bent into a circle. '
          + 'A meter is a *measurement within a known range*, such as disk usage, a temperature '
          + 'or a score, and it is not heading towards an end. A progress bar is a task getting '
          + 'closer to finishing. The two announce differently.\n\n'
          + '"Threshold colour from status tokens", and never colour alone. A gauge told which '
          + "band its value is in takes that band's status colour and states the band's name "
          + 'both on screen and inside the meter\'s own text.\n\n'
          + 'The sweep and the stroke are Crystal\'s. The arc matches the ring progress stroke, '
          + 'as the catalogue requires, through one token, so a gauge and a ring progress cannot '
          + 'drift apart.',
      },
    },
  },
  args: { label: 'Disk used', value: 62, valueLabel: '62%' },
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** In a band that means something. The colour is Crystal's status token and the
 *  band is named, because colour is never the only signal. */
export const NearlyFull: Story = {
  args: { value: 94, valueLabel: '94%', status: 'danger', statusLabel: 'Nearly full' },
};

export const Healthy: Story = {
  args: { value: 28, valueLabel: '28%', status: 'success', statusLabel: 'Plenty free' },
};

/** A range that is not a percentage. */
export const ARangeOfItsOwn: Story = {
  args: {
    label: 'Flow temperature',
    value: 54,
    min: 20,
    max: 80,
    valueLabel: '54°C',
    status: 'attention',
    statusLabel: 'Above target',
  },
};

export const Small: Story = { args: { size: 96 } };
