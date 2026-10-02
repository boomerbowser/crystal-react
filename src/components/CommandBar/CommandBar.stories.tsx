import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommandBar } from './CommandBar.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/CommandBar',
  component: CommandBar,
  parameters: {
    docs: {
      description: {
        component:
          '"`role="toolbar"` with one tab stop." "Pill; overflow to a menu."\n\n'
          + 'This component pairs two existing ones. `Toolbar` is React Aria\'s roving tab '
          + 'index. Eight commands that each took a tab stop would put eight presses between '
          + 'the reader and the next field. '
          + '`OverflowList` is the measuring row that moves what does not fit into an '
          + 'affordance naming its count.\n\n'
          + 'An item that overflows leaves the toolbar, and its roving tab index with it, '
          + 'because it is in a menu now. The overflow trigger must therefore be a toolbar '
          + 'item itself, so it is rendered inside the same row.',
      },
    },
  },
  args: {
    'aria-label': 'Report commands',
    renderOverflow: (_hidden, count) => <Button>{count} more</Button>,
  },
} satisfies Meta<typeof CommandBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Button>Export</Button>
        <Button>Share</Button>
        <Button>Duplicate</Button>
      </>
    ),
  },
};

export const Overflowing: Story = {
  args: {
    children: (
      <>
        <Button>Export</Button>
        <Button>Share</Button>
        <Button>Duplicate</Button>
        <Button>Schedule</Button>
        <Button>Archive</Button>
        <Button>Permissions</Button>
        <Button>Delete</Button>
      </>
    ),
  },
  decorators: [(Story) => <div style={{ inlineSize: 560 }}><Story /></div>],
};
