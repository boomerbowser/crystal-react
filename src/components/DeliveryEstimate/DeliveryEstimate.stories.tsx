import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeliveryEstimate } from './DeliveryEstimate.js';

const inThreeDays = new Date(2026, 9, 2);

const meta = {
  title: 'Commerce/Delivery estimate',
  component: DeliveryEstimate,
  parameters: {
    docs: {
      description: {
        component:
          '"An **absolute date**, not only a relative phrase." "Arrives in 3 days" stops being '
          + 'true the moment it is cached, screenshotted, emailed, or read the next morning — '
          + 'and it is unanswerable: a reader deciding whether the parcel beats a Friday has to '
          + 'do arithmetic with a date they were not given. So the date is always there and the '
          + 'relative phrase is additional. The `datetime` attribute is built from the local '
          + 'calendar fields rather than from `toISOString`, which returns the UTC day — the '
          + 'previous one for anybody east of Greenwich in the evening.',
      },
    },
  },
  args: { on: inThreeDays },
} satisfies Meta<typeof DeliveryEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The relative phrase beside the date, never instead of it. */
export const WithARelativePhrase: Story = {
  args: { on: inThreeDays, relative: 'in 3 days' },
};

/** The two states that are not a date. A blank space where a delivery date goes
 *  is indistinguishable from a delivery date of never, so both say so. */
export const WhileItIsUnknown: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <DeliveryEstimate loading />
      <DeliveryEstimate />
    </div>
  ),
};
