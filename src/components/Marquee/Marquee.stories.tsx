import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Marquee } from './Marquee.js';

const Items = () => (
  <>
    {['Plastic', 'Frost', 'Resin', 'Haze', 'Stone', 'Mirage'].map((name) => (
      <span key={name} style={{ padding: '0 var(--cr-space)', whiteSpace: 'nowrap', fontWeight: 650 }}>
        {name}
      </span>
    ))}
  </>
);

const meta = {
  title: 'Data display/Marquee',
  component: Marquee,
  parameters: {
    docs: {
      description: {
        component:
          'The one component in Crystal whose default state is movement at rest, which is the '
          + 'rule Crystal otherwise holds absolutely. The catalogue lists it anyway, and the '
          + 'reconciliation is the last clause of its own semantics line — "removed entirely '
          + 'under reduced motion". So it is motion a reader can switch off system-wide and, '
          + 'until they do, stop by pointing at it or tabbing to it. None of that is optional '
          + 'here: under reduced motion the animation and the duplicate copy both go, and the '
          + 'viewport takes a tab stop so "pausable on focus" means something without a '
          + 'pointer.\n\n'
          + 'Crystal assigns no duration and could not: a continuous scroll depends on how long '
          + 'the content is. `speed` is therefore a rate in pixels per second, and the duration '
          + 'is measured from the rendered width — then gated by `--cr-motion-enabled` and '
          + 'divided by the reader\'s motion-speed preference, the same as every recipe.',
      },
    },
  },
  args: { label: 'Crystal materials', speed: 60, children: <Items /> },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Faster, and the other way. Point at it or tab to it and it stops. */
export const Reversed: Story = {
  args: { reverse: true, speed: 120 },
};

/** Two at different rates, so the pause-on-hover is visible: the one you are
 *  pointing at stops and the other carries on. */
export const Pausing: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-space)' }}>
      <Marquee {...only(args)} label="Crystal materials, slow" speed={40} />
      <Marquee {...only(args)} label="Crystal materials, fast" speed={140} />
    </div>
  ),
};
