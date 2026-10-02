import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, SkeletonBox } from './Skeleton.js';

const placeholder = (
  <>
    <SkeletonBox shape="title" width="45%" />
    <SkeletonBox />
    <SkeletonBox />
    <SkeletonBox width="62%" />
  </>
);

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          'It wraps the content it stands in for instead of being rendered in its place. A '
          + 'skeleton swapped out by its caller has already unmounted when the data arrives, so '
          + 'there is nothing left to play `skeleton-resolve` on. The resolve exists only because '
          + 'the skeleton owns the swap.\n\n'
          + '"`aria-hidden` … must not be read as content": the shapes are out of the '
          + 'accessibility tree, and one polite live region says what is loading, so twelve '
          + 'skeleton lines are not announced twelve times.\n\n'
          + '"Matches the real content\'s radius and rhythm exactly" is the caller\'s job, because '
          + 'only the caller knows what is coming. This component provides the material and the '
          + 'shapes.',
      },
    },
  },
  args: { loading: true, placeholder, label: 'Loading invoices' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Resolved: Story = {
  args: {
    loading: false,
    children: 'Invoice 4417 — £1,280.00, due 14 October.',
  },
};

export const Shapes: Story = {
  args: {
    placeholder: (
      <>
        <SkeletonBox shape="circle" />
        <SkeletonBox shape="title" width="40%" />
        <SkeletonBox shape="block" />
      </>
    ),
  },
};
