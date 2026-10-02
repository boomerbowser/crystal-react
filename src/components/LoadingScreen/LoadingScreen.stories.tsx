import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingScreen } from './LoadingScreen.js';

const meta = {
  title: 'Screens/LoadingScreen',
  component: LoadingScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"`aria-busy` on the region; the wait is announced once, not repeatedly." '
          + '"Skeletons match the shape of what is coming."\n\n'
          + 'The second sentence is why this composes `Skeleton` rather than `Loader`: a '
          + 'spinner says something is happening, a skeleton says what is about to be there, '
          + 'so the layout does not jump when it arrives.\n\n'
          + '"Announced once" is a count of live regions. One `Skeleton` holds every shape. '
          + 'Twelve skeletons would be twelve regions, and a '
          + 'screen reader would say the same sentence twelve times. Where the shape is '
          + 'unknown the screen falls back to a spinner, because a skeleton of the '
          + 'wrong shape is a promise the arriving content breaks.',
      },
    },
  },
  args: { label: 'Loading the report' },
} satisfies Meta<typeof LoadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: (
      <>
        <div style={{ blockSize: 32, inlineSize: '40%' }} />
        <div style={{ blockSize: 16 }} />
        <div style={{ blockSize: 16 }} />
        <div style={{ blockSize: 16, inlineSize: '70%' }} />
      </>
    ),
  },
};

export const ShapeNotKnownYet: Story = { args: {} };
