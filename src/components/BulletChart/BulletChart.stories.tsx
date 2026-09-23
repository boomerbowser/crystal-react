import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulletChart } from './BulletChart.js';

const meta = {
  title: 'Charts/Bullet chart',
  component: BulletChart,
  parameters: {
    docs: {
      description: {
        component:
          '`role="meter"` with the target stated in text, which is the whole difference between '
          + 'this and a progress bar: a bullet chart is a *reading against a target*, and the '
          + 'target is the point. A reader told "62" has been told nothing; "62 of a target of '
          + '80, acceptable" is the sentence the picture is drawing, so that sentence is on the '
          + 'screen as well as in the meter.\n\n'
          + '"The target is a crisp marker, not a bar." A bar drawn to the target would be a '
          + 'second measurement, and the eye would compare two lengths rather than a length '
          + 'against a line.\n\n'
          + '"Haze range bands" — the qualitative ranges are steps of Crystal\'s intensity ramp, '
          + 'so "acceptable" and "good" are a scale rather than three colours somebody chose. '
          + 'Every band is named, because a band with no name is a colour.',
      },
    },
  },
  args: {
    label: 'Revenue against plan',
    value: 62,
    target: 80,
    ranges: [
      { to: 50, name: 'below plan' },
      { to: 75, name: 'acceptable' },
      { to: 100, name: 'good' },
    ],
    format: (value: number) => `£${value}k`,
  },
} satisfies Meta<typeof BulletChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PastTheTarget: Story = { args: { value: 92 } };

/** Several in a column, which is what the chart is for: one row per measure,
 *  each against its own target. */
export const AColumn: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '20px' }}>{/* crystal-allow-literal: story scaffolding */}
      <BulletChart label="Revenue" value={62} target={80} format={(v) => `£${v}k`} ranges={[{ to: 50, name: 'below plan' }, { to: 75, name: 'acceptable' }, { to: 100, name: 'good' }]} />
      <BulletChart label="New accounts" value={184} target={150} min={0} max={200} ranges={[{ to: 100, name: 'below plan' }, { to: 150, name: 'acceptable' }, { to: 200, name: 'good' }]} />
      <BulletChart label="Churn" value={4.2} target={3} min={0} max={8} format={(v) => `${v}%`} ranges={[{ to: 3, name: 'good' }, { to: 5, name: 'acceptable' }, { to: 8, name: 'above plan' }]} />
    </div>
  ),
};

/** With no bands at all: a measure and a target. */
export const NoBands: Story = { args: { ranges: [] } };
