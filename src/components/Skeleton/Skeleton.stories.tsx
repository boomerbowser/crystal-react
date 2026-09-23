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
          'It **wraps** the content it stands in for rather than being rendered instead of it, '
          + 'and that is not a convenience: a skeleton swapped out by its caller has already '
          + 'unmounted when the data arrives, so there is nothing left to play '
          + '`skeleton-resolve` on. Owning the swap is the only way the resolve exists.\n\n'
          + '"`aria-hidden` … must not be read as content": the shapes are out of the '
          + 'accessibility tree, and **one** polite live region says what is loading. Twelve '
          + 'skeleton lines announcing themselves twelve times is not more information.\n\n'
          + '"Matches the real content\'s radius and rhythm exactly" is the caller\'s job and '
          + 'cannot be otherwise — only they know what is coming. What this provides is the '
          + 'material and the shapes to say it with.',
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
