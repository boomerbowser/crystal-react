import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Pagination } from '../Pagination/Pagination.js';
import { DataView } from './DataView.js';

/* Narrow enough to fire the container query, which this story demonstrates. */
const NARROW = '360px'; // crystal-allow-literal: the story's frame, not a design value

const workspaces = ['Gather', 'Atlas', 'Harbour', 'Prism', 'Ion', 'Cobalt'];

const items = workspaces.map((name) => ({
  id: name.toLowerCase(),
  content: (
    <>
      <h3 style={{ margin: 0, fontSize: 'var(--cr-text-subheading-size)' }}>{name}</h3>
      <p style={{ marginBlock: 'var(--cr-spacing-2xs) 0', color: 'var(--cr-muted)' }}>
        Team plan · 12 seats
      </p>
    </>
  ),
}));

const meta = {
  title: 'Data display/Data view',
  component: DataView,
  parameters: {
    docs: {
      description: {
        component:
          'A collection rendered as a list or a grid. It is a real `ul` in both, because a '
          + 'grid of items is still a list of items. The arrangement is a visual choice and the '
          + 'count is information, so a reader is told "6 items" either way and switching layout '
          + 'does not change what they were told.\n\n'
          + 'The catalogue asks for "a control with a pressed state, not a hidden toggle", and the '
          + 'switch here is a named radio group. Picking one of two arrangements is a choice, and '
          + 'both Crystal and React Aria treat it that way: Crystal\'s `SegmentedControl` is a '
          + 'radio group, and React Aria\'s `ToggleButtonGroup` renders `role="radiogroup"` when '
          + 'its selection is single. The clause rules out two unlabelled icons whose state is a '
          + 'colour, and a named group rules that out at least as firmly.\n\n'
          + 'The breakpoint is a container query, not a media query. The same collection is a '
          + 'grid in a full-width page and a list in a narrow sidebar of the same window, and only '
          + 'the container knows which. Below it the switch is removed, not made inert, '
          + 'because a control that cannot change anything is worse than no control.',
      },
    },
  },
  args: { items, label: 'Workspaces', defaultLayout: 'grid' },
} satisfies Meta<typeof DataView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AGrid: Story = {};

export const AList: Story = { args: { defaultLayout: 'list' } };

/** With the toolbar where the catalogue's "sorting and paging" belongs.
 *  `Pagination` is its own component, placed in this frame. */
export const WithPaging: Story = {
  args: {
    items: items.slice(0, 3),
    toolbar: (
      <Pagination total={4} page={1} onPageChange={() => undefined} aria-label="Workspace pages" />
    ),
  },
};

/** Narrow enough that the container query fires: the grid becomes a list and the
 *  switch goes away. Resize the frame, not the window, to watch it. */
export const InANarrowContainer: Story = {
  render: (args) => (
    <div style={{ inlineSize: NARROW }}>
      <DataView {...only(args)} />
    </div>
  ),
};

export const Empty: Story = {
  args: { items: [], empty: 'No workspaces yet.' },
};
