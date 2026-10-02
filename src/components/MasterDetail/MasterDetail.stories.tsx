import type { Meta, StoryObj } from '@storybook/react-vite';
import { MasterDetail } from './MasterDetail.js';
import { EmptyState } from '../EmptyState/EmptyState.js';

const meta = {
  title: 'Screens/MasterDetail',
  component: MasterDetail,
  parameters: {
    docs: {
      description: {
        component:
          '"Selection moves focus to the detail only when the layout has collapsed."\n\n'
          + 'Wide, both panes are on screen: moving focus when a row is chosen would take the '
          + 'reader out of the list they are still arrowing down, and the detail changed where '
          + 'they can see it. Collapsed, the detail has replaced the list, so a reader left on '
          + 'a list that is no longer displayed is focused on nothing and their next key press '
          + 'goes to a control that is not there.\n\n'
          + 'The same action means two different things depending on a media query, which is '
          + 'why it is driven at two viewports in the behaviour gate. The breakpoint is '
          + 'Crystal\'s `md`, taken from the generated token export rather than retyped.',
      },
    },
  },
  args: { listLabel: 'Messages', detailLabel: 'Message' },
} satisfies Meta<typeof MasterDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const list = (
  <ul style={{ margin: 0, padding: 16 }}>
    <li>The quarterly figures</li>
    <li>Re: the quarterly figures</li>
  </ul>
);

export const Default: Story = {
  args: { list, selectedKey: 'a', children: <p>The quarterly figures are attached.</p> },
};

export const NothingChosen: Story = {
  args: {
    list,
    selectedKey: null,
    emptySelection: <EmptyState state="empty" title="Choose a message to read" />,
  },
};
