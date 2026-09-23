import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Empty state',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          '**"No-results and truly-empty are different states and read differently."** "No '
          + 'projects yet — create your first one" and "No projects match ‘wxyz’ — clear the '
          + 'filter" are opposite messages: one says the collection is new, the other says the '
          + 'reader is looking through the wrong window. A component with one empty state tells '
          + 'a reader with three hundred projects that they have none.\n\n'
          + 'So `state` is required and has no default — every default would be one of the four '
          + 'chosen silently for a caller who did not think about it, which is the mistake this '
          + 'entry exists to prevent.\n\n'
          + '"Real text; never an illustration alone": the illustration is `aria-hidden` and the '
          + 'title is required.',
      },
    },
  },
  args: { state: 'empty' as const, title: 'No projects yet' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TrulyEmpty: Story = {
  args: {
    children: 'Projects you create will appear here.',
    actions: <Button>New project</Button>,
  },
};

/* The same region, the opposite message. */
export const NoResults: Story = {
  args: {
    state: 'no-results',
    title: 'No projects match “wxyz”',
    children: 'Try a shorter search, or clear the filter.',
    actions: <Button>Clear filter</Button>,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    title: 'We could not load your projects',
    children: 'The service did not answer. Nothing has been lost.',
    actions: <Button>Try again</Button>,
  },
};

export const Unauthorised: Story = {
  args: { state: 'unauthorised', title: 'You do not have access to this list' },
};
