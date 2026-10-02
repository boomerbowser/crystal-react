import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardShell } from './DashboardShell.js';
import { StatusBar } from '../StatusBar/StatusBar.js';
import { Statistic } from '../Statistic/Statistic.js';

const meta = {
  title: 'Blocks/DashboardShell',
  component: DashboardShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '"Landmarks in place: banner, navigation, main, contentinfo. One main." That is '
          + '`AppShell`\'s contract, so this does not restate it. A block that drew its own '
          + 'landmarks would put a second set on the page.\n\n'
          + 'The block adds one thing to the shell: the content is a grid that reflows. A '
          + 'shell is a primitive with one job, and a dashboard is a shell that has decided '
          + 'what goes in it.\n\n'
          + 'The grid reflows by container width, not viewport width. A dashboard inside a '
          + 'split view or a workspace pane is narrower than the window, and a media query '
          + 'would give it three columns in a 300px pane.', /* crystal-allow-literal: prose about a viewport that is not a value this component sets */
      },
    },
  },
  args: { gridLabel: 'Sales' },
} satisfies Meta<typeof DashboardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: <div style={{ padding: 12 }}>Acme</div>,
    sidebar: <div style={{ padding: 12 }}><a href="#reports">Reports</a></div>,
    footer: <StatusBar status="All changes saved" />,
    children: (
      <>
        <Statistic label="Revenue" value="£41,200" />
        <Statistic label="Orders" value="1,204" />
        <Statistic label="Refunds" value="18" />
      </>
    ),
  },
};
