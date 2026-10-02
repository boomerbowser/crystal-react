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
          '"An absolute date, not only a relative phrase." "Arrives in 3 days" stops being '
          + 'true once it is cached, screenshotted, emailed, or read the next morning. A reader '
          + 'deciding whether the parcel arrives before Friday would also have to work it out '
          + 'from a date they were not given. So the date is always shown and the relative '
          + 'phrase is an addition. The `datetime` attribute is built from the local calendar '
          + 'fields, because `toISOString` returns the UTC day, which is the previous day for '
          + 'anybody east of Greenwich in the evening.',
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

/** The two states that are not a date. An empty space where a delivery date
 *  goes cannot be told apart from no delivery at all, so both say so in words. */
export const WhileItIsUnknown: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <DeliveryEstimate loading />
      <DeliveryEstimate />
    </div>
  ),
};
