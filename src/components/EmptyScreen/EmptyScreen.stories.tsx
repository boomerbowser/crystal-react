import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyScreen } from './EmptyScreen.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/EmptyScreen',
  component: EmptyScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"Says what would be here and offers the action that creates it." The catalogue '
          + 'lists this beside `empty-state`, and the difference is all this adds: '
          + '`EmptyState` is a region that has come up empty, this is a view that has. The '
          + 'frame is new — the view\'s height, its safe areas, a cap at the reading measure. '
          + 'The painting is not: `EmptyState` already carries the Haze fill and content '
          + 'radius, and adding them again would put a Haze pad inside a Haze pad.\n\n'
          + 'It does not claim the view heading. A view whose content region is empty is '
          + 'still that view, and its page header goes on naming it.',
      },
    },
  },
  args: { title: 'No reports yet' },
} satisfies Meta<typeof EmptyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Reports you build will be listed here.',
    actions: <Button>New report</Button>,
  },
};

export const NoResults: Story = {
  args: { state: 'no-results', title: 'No reports match those filters', children: 'Try widening the date range.' },
};
