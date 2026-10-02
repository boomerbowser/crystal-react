import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageCompare } from './ImageCompare.js';

const meta = {
  title: 'Data display/Image compare',
  component: ImageCompare,
  parameters: {
    docs: {
      description: {
        component:
          '"The divider is a slider with a percentage value and keyboard steps." A divider that '
          + 'is only draggable is a control nobody without a pointer can use, and one that looks '
          + 'like a slider without the role announces nothing. So it is React Aria\'s slider, '
          + 'with the role, the value, arrow keys with Home and End, and `aria-valuetext`, so it '
          + 'says "62%" rather than "62". It uses `style: \'unit\'` with the percent unit. '
          + '`style: \'percent\'` multiplies by a hundred and would announce "6,200%".\n\n'
          + 'The top picture is clipped. A width would squash it, and a squashed picture is two '
          + 'pictures at different scales presented as the same one. Both carry their own `alt`, '
          + 'because a reader told about one of them has been told half the comparison.',
      },
    },
  },
  args: {
    before: { src: '/facade-before.jpg', alt: 'The façade before cleaning' },
    after: { src: '/facade-after.jpg', alt: 'The façade after cleaning' },
    label: 'Before and after cleaning',
    defaultValue: 50,
    ratio: 16 / 9,
  },
} satisfies Meta<typeof ImageCompare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Started to one side, which is what a comparison usually wants: enough of the
 *  "before" to recognise it and enough of the "after" to see the difference. */
export const OffCentre: Story = { args: { defaultValue: 30 } };
